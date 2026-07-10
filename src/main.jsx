import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  navigation,
  paymentList,
  projects as initialProjects,
  requisitions as initialRequisitions,
  roles,
  tasks,
} from './data.js';
import './styles.css';

const money = (value) => `RWF ${Number(value || 0).toLocaleString()}`;

function App() {
  const [role, setRole] = useState('manager');
  const [signedIn, setSignedIn] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [projects, setProjects] = useState(initialProjects);
  const [requisitions, setRequisitions] = useState(initialRequisitions);

  const activeRole = roles[role];
  const navItems = navigation[role];

  function login(selectedRole) {
    setRole(selectedRole);
    setPage(navigation[selectedRole][0][0]);
    setSignedIn(true);
  }

  function addProject(project) {
    setProjects((current) => [
      {
        ...project,
        id: current.length + 1,
        spent: 0,
        progress: 0,
      },
      ...current,
    ]);
    setPage('projects');
  }

  function approveRequisition(id) {
    setRequisitions((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'Approved',
              executive: { ...item.executive, status: 'Approved', comments: 'Approved for payment processing.' },
              board: { ...item.board, status: 'Approved' },
            }
          : item,
      ),
    );
  }

  if (!signedIn) {
    return <Login selectedRole={role} setSelectedRole={setRole} onLogin={login} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        activeRole={activeRole}
        page={page}
        navItems={navItems}
        setPage={setPage}
        onLogout={() => setSignedIn(false)}
      />
      <main className="main">
        <Topbar title={navItems.find(([id]) => id === page)?.[1] || 'Dashboard'} activeRole={activeRole} />
        <div className="content">
          <Page
            page={page}
            role={role}
            projects={projects}
            requisitions={requisitions}
            addProject={addProject}
            approveRequisition={approveRequisition}
          />
        </div>
      </main>
    </div>
  );
}

