import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';

const state = {
  initialized: false,
  users: [],
  workspaces: [],
  workflows: [],
  activities: [],
  shares: []
};

const templates = [
  {
    id: 'template-onboarding',
    title: 'Employee Onboarding',
    description: 'Standard onboarding checklist for new employees.',
    department: 'Human Resources',
    category: 'Onboarding',
    purpose: 'Ensure all required employee setup tasks are completed before start date.',
    usageInstructions: 'Use when welcoming a new hire into the company.',
    requiredInformation: ['Employee name', 'Start date', 'Manager name', 'Department'],
    expectedOutcome: 'New employee is fully onboarded and ready to work.',
    steps: [
      { id: 'step-1', title: 'Send offer and paperwork', description: 'Share offer letter and statutory documents.', responsibleRole: 'HR', checklistItems: ['Offer accepted', 'Documents signed'] },
      { id: 'step-2', title: 'Set up accounts', description: 'Create email and access to tools.', responsibleRole: 'IT', checklistItems: ['Email created', 'Slack access granted'] },
      { id: 'step-3', title: 'Manager introduction', description: 'Schedule onboarding with manager and team.', responsibleRole: 'Manager', checklistItems: ['Introduction call booked'] }
    ]
  },
  {
    id: 'template-refund',
    title: 'Customer Refund Process',
    description: 'Review customer refund requests and verify eligibility.',
    department: 'Customer Support',
    category: 'Refunds',
    purpose: 'Handle refund requests consistently and on time.',
    usageInstructions: 'Use for customer complaints involving payments or order disputes.',
    requiredInformation: ['Order ID', 'Customer contact', 'Reason for refund', 'Proof of purchase'],
    expectedOutcome: 'Refund is approved or declined according to policy.',
    steps: [
      { id: 'step-1', title: 'Review request', description: 'Check the purchase details and issue.', responsibleRole: 'Support Agent', checklistItems: ['Order confirmed', 'Issue categorized'] },
      { id: 'step-2', title: 'Manager approval', description: 'Escalate if the refund exceeds policy limits.', responsibleRole: 'Team Lead', checklistItems: ['Approval recorded'] },
      { id: 'step-3', title: 'Process refund', description: 'Issue the correct refund to the customer.', responsibleRole: 'Finance', checklistItems: ['Refund confirmed'] }
    ]
  },
  {
    id: 'template-expense',
    title: 'Expense Reimbursement',
    description: 'Review employee expenses and approve reimbursement.',
    department: 'Finance',
    category: 'Expenses',
    purpose: 'Standardize reimbursements for travel and operating costs.',
    usageInstructions: 'Use for reimbursement claims that meet company policy.',
    requiredInformation: ['Employee name', 'Expense receipt', 'Cost center', 'Date'],
    expectedOutcome: 'Employees are reimbursed accurately and within timeline.',
    steps: [
      { id: 'step-1', title: 'Submit claim', description: 'Employee uploads receipt and expense details.', responsibleRole: 'Employee', checklistItems: ['Receipt uploaded'] },
      { id: 'step-2', title: 'Check policy', description: 'Finance verifies the claim and policy compliance.', responsibleRole: 'Finance', checklistItems: ['Compliance checked'] },
      { id: 'step-3', title: 'Pay reimbursement', description: 'Approve payment and record the reimbursement.', responsibleRole: 'Finance', checklistItems: ['Payment processed'] }
    ]
  }
];

export function ensureStoreInitialized() {
  if (state.initialized) {
    return;
  }

  state.initialized = true;
  createDefaultUser();
}

