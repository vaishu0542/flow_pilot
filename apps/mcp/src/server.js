import { randomUUID } from 'node:crypto';
import axios from 'axios';
import express from 'express';
import cors from 'cors';
import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

const app = createMcpExpressApp({ host: '0.0.0.0', allowedHosts: ['localhost', '127.0.0.1'] });
const port = Number(process.env.PORT || 4001);
const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:4000/api';

let cachedToken = null;
const adminCredentials = {
  email: process.env.BACKEND_ADMIN_EMAIL || 'demo@flowpilot.app',
  password: process.env.BACKEND_ADMIN_PASSWORD || 'FlowPilot123!'
};

const sessions = new Map();

async function getBackendToken() {
  const response = await axios.post(`${backendBaseUrl}/auth/login`, adminCredentials, {
    timeout: 10000
  });

  cachedToken = response.data.token;
  return cachedToken;
}

async function refreshBackendToken() {
  return getBackendToken();
}

async function backendRequest(method, path, payload = null) {
  const token = await getBackendToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    },
    timeout: 10000
  };

  try {
    if (method === 'get') {
      return await axios.get(`${backendBaseUrl}${path}`, config);
    }
    if (method === 'post') {
      return await axios.post(`${backendBaseUrl}${path}`, payload, config);
    }
    if (method === 'put') {
      return await axios.put(`${backendBaseUrl}${path}`, payload, config);
    }
    if (method === 'patch') {
      return await axios.patch(`${backendBaseUrl}${path}`, payload, config);
    }
    if (method === 'delete') {
      return await axios.delete(`${backendBaseUrl}${path}`, config);
    }

    throw new Error(`Unsupported method: ${method}`);
  }
  catch (error) {
    if (error.response?.status === 401 || error.response?.data?.error === 'Invalid or expired token.' || error.response?.data?.error === 'User not found.') {
      const refreshedToken = await refreshBackendToken();
      const retryConfig = {
        headers: {
          Authorization: `Bearer ${refreshedToken}`
        },
        timeout: 10000
      };

      if (method === 'get') {
        return axios.get(`${backendBaseUrl}${path}`, retryConfig);
      }
      if (method === 'post') {
        return axios.post(`${backendBaseUrl}${path}`, payload, retryConfig);
      }
      if (method === 'put') {
        return axios.put(`${backendBaseUrl}${path}`, payload, retryConfig);
      }
      if (method === 'patch') {
        return axios.patch(`${backendBaseUrl}${path}`, payload, retryConfig);
      }
      if (method === 'delete') {
        return axios.delete(`${backendBaseUrl}${path}`, retryConfig);
      }
    }

    throw error;
  }
}

function textResult(value) {
  return {
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }]
  };
}

