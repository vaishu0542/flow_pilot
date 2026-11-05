import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpDown, BarChart3, Copy, FileText, FolderTree, LayoutDashboard, LogOut, NotebookPen, PencilLine, Plus, Search, Settings, Share2, Trash2, UserCircle2 } from 'lucide-react';
import api from './api';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('flowpilot_token'));

  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem('flowpilot_token'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!token) {
    return <AuthRouter />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">F</div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</div>
                <div className="text-xl font-semibold">FlowPilot</div>
              </div>
            </div>
          </div>
          <nav className="space-y-2 px-3 pb-6">
            <SidebarLink to="/dashboard" label="Dashboard" icon={<LayoutDashboard size={18} />} />
            <SidebarLink to="/workflows" label="All Workflows" icon={<FolderTree size={18} />} />
            <SidebarLink to="/templates" label="Template Library" icon={<NotebookPen size={18} />} />
            <SidebarLink to="/settings" label="Settings" icon={<Settings size={18} />} />
            <button
              className="mt-6 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              onClick={() => {
                localStorage.removeItem('flowpilot_token');
                setToken(null);
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/workflows" element={<WorkflowListPage />} />
            <Route path="/templates" element={<TemplateLibraryPage />} />
            <Route path="/workflows/new" element={<WorkflowEditorPage mode="new" />} />
            <Route path="/workflows/:id/editor" element={<WorkflowEditorPage mode="edit" />} />
            <Route path="/shared/:id" element={<SharedWorkflowPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
          isActive ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function AuthRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function AuthPage({ mode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: 'demo@flowpilot.app',
    password: 'FlowPilot123!'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = mode === 'login' ? { email: form.email, password: form.password } : { ...form };
      const response = await api.post(`/auth/${mode === 'login' ? 'login' : 'register'}`, payload);
      localStorage.setItem('flowpilot_token', response.data.token);
      window.dispatchEvent(new Event('storage'));
      navigate('/dashboard');
    }
    catch (apiError) {
      setError(apiError.response?.data?.error || 'Authentication failed.');
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">F</div>
          <h1 className="text-3xl font-bold">FlowPilot</h1>
          <p className="mt-2 text-sm text-slate-500">Turn everyday business instructions into structured workflows.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-0 transition focus:border-brand-500"
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-brand-500"
              placeholder="you@company.com"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-brand-500"
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? 'Need an account?' : 'Already have an account?'}{' '}
          <Link to={mode === 'login' ? '/register' : '/login'} className="font-medium text-brand-600 hover:text-brand-700">
            {mode === 'login' ? 'Create one' : 'Log in'}
          </Link>
        </p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Workspace settings</h2>
        <p className="mt-2 text-slate-500">Manage your small-business workflow environment and memberships.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-dashed border-slate-200 p-4">
            <div className="text-sm text-slate-500">Workspace name</div>
            <div className="mt-2 text-lg font-semibold">Demo Workspace</div>
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 p-4">
            <div className="text-sm text-slate-500">Permissions</div>
            <div className="mt-2 text-lg font-semibold">Owner / Editor</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get('/dashboard');
        setStats(response.data);
      }
      finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <PageLoader label="Loading dashboard" />;
  }

  const cards = [
    { label: 'Total workflows', value: stats?.stats?.total ?? 0 },
    { label: 'Published', value: stats?.stats?.published ?? 0 },
    { label: 'Draft', value: stats?.stats?.draft ?? 0 },
    { label: 'Categories', value: stats?.stats?.categories ?? 0 }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Overview</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back</h1>
          </div>
          <Link to="/workflows/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700">
            <Plus size={18} />
            Create Workflow
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recently updated</h2>
            <Link to="/workflows" className="text-sm font-medium text-brand-600">View all</Link>
          </div>
          <div className="space-y-3">
            {(stats?.stats?.recentlyUpdated || []).map((workflow) => (
              <Link to={`/workflows/${workflow.id}/editor`} key={workflow.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-brand-200 hover:bg-brand-50">
                <div>
                  <div className="font-medium">{workflow.title}</div>
                  <div className="text-sm text-slate-500">{workflow.department} • {workflow.category}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{workflow.status}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Quick actions</h2>
          <div className="mt-4 space-y-3">
            <Link to="/workflows/new" className="flex items-center gap-3 rounded-xl bg-slate-100 p-3 text-sm font-medium text-slate-700 hover:bg-slate-200">
              <Plus size={16} /> Create new workflow
            </Link>
            <Link to="/templates" className="flex items-center gap-3 rounded-xl bg-slate-100 p-3 text-sm font-medium text-slate-700 hover:bg-slate-200">
              <NotebookPen size={16} /> Browse templates
            </Link>
            <Link to="/workflows" className="flex items-center gap-3 rounded-xl bg-slate-100 p-3 text-sm font-medium text-slate-700 hover:bg-slate-200">
              <FileText size={16} /> View all workflows
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function WorkflowListPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', department: '', category: '', status: '' });

  useEffect(() => {
    loadWorkflows();
  }, [filters]);

  async function loadWorkflows() {
    try {
      const response = await api.get('/workflows', { params: filters });
      setWorkflows(response.data.workflows || []);
    }
    finally {
      setLoading(false);
    }
  }

  async function duplicateWorkflow(id) {
    await api.post(`/workflows/${id}/duplicate`);
    loadWorkflows();
  }

  async function archiveWorkflow(id) {
    await api.patch(`/workflows/${id}/archive`);
    loadWorkflows();
  }

  if (loading) {
    return <PageLoader label="Loading workflows" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Workspace</p>
            <h1 className="mt-2 text-3xl font-bold">All workflows</h1>
          </div>
          <Link to="/workflows/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700">
            <Plus size={18} />
            New workflow
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search workflows"
            className="rounded-xl border border-slate-200 px-3 py-2.5"
          />
          <select value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5">
            <option value="">Department</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Customer Support">Customer Support</option>
            <option value="Operations">Operations</option>
          </select>
          <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5">
            <option value="">Category</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Refunds">Refunds</option>
            <option value="Expenses">Expenses</option>
            <option value="General">General</option>
          </select>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5">
            <option value="">Status</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </select>
          <button onClick={() => setFilters({ search: '', department: '', category: '', status: '' })} className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 font-medium text-slate-700">
            Reset
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workflows.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
            No workflows found for this filter.
          </div>
        )}

        {workflows.map((workflow) => (
          <div key={workflow.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xl font-semibold">{workflow.title}</div>
                <div className="mt-1 text-sm text-slate-500">{workflow.department} • {workflow.category}</div>
              </div>
              <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">{workflow.status}</span>
            </div>

            <p className="mt-3 line-clamp-3 text-sm text-slate-600">{workflow.description || 'No description provided.'}</p>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{workflow.steps?.length || 0} steps</span>
              <span>{workflow.visibility || 'private'}</span>
            </div>

            <div className="mt-5 flex gap-2">
              <Link to={`/workflows/${workflow.id}/editor`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                <PencilLine size={15} /> Edit
              </Link>
              <button onClick={() => duplicateWorkflow(workflow.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100">
                <Copy size={15} />
              </button>
              <button onClick={() => archiveWorkflow(workflow.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100">
                <ArchiveIcon size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateLibraryPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await api.get('/templates');
        setTemplates(response.data.templates || []);
      }
      finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  const useTemplate = async (template) => {
    const payload = {
      title: template.title,
      description: template.description,
      department: template.department,
      category: template.category,
      purpose: template.purpose,
      usageInstructions: template.usageInstructions,
      requiredInformation: template.requiredInformation || [],
      steps: template.steps || [],
      expectedOutcome: template.expectedOutcome,
      status: 'Draft'
    };

    const response = await api.post('/workflows', payload);
    window.location.href = `/workflows/${response.data.workflow.id}/editor`;
  };

  if (loading) {
    return <PageLoader label="Browsing templates" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Templates</p>
        <h1 className="mt-2 text-3xl font-bold">Ready-to-use workflow templates</h1>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-semibold">{template.title}</div>
                <div className="mt-1 text-sm text-slate-500">{template.department}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{template.category}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{template.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{template.steps?.length || 0} steps</span>
              <span>{template.requiredInformation?.length || 0} data points</span>
            </div>
            <button onClick={() => useTemplate(template)} className="mt-5 w-full rounded-xl bg-brand-600 px-3 py-2.5 font-medium text-white hover:bg-brand-700">
              Use template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowEditorPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('viewer');
  const [shareResult, setShareResult] = useState('');

  useEffect(() => {
    async function loadWorkflow() {
      if (mode === 'new') {
        setWorkflow({
          title: 'New workflow',
          description: '',
          department: 'Operations',
          category: 'General',
          purpose: '',
          usageInstructions: '',
          requiredInformation: [''],
          steps: [
            { id: `step_${Date.now()}`, title: 'New step', description: '', responsibleRole: '', checklistItems: [''] }
          ],
          expectedOutcome: '',
          status: 'Draft',
          visibility: 'private',
          reviewDate: ''
        });
        return;
      }

      const response = await api.get(`/workflows/${id}`);
      setWorkflow(response.data.workflow);
    }

    loadWorkflow();
  }, [id, mode]);

  const shareWorkflow = async () => {
    if (!workflow || !shareEmail) {
      return;
    }

    const response = await api.post(`/workflows/${workflow.id}/share`, {
      email: shareEmail,
      permission: sharePermission
    });

    setShareResult(`Shared with ${shareEmail} as ${sharePermission}.`);
    setWorkflow((current) => ({ ...current, visibility: 'shared' }));
    setShareEmail('');
    setSharePermission('viewer');
    if (response.data?.share) {
      const url = `http://localhost:5173/shared/${workflow.id}`;
      setShareResult(`View-only link: ${url} • Shared with ${shareEmail} as ${sharePermission}.`);
    }
  };

  const saveWorkflow = async () => {
    if (!workflow) {
      return;
    }

    setSaving(true);
    try {
      if (mode === 'new') {
        const response = await api.post('/workflows', workflow);
        navigate(`/workflows/${response.data.workflow.id}/editor`);
      }
      else {
        await api.put(`/workflows/${id}`, workflow);
      }
    }
    finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setWorkflow((current) => ({ ...current, [field]: value }));
  };

  const updateStep = (index, field, value) => {
    setWorkflow((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => (stepIndex === index ? { ...step, [field]: value } : step))
    }));
  };

  const updateChecklist = (stepIndex, itemIndex, value) => {
    setWorkflow((current) => ({
      ...current,
      steps: current.steps.map((step, index) => {
        if (index !== stepIndex) {
          return step;
        }
        const checklist = [...(step.checklistItems || [])];
        checklist[itemIndex] = value;
        return { ...step, checklistItems: checklist };
      })
    }));
  };

  const addStep = () => {
    setWorkflow((current) => ({
      ...current,
      steps: [...(current.steps || []), { id: `step_${Date.now()}`, title: 'New step', description: '', responsibleRole: '', checklistItems: [''] }]
    }));
  };

  const removeStep = (index) => {
    setWorkflow((current) => ({
      ...current,
      steps: (current.steps || []).filter((_, stepIndex) => stepIndex !== index)
    }));
  };

  const moveStep = (index, direction) => {
    setWorkflow((current) => {
      const steps = [...(current.steps || [])];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= steps.length) {
        return current;
      }
      [steps[index], steps[nextIndex]] = [steps[nextIndex], steps[index]];
      return { ...current, steps };
    });
  };

  if (!workflow) {
    return <PageLoader label="Loading workflow" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Workflow editor</p>
            <h1 className="mt-2 text-3xl font-bold">{workflow.title}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={saveWorkflow} className="rounded-xl bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Workflow title</span>
              <input value={workflow.title || ''} onChange={(event) => updateField('title', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Short description</span>
              <textarea value={workflow.description || ''} onChange={(event) => updateField('description', event.target.value)} className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Department</span>
                <input value={workflow.department || ''} onChange={(event) => updateField('department', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Category</span>
                <input value={workflow.category || ''} onChange={(event) => updateField('category', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
            </div>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Purpose</span>
              <textarea value={workflow.purpose || ''} onChange={(event) => updateField('purpose', event.target.value)} className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">When to use this process</span>
              <textarea value={workflow.usageInstructions || ''} onChange={(event) => updateField('usageInstructions', event.target.value)} className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-700">Expected outcome</span>
              <textarea value={workflow.expectedOutcome || ''} onChange={(event) => updateField('expectedOutcome', event.target.value)} className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
          </div>
        </section>

        <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">Status</div>
            <select value={workflow.status || 'Draft'} onChange={(event) => updateField('status', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5">
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">Visibility</div>
            <select value={workflow.visibility || 'private'} onChange={(event) => updateField('visibility', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5">
              <option value="private">Private</option>
              <option value="shared">Shared</option>
            </select>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">Review date</div>
            <input type="date" value={workflow.reviewDate || ''} onChange={(event) => updateField('reviewDate', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">Required information</div>
            <textarea value={(workflow.requiredInformation || []).join('\n')} onChange={(event) => updateField('requiredInformation', event.target.value.split('\n').filter(Boolean))} className="h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-sm font-medium text-slate-700">Share workflow</div>
            <div className="space-y-2">
              <input value={shareEmail} onChange={(event) => setShareEmail(event.target.value)} placeholder="team@company.com" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              <select value={sharePermission} onChange={(event) => setSharePermission(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="owner">Owner</option>
              </select>
              <button onClick={shareWorkflow} className="w-full rounded-xl bg-slate-900 px-3 py-2.5 font-medium text-white hover:bg-slate-800">Share</button>
              {shareResult && <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700">{shareResult}</div>}
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Workflow steps</h2>
          <button onClick={addStep} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Add step</button>
        </div>

        <div className="space-y-4">
          {(workflow.steps || []).map((step, index) => (
            <div key={step.id || index} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-700">{index + 1}</span>
                  Step {index + 1}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => moveStep(index, -1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100">↑</button>
                  <button onClick={() => moveStep(index, 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100">↓</button>
                  <button onClick={() => removeStep(index)} className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-1 block text-sm font-medium text-slate-700">Step title</span>
                  <input value={step.title || ''} onChange={(event) => updateStep(index, 'title', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-slate-700">Responsible role</span>
                  <input value={step.responsibleRole || ''} onChange={(event) => updateStep(index, 'responsibleRole', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Step description</span>
                <textarea value={step.description || ''} onChange={(event) => updateStep(index, 'description', event.target.value)} className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>

              <div className="mt-4">
                <div className="mb-2 text-sm font-medium text-slate-700">Checklist items</div>
                <div className="space-y-2">
                  {((step.checklistItems || ['']).map((item, itemIndex) => (
                    <input
                      key={`${step.id || index}-${itemIndex}`}
                      value={item}
                      onChange={(event) => updateChecklist(index, itemIndex, event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    />
                  )))}
                  <button onClick={() => updateStep(index, 'checklistItems', [...(step.checklistItems || []), ''])} className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-slate-400">
                    Add checklist item
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SharedWorkflowPage() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSharedWorkflow() {
      try {
        const response = await api.get(`/shared/${id}`);
        setWorkflow(response.data.workflow);
      }
      catch (apiError) {
        setError(apiError.response?.data?.error || 'This shared workflow is unavailable.');
      }
    }

    loadSharedWorkflow();
  }, [id]);

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  if (!workflow) {
    return <PageLoader label="Loading shared workflow" />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Shared workflow</div>
        <h1 className="mt-2 text-3xl font-bold">{workflow.title}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Department</div>
          <div className="mt-1 font-medium">{workflow.department}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Status</div>
          <div className="mt-1 font-medium">{workflow.status}</div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-2 font-medium">Description</div>
        <p className="text-slate-600">{workflow.description || 'No description provided.'}</p>
      </div>
      <div className="space-y-3">
        {(workflow.steps || []).map((step, index) => (
          <div key={step.id || index} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 text-sm font-medium text-slate-700">Step {index + 1}: {step.title}</div>
            <p className="text-slate-600">{step.description || 'No step description.'}</p>
            {step.checklistItems?.length > 0 && (
              <ul className="mt-3 list-inside list-disc text-sm text-slate-600">
                {step.checklistItems.filter(Boolean).map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PageLoader({ label }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">{label}…</div>
    </div>
  );
}

function ArchiveIcon({ size = 15 }) {
  return <FolderTree size={size} />;
}

export default App;