export function createDefaultUser() {
  if (state.users.length > 0) {
    return state.users[0];
  }

  const passwordHash = bcrypt.hashSync('FlowPilot123!', 10);
  const workspaceId = `workspace_${randomUUID()}`;
  const user = {
    id: `user_${randomUUID()}`,
    name: 'Demo Owner',
    email: 'demo@flowpilot.app',
    passwordHash,
    workspaceId,
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  state.workspaces.push({
    id: workspaceId,
    name: 'Demo Workspace',
    ownerId: user.id,
    createdAt: new Date().toISOString()
  });

  return user;
}

export async function registerUser({ name, email, password }) {
  ensureStoreInitialized();
  const emailTrimmed = String(email || '').trim().toLowerCase();
  if (!name || !emailTrimmed || !password) {
    throw new Error('Name, email and password are required.');
  }

  if (state.users.some((user) => user.email.toLowerCase() === emailTrimmed)) {
    throw new Error('A user with that email already exists.');
  }

  const workspaceId = `workspace_${randomUUID()}`;
  const user = {
    id: `user_${randomUUID()}`,
    name: String(name).trim(),
    email: emailTrimmed,
    passwordHash: await bcrypt.hash(password, 10),
    workspaceId,
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  state.workspaces.push({
    id: workspaceId,
    name: `${user.name}'s Workspace`,
    ownerId: user.id,
    createdAt: new Date().toISOString()
  });

  return user;
}

export async function loginUser({ email, password }) {
  ensureStoreInitialized();
  const emailTrimmed = String(email || '').trim().toLowerCase();
  const user = state.users.find((record) => record.email.toLowerCase() === emailTrimmed);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Invalid email or password.');
  }

  return user;
}

export function getUserById(id) {
  ensureStoreInitialized();
  return state.users.find((user) => user.id === id);
}

export function getWorkspaceById(workspaceId) {
  ensureStoreInitialized();
  return state.workspaces.find((workspace) => workspace.id === workspaceId);
}

export function getTemplates() {
  ensureStoreInitialized();
  return templates;
}

export function getTemplateById(templateId) {
  ensureStoreInitialized();
  return templates.find((template) => template.id === templateId);
}

export function createAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, workspaceId: user.workspaceId }, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    workspaceId: user.workspaceId,
    createdAt: user.createdAt
  };
}

