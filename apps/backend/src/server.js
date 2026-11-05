import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { connectDatabase } from './db.js';
import {
  archiveWorkflowForUser,
  createAccessToken,
  createWorkflowForUser,
  deleteWorkflowForUser,
  duplicateWorkflowForUser,
  ensureStoreInitialized,
  getDashboardStats,
  getRecentWorkflows,
  getSharedWorkflowById,
  getTemplates,
  getUserById,
  getWorkflowForUser,
  listWorkflowsForUser,
  loginUser,
  registerUser,
  serializeUser,
  shareWorkflowForUser,
  updateWorkflowForUser,
  verifyAccessToken
} from './store.js';

const app = express();
const port = config.port;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'flowpilot-backend', timestamp: new Date().toISOString() });
});

async function start() {
  await connectDatabase();
  ensureStoreInitialized();

  app.listen(port, () => {
    console.log(`FlowPilot backend running on http://localhost:${port}`);
  });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = user;
    next();
  }
  catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await registerUser(req.body);
    const token = createAccessToken(user);
    res.status(201).json({ token, user: serializeUser(user) });
  }
  catch (error) {
    res.status(400).json({ error: error.message || 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await loginUser(req.body);
    const token = createAccessToken(user);
    res.json({ token, user: serializeUser(user) });
  }
  catch (error) {
    res.status(401).json({ error: error.message || 'Login failed.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

app.get('/api/templates', (_req, res) => {
  res.json({ templates: getTemplates() });
});

app.get('/api/workflows', requireAuth, (req, res) => {
  const filters = {
    department: req.query.department || '',
    category: req.query.category || '',
    status: req.query.status || '',
    search: req.query.search || ''
  };
  const workflows = listWorkflowsForUser(req.user, filters);
  res.json({ workflows });
});

app.get('/api/dashboard', requireAuth, (req, res) => {
  res.json({
    stats: getDashboardStats(req.user),
    recent: getRecentWorkflows(req.user)
  });
});

app.post('/api/workflows', requireAuth, (req, res) => {
  try {
    const workflow = createWorkflowForUser(req.user, req.body);
    res.status(201).json({ workflow });
  }
  catch (error) {
    res.status(400).json({ error: error.message || 'Unable to create workflow.' });
  }
});

app.get('/api/workflows/:id', requireAuth, (req, res) => {
  const workflow = getWorkflowForUser(req.user, req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }
  res.json({ workflow });
});

app.get('/api/shared/:id', (req, res) => {
  const workflow = getSharedWorkflowById(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Shared workflow not found.' });
  }
  res.json({ workflow });
});

app.put('/api/workflows/:id', requireAuth, (req, res) => {
  try {
    const workflow = updateWorkflowForUser(req.user, req.params.id, req.body);
    res.json({ workflow });
  }
  catch (error) {
    res.status(400).json({ error: error.message || 'Unable to update workflow.' });
  }
});

app.delete('/api/workflows/:id', requireAuth, (req, res) => {
  try {
    const workflow = deleteWorkflowForUser(req.user, req.params.id);
    res.json({ deleted: workflow });
  }
  catch (error) {
    res.status(400).json({ error: error.message || 'Unable to delete workflow.' });
  }
});

app.post('/api/workflows/:id/duplicate', requireAuth, (req, res) => {
  try {
    const workflow = duplicateWorkflowForUser(req.user, req.params.id);
    res.status(201).json({ workflow });
  }
  catch (error) {
    res.status(400).json({ error: error.message || 'Unable to duplicate workflow.' });
  }
});

app.patch('/api/workflows/:id/archive', requireAuth, (req, res) => {
  try {
    const workflow = archiveWorkflowForUser(req.user, req.params.id);
    res.json({ workflow });
  }
  catch (error) {
    res.status(400).json({ error: error.message || 'Unable to archive workflow.' });
  }
});

app.post('/api/workflows/:id/share', requireAuth, (req, res) => {
  try {
    const share = shareWorkflowForUser(req.user, req.params.id, req.body || {});
    res.status(201).json({ share });
  }
  catch (error) {
    res.status(400).json({ error: error.message || 'Unable to share workflow.' });
  }
});

start().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