function getServer() {
  const server = new McpServer({
    name: 'flowpilot-mcp-server',
    version: '1.0.0'
  });

  server.registerTool('create_workflow', {
    description: 'Create a new workflow in FlowPilot',
    inputSchema: {
      title: z.string().min(1).describe('Workflow title'),
      description: z.string().optional().describe('Short description'),
      department: z.string().optional().describe('Department name'),
      category: z.string().optional().describe('Workflow category'),
      purpose: z.string().optional().describe('Business purpose of the workflow'),
      usageInstructions: z.string().optional().describe('When to use the process'),
      requiredInformation: z.array(z.string()).optional().describe('Documents or information required'),
      steps: z.array(z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        responsibleRole: z.string().optional(),
        checklistItems: z.array(z.string()).optional()
      })).optional(),
      expectedOutcome: z.string().optional().describe('Expected outcome'),
      status: z.enum(['Draft', 'Published']).optional().describe('Workflow status'),
      visibility: z.enum(['private', 'shared']).optional().describe('Visibility'),
      reviewDate: z.string().optional().describe('Review date as ISO string')
    }
  }, async (args) => {
    try {
      const response = await backendRequest('post', '/workflows', args);
      return textResult({ success: true, workflow: response.data.workflow });
    }
    catch (error) {
      return textResult({ success: false, error: error.response?.data?.error || error.message });
    }
  });

  server.registerTool('list_workflows', {
    description: 'List workflows in the current workspace',
    inputSchema: {
      department: z.string().optional(),
      category: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional()
    }
  }, async (args) => {
    try {
      const params = new URLSearchParams();
      Object.entries(args).forEach(([key, value]) => {
        if (value) {
          params.append(key, String(value));
        }
      });
      const response = await backendRequest('get', `/workflows${params.toString() ? `?${params.toString()}` : ''}`);
      return textResult(response.data.workflows);
    }
    catch (error) {
      return textResult({ success: false, error: error.response?.data?.error || error.message });
    }
  });

  server.registerTool('get_workflow', {
    description: 'Retrieve a specific workflow by ID',
    inputSchema: {
      id: z.string().min(1).describe('Workflow ID')
    }
  }, async ({ id }) => {
    try {
      const response = await backendRequest('get', `/workflows/${id}`);
      return textResult(response.data.workflow);
    }
    catch (error) {
      return textResult({ success: false, error: error.response?.data?.error || error.message });
    }
  });

  server.registerTool('update_workflow', {
    description: 'Update workflow information',
    inputSchema: {
      id: z.string().min(1),
      title: z.string().optional(),
      description: z.string().optional(),
      department: z.string().optional(),
      category: z.string().optional(),
      purpose: z.string().optional(),
      usageInstructions: z.string().optional(),
      requiredInformation: z.array(z.string()).optional(),
      expectedOutcome: z.string().optional(),
      status: z.enum(['Draft', 'Published']).optional(),
      visibility: z.enum(['private', 'shared']).optional(),
      reviewDate: z.string().optional(),
      steps: z.array(z.object({
        id: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        responsibleRole: z.string().optional(),
        checklistItems: z.array(z.string()).optional()
      })).optional()
    }
  }, async (args) => {
    const { id, ...updates } = args;
    try {
      const response = await backendRequest('put', `/workflows/${id}`, updates);
      return textResult({ success: true, workflow: response.data.workflow });
    }
    catch (error) {
      return textResult({ success: false, error: error.response?.data?.error || error.message });
    }
  });

  server.registerTool('add_workflow_step', {
    description: 'Add a step to an existing workflow',
    inputSchema: {
      workflowId: z.string().min(1),
      step: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        responsibleRole: z.string().optional(),
        checklistItems: z.array(z.string()).optional()
      })
    }
  }, async ({ workflowId, step }) => {
    try {
      const existing = await backendRequest('get', `/workflows/${workflowId}`);
      const details = existing.data.workflow;
      const steps = [...(details.steps || []), { id: `step_${randomUUID()}`, ...step, checklistItems: step.checklistItems || [], position: (details.steps || []).length + 1 }];
      const response = await backendRequest('put', `/workflows/${workflowId}`, { steps });
      return textResult({ success: true, workflow: response.data.workflow });
    }
    catch (error) {
      return textResult({ success: false, error: error.response?.data?.error || error.message });
    }
  });

  server.registerTool('update_workflow_step', {
    description: 'Update a workflow step',
    inputSchema: {
      workflowId: z.string().min(1),
      stepId: z.string().min(1),
      title: z.string().optional(),
      description: z.string().optional(),
      responsibleRole: z.string().optional(),
      checklistItems: z.array(z.string()).optional()
    }
  }, async ({ workflowId, stepId, ...updates }) => {
    try {
      const existing = await backendRequest('get', `/workflows/${workflowId}`);
      const details = existing.data.workflow;
      const steps = (details.steps || []).map((step) => step.id === stepId ? { ...step, ...updates, checklistItems: updates.checklistItems ?? step.checklistItems } : step);
      const response = await backendRequest('put', `/workflows/${workflowId}`, { steps });
      return textResult({ success: true, workflow: response.data.workflow });
    }
    catch (error) {
      return textResult({ success: false, error: error.response?.data?.error || error.message });
    }
  });

  server.registerTool('delete_workflow_step', {
    description: 'Delete a workflow step',
    inputSchema: {
      workflowId: z.string().min(1),
      stepId: z.string().min(1)
    }
  }, async ({ workflowId, stepId }) => {
    try {
      const existing = await backendRequest('get', `/workflows/${workflowId}`);
      const details = existing.data.workflow;
      const steps = (details.steps || []).filter((step) => step.id !== stepId).map((step, index) => ({ ...step, position: index + 1 }));
      const response = await backendRequest('put', `/workflows/${workflowId}`, { steps });
      return textResult({ success: true, workflow: response.data.workflow });
    }
    catch (error) {
      return textResult({ success: false, error: error.response?.data?.error || error.message });
    }
  });

  server.registerTool('duplicate_workflow', {
    description: 'Duplicate an existing workflow',
    inputSchema: {
      workflowId: z.string().min(1),
      newTitle: z.string().optional().describe('Optional title for the copy')
    }
  }, async ({ workflowId, newTitle }) => {
    try {
      const existing = await backendRequest('get', `/workflows/${workflowId}`);
      const response = await backendRequest('post', `/workflows/${workflowId}/duplicate`, { newTitle });
      return textResult({ success: true, workflow: response.data.workflow, source: existing.data.workflow.title });
    }
    catch (error) {
      return textResult({ success: false, error: error.response?.data?.error || error.message });
    }
  });

  server.registerTool('archive_workflow', {
    description: 'Archive a workflow',
    inputSchema: {
      workflowId: z.string().min(1)
    }
  }, async ({ workflowId }) => {
    try {
      const response = await backendRequest('patch', `/workflows/${workflowId}/archive`);
      return textResult({ success: true, workflow: response.data.workflow });
    }
    catch (error) {
      return textResult({ success: false, error: error.response?.data?.error || error.message });
    }
  });

  return server;
}

const mcpPostHandler = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const session = sessionId ? sessions.get(sessionId) : undefined;

  try {
    let transport;
    if (session) {
      transport = session.transport;
    }
    else if (!sessionId && isInitializeRequest(req.body)) {
      const newServer = getServer();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, { transport, server: newServer });
        }
      });
      await newServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }
    else if (sessionId) {
      res.status(404).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null });
      return;
    }
    else {
      res.status(400).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Bad Request: No valid session ID provided' }, id: null });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  }
  catch (error) {
    console.error('MCP handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  }
};

const mcpGetHandler = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId) {
    res.status(400).send('Missing session ID');
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null });
    return;
  }

  await session.transport.handleRequest(req, res);
};

const mcpDeleteHandler = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId) {
    res.status(400).send('Missing session ID');
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null });
    return;
  }

  await session.transport.handleRequest(req, res);
};

app.use(cors());
app.post('/mcp', mcpPostHandler);
app.get('/mcp', mcpGetHandler);
app.delete('/mcp', mcpDeleteHandler);
app.get('/health', (_req, res) => res.json({ ok: true, service: 'flowpilot-mcp' }));

app.listen(port, () => {
  console.log(`FlowPilot MCP server listening on http://localhost:${port}`);
});