function Login({ selectedRole, setSelectedRole, onLogin }) {
  return (
    <section className="login-screen">
      <div className="login-card">
        <div className="mark">PT</div>
        <p className="eyebrow">MDFC ProjTrack</p>
        <h1>Project Management System</h1>
        <p className="muted">Choose a role to preview the workspace.</p>
        <div className="role-grid">
          {Object.entries(roles).map(([id, item]) => (
            <button
              className={selectedRole === id ? 'role-chip active' : 'role-chip'}
              key={id}
              onClick={() => setSelectedRole(id)}
              type="button"
            >
              <span>{item.initials}</span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
        <button className="primary wide" onClick={() => onLogin(selectedRole)} type="button">
          Enter workspace
        </button>
      </div>
    </section>
  );
}

function Sidebar({ role, activeRole, page, navItems, setPage, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">PT</div>
        <div>
          <strong>ProjTrack</strong>
          <span>MDFC Rwanda</span>
        </div>
      </div>
      <nav>
        {navItems.map(([id, label]) => (
          <button className={page === id ? 'nav-item active' : 'nav-item'} key={id} onClick={() => setPage(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="user-card">
        <div className="avatar">{activeRole.initials}</div>
        <div>
          <strong>{activeRole.name}</strong>
          <span>{roles[role].label}</span>
        </div>
        <button className="text-button" onClick={onLogout} type="button">
          Exit
        </button>
      </div>
    </aside>
  );
}

function Topbar({ title, activeRole }) {
  return (
    <header className="topbar">
      <div>
        <h2>{title}</h2>
        <span>{activeRole.name}</span>
      </div>
    </header>
  );
}

function Page({ page, role, projects, requisitions, addProject, approveRequisition }) {
  if (page === 'projects') return <Projects projects={projects} addProject={addProject} />;
  if (page === 'requisitions' || page === 'finance-requests')
    return <Requisitions requisitions={requisitions} onApprove={approveRequisition} finance={page === 'finance-requests'} />;
  if (page === 'tasks' || page === 'my-tasks') return <Tasks role={role} projects={projects} />;
  if (page === 'payments') return <Payments />;
  if (page === 'budget') return <Budget projects={projects} />;
  if (page === 'reports') return <Reports />;
  if (page === 'my-requests') return <Requisitions requisitions={requisitions.filter((item) => item.prepared.names === roles.employee.name)} />;
  if (page === 'work-log') return <WorkLog />;
  if (page === 'finance-dashboard') return <FinanceDashboard projects={projects} requisitions={requisitions} />;
  return <Dashboard role={role} projects={projects} requisitions={requisitions} />;
}

function Dashboard({ role, projects, requisitions }) {
  const totalBudget = projects.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = projects.reduce((sum, item) => sum + item.spent, 0);
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">{roles[role].label} workspace</p>
          <h1>Structured project, requisition, and finance tracking</h1>
        </div>
      </section>
      <div className="stats">
        <Stat label="Projects" value={projects.length} />
        <Stat label="Pending requests" value={requisitions.filter((item) => item.status === 'Submitted').length} />
        <Stat label="Total budget" value={money(totalBudget)} />
        <Stat label="Spent" value={money(totalSpent)} />
      </div>
      <div className="grid two">
        <Panel title="Recent requisitions">
          {requisitions.map((item) => (
            <Row key={item.id} title={item.details} meta={`${item.requestNo} - ${money(item.amount)}`} status={item.status} />
          ))}
        </Panel>
        <Panel title="Project progress">
          {projects.map((project) => (
            <ProgressRow key={project.id} label={project.name} value={project.progress} />
          ))}
        </Panel>
      </div>
    </>
  );
}

function FinanceDashboard({ projects, requisitions }) {
  const totalBudget = projects.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = projects.reduce((sum, item) => sum + item.spent, 0);
  return (
    <>
      <div className="stats">
        <Stat label="Total budget" value={money(totalBudget)} />
        <Stat label="Disbursed" value={money(totalSpent)} />
        <Stat label="Remaining" value={money(totalBudget - totalSpent)} />
        <Stat label="Awaiting review" value={requisitions.filter((item) => item.status === 'Submitted').length} />
      </div>
      <Requisitions requisitions={requisitions} finance />
    </>
  );
}

function Projects({ projects, addProject }) {
  const [formOpen, setFormOpen] = useState(false);
  return (
    <>
      <div className="section-head">
        <h3>Projects</h3>
        <button className="primary" onClick={() => setFormOpen((value) => !value)} type="button">
          New project
        </button>
      </div>
      {formOpen && <ProjectForm onSubmit={addProject} />}
      <div className="project-grid">
        {projects.map((project) => (
          <article className="project-card" key={project.id}>
            <div>
              <span className="status">{project.status}</span>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
            </div>
            <dl className="detail-grid">
              <Detail label="Project code" value={project.projectCode} />
              <Detail label="Budget line" value={project.budgetLine} />
              <Detail label="Activity" value={project.activity} />
              <Detail label="Items" value={project.items} />
              <Detail label="Responsible title" value={project.owner} />
              <Detail label="Budget" value={money(project.budget)} />
            </dl>
            <ProgressRow label="Progress" value={project.progress} />
          </article>
        ))}
      </div>
    </>
  );
}

function ProjectForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    program: 'Digital Innovation',
    projectCode: '',
    budgetLine: '',
    activity: '',
    items: '',
    owner: 'Program Manager',
    budget: '',
    start: '',
    end: '',
    status: 'Planning',
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name || !form.description) return;
    onSubmit({ ...form, budget: Number(form.budget || 0) });
    setForm((current) => ({ ...current, name: '', description: '', projectCode: '' }));
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <Input label="Project name" value={form.name} onChange={(value) => update('name', value)} />
      <Input label="Project description" value={form.description} onChange={(value) => update('description', value)} textarea />
      <div className="form-row">
        <Select label="Program area" value={form.program} onChange={(value) => update('program', value)} options={['Digital Innovation', 'Advocacy', 'Research', 'Operations']} />
        <Input label="Project code" value={form.projectCode} onChange={(value) => update('projectCode', value)} />
      </div>
      <div className="form-row">
        <Input label="Budget line" value={form.budgetLine} onChange={(value) => update('budgetLine', value)} />
        <Input label="Activity" value={form.activity} onChange={(value) => update('activity', value)} />
      </div>
      <div className="form-row">
        <Input label="Items" value={form.items} onChange={(value) => update('items', value)} />
        <Select label="Responsible title" value={form.owner} onChange={(value) => update('owner', value)} options={['Program Manager', 'Software / IT Intern', 'Finance Officer', 'M&E Officer', 'Data Officer']} />
      </div>
      <div className="form-row">
        <Input label="Budget" type="number" value={form.budget} onChange={(value) => update('budget', value)} />
        <Select label="Status" value={form.status} onChange={(value) => update('status', value)} options={['Planning', 'Active', 'On Hold']} />
      </div>
      <button className="primary" type="submit">
        Create project
      </button>
    </form>
  );
}

function Requisitions({ requisitions, onApprove, finance = false }) {
  return (
    <Panel title="Requisition Database">
      <div className="wide-table">
        <table>
          <thead>
            <tr>
              <th>Request No</th>
              <th>Date</th>
              <th>Details</th>
              <th>Project Code</th>
              <th>Budget Line</th>
              <th>Activity</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Supporting Documents</th>
              <th>Prepared By</th>
              <th>Verified By</th>
              <th>Executive Approval</th>
              <th>Board Approval</th>
              <th>Progress</th>
              {finance && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {requisitions.map((item) => (
              <tr key={item.id}>
                <td>{item.requestNo}</td>
                <td>{item.date}</td>
                <td>{item.details}</td>
                <td>{item.projectCode}</td>
                <td>{item.budgetLine}</td>
                <td>{item.activity}</td>
                <td>{item.items}</td>
                <td>{money(item.amount)}</td>
                <td>{item.supportingDocuments}</td>
                <td><WorkflowCell data={item.prepared} /></td>
                <td><WorkflowCell data={item.verified} withRecommendations /></td>
                <td><WorkflowCell data={item.executive} withRecommendations /></td>
                <td><WorkflowCell data={item.board} withRecommendations /></td>
                <td><ProgressCell data={item.progress} /></td>
                {finance && (
                  <td>
                    {item.status === 'Submitted' ? (
                      <button className="primary small" onClick={() => onApprove?.(item.id)} type="button">
                        Approve
                      </button>
                    ) : (
                      <span className="status">{item.status}</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Tasks({ role, projects }) {
  const visibleTasks = role === 'employee' ? tasks.filter((task) => task.assignee === roles.employee.name) : tasks;
  return (
    <div className="kanban">
      {['Not Started', 'In Progress', 'Review', 'Done'].map((status) => (
        <Panel title={status} key={status}>
          {visibleTasks
            .filter((task) => task.status === status)
            .map((task) => (
              <div className="task-card" key={task.id}>
                <strong>{task.title}</strong>
                <span>{projects.find((project) => project.id === task.projectId)?.name}</span>
                <small>{task.assignee} - {task.priority}</small>
              </div>
            ))}
        </Panel>
      ))}
    </div>
  );
}

function Payments() {
  return (
    <Panel title="Attendance and Payment List">
      <table>
        <thead>
          <tr><th>Name</th><th>Mobile</th><th>Role</th><th>Amount</th><th>Status</th></tr>
        </thead>
        <tbody>
          {paymentList.map(([name, mobile, role, amount, status]) => (
            <tr key={name}><td>{name}</td><td>{mobile}</td><td>{role}</td><td>{money(amount)}</td><td><span className="status">{status}</span></td></tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function Budget({ projects }) {
  return (
    <Panel title="Budget Overview">
      {projects.map((project) => (
        <ProgressRow
          key={project.id}
          label={`${project.name} - ${money(project.spent)} of ${money(project.budget)}`}
          value={Math.round((project.spent / project.budget) * 100)}
        />
      ))}
    </Panel>
  );
}

function Reports() {
  return (
    <div className="grid three">
      {['Weekly Progress Report', 'Monthly Activity Report', 'Finance Report'].map((title) => (
        <Panel title={title} key={title}>
          <p className="muted">Export-ready summary for management review.</p>
          <button className="secondary" type="button">Export</button>
        </Panel>
      ))}
    </div>
  );
}

function WorkLog() {
  return (
    <Panel title="Weekly Work Log">
      {tasks.filter((task) => task.assignee === roles.employee.name).map((task) => (
        <Row key={task.id} title={task.title} meta={task.due} status={task.status} />
      ))}
    </Panel>
  );
}

function WorkflowCell({ data, withRecommendations = false }) {
  return (
    <div className="workflow-cell">
      <strong>{data.names}</strong>
      <span>{data.position}</span>
      <small>{data.comments}</small>
      {withRecommendations && <small>{data.recommendations || 'No recommendation'}</small>}
      <em>{data.status}</em>
    </div>
  );
}

function ProgressCell({ data }) {
  return (
    <div className="workflow-cell">
      <strong>{money(data.spentAmount)}</strong>
      <span>{data.referenceNo}</span>
      <small>{data.paymentSupportingDocument}</small>
      <small>Variance: {money(data.variance)}</small>
      <em>{data.varianceReason || data.varianceExplanation}</em>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <header>{title}</header>
      <div>{children}</div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Row({ title, meta, status }) {
  return (
    <div className="row">
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      <span className="status">{status}</span>
    </div>
  );
}

function ProgressRow({ label, value }) {
  return (
    <div className="progress-row">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || 'Not set'}</dd>
    </>
  );
}

function Input({ label, value, onChange, type = 'text', textarea = false }) {
  return (
    <label>
      <span>{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

createRoot(document.getElementById('root')).render(<App />);