export function listWorkflowsForUser(user, filters = {}) {
  ensureStoreInitialized();
  const workflows = state.workflows.filter((workflow) => workflow.workspaceId === user.workspaceId && !workflow.archived);

  return workflows
    .filter((workflow) => {
      const matchesDepartment = !filters.department || workflow.department === filters.department;
      const matchesCategory = !filters.category || workflow.category === filters.category;
      const matchesStatus = !filters.status || workflow.status === filters.status;
      const matchesSearch = !filters.search || [workflow.title, workflow.description, workflow.department, workflow.category].join(' ').toLowerCase().includes(filters.search.toLowerCase());
      return matchesDepartment && matchesCategory && matchesStatus && matchesSearch;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function getWorkflowForUser(user, workflowId) {
  ensureStoreInitialized();
  return state.workflows.find((workflow) => workflow.id === workflowId && workflow.workspaceId === user.workspaceId);
}

export function getSharedWorkflowById(workflowId) {
  ensureStoreInitialized();
  return state.workflows.find((workflow) => workflow.id === workflowId && workflow.visibility === 'shared');
}

export function createWorkflowForUser(user, payload) {
  ensureStoreInitialized();

  const workflow = {
    id: `wf_${randomUUID()}`,
    workspaceId: user.workspaceId,
    title: payload.title || 'Untitled Workflow',
    description: payload.description || '',
    department: payload.department || 'Operations',
    category: payload.category || 'General',
    purpose: payload.purpose || '',
    usageInstructions: payload.usageInstructions || '',
    ownerId: user.id,
    requiredInformation: Array.isArray(payload.requiredInformation) ? payload.requiredInformation : (payload.requiredInformation ? [payload.requiredInformation] : []),
    steps: normalizeSteps(payload.steps || []),
    expectedOutcome: payload.expectedOutcome || '',
    status: payload.status || 'Draft',
    visibility: payload.visibility || 'private',
    reviewDate: payload.reviewDate || null,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.workflows.push(workflow);
  createActivity(user.workspaceId, workflow.id, user.id, 'created_workflow');
  return workflow;
}

export function updateWorkflowForUser(user, workflowId, payload) {
  ensureStoreInitialized();
  const workflow = getWorkflowForUser(user, workflowId);
  if (!workflow) {
    throw new Error('Workflow not found.');
  }

  Object.assign(workflow, {
    title: payload.title ?? workflow.title,
    description: payload.description ?? workflow.description,
    department: payload.department ?? workflow.department,
    category: payload.category ?? workflow.category,
    purpose: payload.purpose ?? workflow.purpose,
    usageInstructions: payload.usageInstructions ?? workflow.usageInstructions,
    requiredInformation: payload.requiredInformation ? (Array.isArray(payload.requiredInformation) ? payload.requiredInformation : [payload.requiredInformation]) : workflow.requiredInformation,
    steps: payload.steps ? normalizeSteps(payload.steps) : workflow.steps,
    expectedOutcome: payload.expectedOutcome ?? workflow.expectedOutcome,
    status: payload.status ?? workflow.status,
    visibility: payload.visibility ?? workflow.visibility,
    reviewDate: payload.reviewDate ?? workflow.reviewDate,
    updatedAt: new Date().toISOString()
  });

  createActivity(user.workspaceId, workflow.id, user.id, 'updated_workflow');
  return workflow;
}

export function duplicateWorkflowForUser(user, workflowId) {
  ensureStoreInitialized();
  const workflow = getWorkflowForUser(user, workflowId);
  if (!workflow) {
    throw new Error('Workflow not found.');
  }

  const duplicate = {
    ...structuredClone(workflow),
    id: `wf_${randomUUID()}`,
    title: `${workflow.title} Copy`,
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    ownerId: user.id
  };

  state.workflows.push(duplicate);
  createActivity(user.workspaceId, duplicate.id, user.id, 'duplicated_workflow');
  return duplicate;
}

export function archiveWorkflowForUser(user, workflowId) {
  ensureStoreInitialized();
  const workflow = getWorkflowForUser(user, workflowId);
  if (!workflow) {
    throw new Error('Workflow not found.');
  }

  workflow.archived = true;
  workflow.updatedAt = new Date().toISOString();
  createActivity(user.workspaceId, workflow.id, user.id, 'archived_workflow');
  return workflow;
}

export function deleteWorkflowForUser(user, workflowId) {
  ensureStoreInitialized();
  const index = state.workflows.findIndex((workflow) => workflow.id === workflowId && workflow.workspaceId === user.workspaceId);
  if (index < 0) {
    throw new Error('Workflow not found.');
  }

  const [deleted] = state.workflows.splice(index, 1);
  createActivity(user.workspaceId, workflowId, user.id, 'deleted_workflow');
  return deleted;
}

export function shareWorkflowForUser(user, workflowId, { email, permission = 'viewer' }) {
  ensureStoreInitialized();
  const workflow = getWorkflowForUser(user, workflowId);
  if (!workflow) {
    throw new Error('Workflow not found.');
  }

  const targetUser = state.users.find((record) => record.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!targetUser) {
    throw new Error('Recipient user not found.');
  }

  const share = {
    id: `share_${randomUUID()}`,
    workflowId,
    userId: targetUser.id,
    permission,
    workspaceId: user.workspaceId,
    createdAt: new Date().toISOString()
  };

  const existing = state.shares.find((entry) => entry.workflowId === workflowId && entry.userId === targetUser.id);
  if (existing) {
    Object.assign(existing, share);
  }
  else {
    state.shares.push(share);
  }

  workflow.visibility = 'shared';
  workflow.updatedAt = new Date().toISOString();
  createActivity(user.workspaceId, workflow.id, user.id, `shared_workflow:${permission}`);
  return share;
}

export function getRecentWorkflows(user) {
  ensureStoreInitialized();
  return listWorkflowsForUser(user).slice(0, 5);
}

export function getActivityForWorkflow(user, workflowId) {
  ensureStoreInitialized();
  return state.activities.filter((activity) => activity.workspaceId === user.workspaceId && activity.workflowId === workflowId).slice(-10);
}

function normalizeSteps(steps) {
  return (steps || []).map((step, index) => ({
    id: step.id || `step_${randomUUID()}`,
    title: step.title || `Step ${index + 1}`,
    description: step.description || '',
    responsibleRole: step.responsibleRole || '',
    checklistItems: Array.isArray(step.checklistItems) ? step.checklistItems.map((item) => item || '') : [],
    position: index + 1
  }));
}

function createActivity(workspaceId, workflowId, actorId, action) {
  state.activities.push({
    id: `activity_${randomUUID()}`,
    workspaceId,
    workflowId,
    actorId,
    action,
    timestamp: new Date().toISOString()
  });
}

export function getDashboardStats(user) {
  ensureStoreInitialized();
  const workflows = state.workflows.filter((workflow) => workflow.workspaceId === user.workspaceId && !workflow.archived);
  const categories = new Set(workflows.map((workflow) => workflow.category));
  return {
    total: workflows.length,
    published: workflows.filter((workflow) => workflow.status === 'Published').length,
    draft: workflows.filter((workflow) => workflow.status === 'Draft').length,
    categories: categories.size,
    recentlyUpdated: workflows.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    recentlyCreated: workflows.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  };
}
