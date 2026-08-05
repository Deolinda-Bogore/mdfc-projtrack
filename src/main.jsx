import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  adminOperations,
  assets,
  auditTrail,
  budgets,
  evidence,
  grants,
  hr,
  inventory,
  navigation,
  payments,
  projects as seedProjects,
  requests as seedRequests,
  roles,
  suppliers,
  systemBranches,
  tasks as seedTasks,
  travel,
} from './data.js';
import './styles.css';

const logoSrc = '/mdfc-logo.png';
const money = (value) => `RWF ${Number(value || 0).toLocaleString()}`;

function App() {
  const [role, setRole] = useState('manager');
  const [signedIn, setSignedIn] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [projects, setProjects] = useState(seedProjects);
  const [tasks, setTasks] = useState(seedTasks);
  const [requests, setRequests] = useState(seedRequests);
  const [operations, setOperations] = useState(adminOperations);
  const [users, setUsers] = useState(Object.values(roles).map((item) => [item.name, item.label, item.description]));
  const [toast, setToast] = useState('');

  const navItems = navigation[role];
  const activeRole = roles[role];

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }

  function login(selectedRole) {
    setRole(selectedRole);
    setPage(navigation[selectedRole][0][0]);
    setSignedIn(true);
  }

  function addProject(project) {
    setProjects((current) => [{ ...project, id: current.length + 1, spent: 0, progress: 0, status: 'Planning' }, ...current]);
    setPage('programs');
    notify('Project created');
  }

  function addTask(task) {
    setTasks((current) => [{ ...task, id: current.length + 1, status: 'Not Started' }, ...current]);
    notify('Task created under project');
  }

  function addRequest(request) {
    const next = {
      ...request,
      id: requests.length + 1,
      code: `REQ-${String(requests.length + 1).padStart(3, '0')}`,
      status: 'Submitted',
      verifiedBy: 'Pending finance verification',
      executiveApproval: 'Pending',
      boardApproval: 'Not required yet',
      comments: 'New request submitted.',
      recommendations: 'Awaiting review.',
      spentAmount: 0,
      referenceNo: 'Pending',
      variance: 0,
    };
    setRequests((current) => [next, ...current]);
    notify('Request submitted');
  }

  function updateRequest(id, status) {
    setRequests((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              verifiedBy: status === 'Returned' ? 'Returned by Finance Officer' : 'Finance Officer',
              executiveApproval: status === 'Approved' ? 'Approved' : item.executiveApproval,
              boardApproval: status === 'Approved' ? 'Approved' : item.boardApproval,
              comments: status === 'Returned' ? 'Correction requested before approval.' : 'Request updated through workflow.',
              recommendations: status === 'Rejected' ? 'Do not proceed.' : 'Proceed with next workflow step.',
            }
          : item,
      ),
    );
    notify(`Request ${status.toLowerCase()}`);
  }

  function addOperation(operation) {
    setOperations((current) => [[operation.name, Number(operation.amount || 0), operation.responsible, operation.timeline, operation.remarks, operation.method], ...current]);
    notify('Admin operation created');
  }

  function sendOperationToFinance(operation) {
    addRequest({
      requestDate: new Date().toISOString().slice(0, 10),
      requestingTitle: operation[2],
      department: 'Administration',
      project: 'Administration Daily Operations',
      donor: 'Core funds',
      budgetLine: 'Administrative operations',
      particularActivity: operation[0],
      item: operation[0],
      details: `${operation[0]} payment request from Administration.`,
      amount: operation[1],
      documents: 'Administrative supporting documents',
      preparedBy: operation[2],
    });
    setPage(role === 'finance' ? 'requests' : 'finance');
  }

  function addUser(user) {
    setUsers((current) => [[user.name, user.department, user.systemRole], ...current]);
    notify('User added');
  }

  if (!signedIn) {
    return <Login selectedRole={role} setSelectedRole={setRole} onLogin={login} />;
  }

  return (
    <div className="app-shell">
      <Sidebar activeRole={activeRole} navItems={navItems} page={page} setPage={setPage} onLogout={() => setSignedIn(false)} />
      <main className="main">
        <Topbar title={navItems.find(([id]) => id === page)?.[1] || 'Dashboard'} activeRole={activeRole} />
        <div className="content">
          <Page
            role={role}
            page={page}
            projects={projects}
            tasks={tasks}
            requests={requests}
            operations={operations}
            users={users}
            addProject={addProject}
            addTask={addTask}
            addRequest={addRequest}
            updateRequest={updateRequest}
            addOperation={addOperation}
            sendOperationToFinance={sendOperationToFinance}
            addUser={addUser}
            notify={notify}
          />
        </div>
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Login({ selectedRole, setSelectedRole, onLogin }) {
  return (
    <section className="login-screen">
      <div className="login-shell">
        <div className="login-card">
          <img className="login-logo" src={logoSrc} alt="Medical Doctors For Choice logo" />
          <p className="eyebrow">MDFC PMS</p>
          <h1>Project Management System</h1>
          <p className="login-muted">Choose a role to enter the system workspace.</p>
          <div className="role-grid">
            {Object.entries(roles).map(([id, item]) => (
              <button className={selectedRole === id ? 'role-chip active' : 'role-chip'} key={id} onClick={() => setSelectedRole(id)} type="button">
                <span>{item.initials}</span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
          <Input label="Email" value={`${selectedRole}@mdfc.rw`} readOnly dark />
          <Input label="Password" value="********" readOnly dark type="password" />
          <button className="primary wide" onClick={() => onLogin(selectedRole)} type="button">
            Sign in
          </button>
          <p className="demo-note">Demo only. Select any role above.</p>
        </div>
        <SystemStructure />
      </div>
    </section>
  );
}

function SystemStructure() {
  return (
    <section className="system-panel">
      <header>Whole System Structure</header>
      <div className="system-tree">
        <div className="system-root">PMS</div>
        <div className="system-branches">
          {systemBranches.map((branch) => (
            <article className={`system-branch ${branch.id}`} key={branch.id}>
              <h2>{branch.title}</h2>
              <p>{branch.subtitle}</p>
              <ul>
                {branch.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="golden-rule">
          <strong>Golden Rule:</strong> every transaction links to a project, donor, budget line, user, approval history, supporting documents, and audit trail.
        </div>
      </div>
    </section>
  );
}

function Sidebar({ activeRole, navItems, page, setPage, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><img src={logoSrc} alt="Medical Doctors For Choice logo" /></div>
        <div>
          <strong>ProjTrack</strong>
          <span>MDFC Rwanda</span>
        </div>
      </div>
      <nav>
        {navItems.map(([id, label]) => (
          <button className={page === id ? 'nav-item active' : 'nav-item'} key={id} onClick={() => setPage(id)} type="button">
            {label}
          </button>
        ))}
      </nav>
      <div className="user-card">
        <div className="avatar">{activeRole.initials}</div>
        <div>
          <strong>{activeRole.name}</strong>
          <span>{activeRole.label}</span>
        </div>
        <button className="text-button" onClick={onLogout} type="button">Exit</button>
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

function Page(props) {
  const { page, role } = props;
  if (page === 'programs') return <Programs {...props} />;
  if (page === 'tasks') return <Tasks {...props} employeeOnly={role === 'employee'} />;
  if (page === 'requests') return <Requests {...props} financeMode={role === 'finance' || role === 'director'} />;
  if (page === 'finance') return <Finance {...props} />;
  if (page === 'budget') return <Budget />;
  if (page === 'procurement') return <Procurement />;
  if (page === 'payments') return <Payments />;
  if (page === 'administration') return <Administration {...props} />;
  if (page === 'approvals') return <Requests {...props} financeMode />;
  if (page === 'evidence') return <Evidence />;
  if (page === 'grants') return <Grants />;
  if (page === 'worklog') return <WorkLog tasks={props.tasks} />;
  if (page === 'audit') return <Audit />;
  if (page === 'reports') return <Reports notify={props.notify} />;
  if (page === 'users') return <Users users={props.users} addUser={props.addUser} />;
  return <Dashboard {...props} />;
}

function Dashboard({ role, projects, tasks, requests }) {
  const totalBudget = projects.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = projects.reduce((sum, item) => sum + item.spent, 0);
  const greeting = role === 'employee' ? 'Hello implementor' : `Hello ${roles[role].label}`;
  return (
    <>
      <section className="hero">
        <p className="eyebrow">{roles[role].label} workspace</p>
        <h1>{greeting}</h1>
        <span>Programs, Finance, and Administration are connected through requests, budgets, documents, and audit history.</span>
      </section>
      <div className="stats">
        <Stat label="Projects" value={projects.length} />
        <Stat label="Tasks" value={tasks.length} />
        <Stat label="Submitted Requests" value={requests.filter((item) => item.status === 'Submitted').length} />
        <Stat label="Total Budget" value={money(totalBudget)} />
        <Stat label="Spent" value={money(totalSpent)} />
      </div>
      <div className="grid three">
        {systemBranches.map((branch) => (
          <Panel title={branch.title} key={branch.id}>
            <p className="muted">{branch.subtitle}</p>
            <ul className="simple-list">
              {branch.items.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Panel>
        ))}
      </div>
      <div className="grid two">
        <Panel title="Recent Requests">
          {requests.map((item) => <Row key={item.id} title={item.details} meta={`${item.code} - ${money(item.amount)}`} status={item.status} />)}
        </Panel>
        <Panel title="Project Progress">
          {projects.map((project) => <ProgressRow key={project.id} label={project.title} value={project.progress} />)}
        </Panel>
      </div>
    </>
  );
}

function Programs({ projects, addProject }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SectionHead title="Programs" action="Create Project" onClick={() => setOpen((value) => !value)} />
      {open && <ProjectForm onSubmit={addProject} />}
      <div className="project-grid">
        {projects.map((project) => (
          <article className="project-card" key={project.id}>
            <span className="status">{project.status}</span>
            <h3>{project.title}</h3>
            <p>{project.narrative}</p>
            <dl className="detail-grid">
              <Detail label="Application or proposal work plan" value={project.workPlan} />
              <Detail label="Detailed budget" value={project.budgetDetails} />
              <Detail label="Results or objectives" value={project.results} />
              <Detail label="Responsible title" value={project.owner} />
              <Detail label="Donor" value={project.donor} />
              <Detail label="Budget" value={money(project.budget)} />
            </dl>
            <div className="chip-row">{project.activities.map((activity) => <span className="chip" key={activity}>{activity}</span>)}</div>
            <ProgressRow label="Progress" value={project.progress} />
          </article>
        ))}
      </div>
    </>
  );
}

function ProjectForm({ onSubmit }) {
  const [form, setForm] = useState({ title: '', donor: '', owner: '', workPlan: '', budgetDetails: '', results: '', narrative: '', budget: '', activities: '' });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  function submit(event) {
    event.preventDefault();
    if (!form.title || !form.narrative) return;
    onSubmit({ ...form, budget: Number(form.budget || 0), activities: form.activities.split(',').map((item) => item.trim()).filter(Boolean) });
    setForm({ title: '', donor: '', owner: '', workPlan: '', budgetDetails: '', results: '', narrative: '', budget: '', activities: '' });
  }
  return (
    <form className="form-card" onSubmit={submit}>
      <Input label="Project title" value={form.title} onChange={(value) => update('title', value)} />
      <Input label="Narrative / description and attachments" value={form.narrative} onChange={(value) => update('narrative', value)} textarea />
      <div className="form-row">
        <Input label="Application or proposal work plan" value={form.workPlan} onChange={(value) => update('workPlan', value)} />
        <Input label="Detailed budget" value={form.budgetDetails} onChange={(value) => update('budgetDetails', value)} />
      </div>
      <div className="form-row">
        <Input label="Results or objectives" value={form.results} onChange={(value) => update('results', value)} />
        <Input label="Responsible title" value={form.owner} onChange={(value) => update('owner', value)} list="titles" />
      </div>
      <div className="form-row">
        <Input label="Donor" value={form.donor} onChange={(value) => update('donor', value)} />
        <Input label="Budget" type="number" value={form.budget} onChange={(value) => update('budget', value)} />
      </div>
      <Input label="Create activities" value={form.activities} onChange={(value) => update('activities', value)} placeholder="Separate activities with commas" />
      <button className="primary" type="submit">Create project</button>
    </form>
  );
}

function Tasks({ projects, tasks, addTask, employeeOnly = false }) {
  const [open, setOpen] = useState(false);
  const visibleTasks = employeeOnly ? tasks.filter((task) => task.assignee === 'Implementor') : tasks;
  return (
    <>
      {!employeeOnly && <SectionHead title="Tasks Under Projects" action="Create Task" onClick={() => setOpen((value) => !value)} />}
      {open && <TaskForm projects={projects} onSubmit={addTask} />}
      <div className="kanban">
        {['Not Started', 'In Progress', 'Review', 'Done'].map((status) => (
          <Panel title={status} key={status}>
            {visibleTasks.filter((task) => task.status === status).map((task) => (
              <article className="task-card" key={task.id}>
                <strong>{task.title}</strong>
                <span>{projects.find((project) => project.id === task.projectId)?.title}</span>
                <small>{task.assignee} - {task.priority} - Due {task.due}</small>
                <p>{task.outputs}</p>
              </article>
            ))}
          </Panel>
        ))}
      </div>
    </>
  );
}

function TaskForm({ projects, onSubmit }) {
  const [form, setForm] = useState({ projectId: projects[0]?.id || '', title: '', assignee: '', priority: 'Medium', due: '', inputs: '', outputs: '', indicators: '', meansOfVerification: '', attachments: '', remarks: '', challenges: '' });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  function submit(event) {
    event.preventDefault();
    if (!form.projectId || !form.title) return;
    onSubmit({ ...form, projectId: Number(form.projectId) });
  }
  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-row">
        <Select label="Project" value={form.projectId} onChange={(value) => update('projectId', value)} options={projects.map((project) => [project.id, project.title])} />
        <Input label="Assign to" value={form.assignee} onChange={(value) => update('assignee', value)} list="titles" />
      </div>
      <Input label="Activity title" value={form.title} onChange={(value) => update('title', value)} />
      <div className="form-row">
        <Select label="Priority" value={form.priority} onChange={(value) => update('priority', value)} options={['High', 'Medium', 'Low']} />
        <Input label="Timeline" type="date" value={form.due} onChange={(value) => update('due', value)} />
      </div>
      <div className="form-row">
        <Input label="Inputs" value={form.inputs} onChange={(value) => update('inputs', value)} />
        <Input label="Outputs" value={form.outputs} onChange={(value) => update('outputs', value)} />
      </div>
      <div className="form-row">
        <Input label="Indicators" value={form.indicators} onChange={(value) => update('indicators', value)} />
        <Input label="Means of verification" value={form.meansOfVerification} onChange={(value) => update('meansOfVerification', value)} />
      </div>
      <div className="form-row">
        <Input label="Attachments" value={form.attachments} onChange={(value) => update('attachments', value)} />
        <Input label="Remarks / challenges / comments" value={`${form.remarks}${form.challenges ? ` / ${form.challenges}` : ''}`} onChange={(value) => update('remarks', value)} />
      </div>
      <button className="primary" type="submit">Create task</button>
    </form>
  );
}

function Requests({ requests, addRequest, updateRequest, financeMode = false }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {!financeMode && <SectionHead title="Smart Requisition" action="Create Request" onClick={() => setOpen((value) => !value)} />}
      {open && <RequestForm onSubmit={addRequest} />}
      <Panel title={financeMode ? 'Request Review' : 'Smart Requisition'}>
        <div className="wide-table">
          <table>
            <thead>
              <tr>
                {['No', 'Date of Requesting', 'Requesting Title / Department', 'Project', 'Donor', 'Budget Line', 'Particular Activity', 'Item', 'Amount', 'Supporting Documents', 'Prepared By', 'Finance Verification', 'Executive Approval', 'Board Approval', 'Progress', 'Actions'].map((head) => <th key={head}>{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.requestDate}</td>
                  <td>{item.requestingTitle}<br /><span className="muted">{item.department}</span></td>
                  <td>{item.project}</td>
                  <td>{item.donor}</td>
                  <td>{item.budgetLine}</td>
                  <td>{item.particularActivity}</td>
                  <td>{item.item}</td>
                  <td>{money(item.amount)}</td>
                  <td>{item.documents}</td>
                  <td>{item.preparedBy}</td>
                  <td>{item.verifiedBy}<br /><small>{item.comments}</small></td>
                  <td>{item.executiveApproval}</td>
                  <td>{item.boardApproval}</td>
                  <td>{item.referenceNo}<br /><small>Spent {money(item.spentAmount)} - Variance {money(item.variance)}</small></td>
                  <td>
                    <div className="action-stack">
                      <span className="status">{item.status}</span>
                      {financeMode && (
                        <>
                          <button className="primary small" onClick={() => updateRequest(item.id, 'Approved')} type="button">Approve</button>
                          <button className="secondary small" onClick={() => updateRequest(item.id, 'Returned')} type="button">Return</button>
                          <button className="danger small" onClick={() => updateRequest(item.id, 'Rejected')} type="button">Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function RequestForm({ onSubmit }) {
  const [form, setForm] = useState({ requestDate: '', requestingTitle: '', department: '', project: '', donor: '', budgetLine: '', particularActivity: '', item: '', details: '', amount: '', documents: '', preparedBy: '' });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  function submit(event) {
    event.preventDefault();
    if (!form.requestDate || !form.particularActivity || !form.item) return;
    onSubmit({ ...form, amount: Number(form.amount || 0) });
  }
  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-row">
        <Input label="Date of requesting" type="date" value={form.requestDate} onChange={(value) => update('requestDate', value)} />
        <Input label="Requesting title / department" value={form.requestingTitle} onChange={(value) => update('requestingTitle', value)} list="titles" />
      </div>
      <div className="form-row">
        <Input label="Department" value={form.department} onChange={(value) => update('department', value)} list="departments" />
        <Input label="Project" value={form.project} onChange={(value) => update('project', value)} list="projects" />
      </div>
      <div className="form-row">
        <Input label="Donor" value={form.donor} onChange={(value) => update('donor', value)} />
        <Input label="Budget line" value={form.budgetLine} onChange={(value) => update('budgetLine', value)} />
      </div>
      <div className="form-row">
        <Input label="Particular activity" value={form.particularActivity} onChange={(value) => update('particularActivity', value)} />
        <Input label="Item" value={form.item} onChange={(value) => update('item', value)} />
      </div>
      <Input label="Details" value={form.details} onChange={(value) => update('details', value)} textarea />
      <div className="form-row">
        <Input label="Amount" type="number" value={form.amount} onChange={(value) => update('amount', value)} />
        <Input label="Supporting documents" value={form.documents} onChange={(value) => update('documents', value)} />
      </div>
      <Input label="Prepared by" value={form.preparedBy} onChange={(value) => update('preparedBy', value)} />
      <button className="primary" type="submit">Submit request</button>
    </form>
  );
}

function Finance({ projects, requests }) {
  const totalBudget = projects.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = projects.reduce((sum, item) => sum + item.spent, 0);
  return (
    <>
      <div className="stats">
        <Stat label="Budget" value={money(totalBudget)} />
        <Stat label="Actual" value={money(totalSpent)} />
        <Stat label="Remaining" value={money(totalBudget - totalSpent)} />
        <Stat label="Pending Requests" value={requests.filter((item) => item.status === 'Submitted').length} />
      </div>
      <div className="grid two">
        <Panel title="Finance Flow">
          <Flow />
        </Panel>
        <Panel title="Golden Rule">
          <ul className="simple-list">
            {['Project', 'Donor', 'Budget line', 'User', 'Approval history', 'Supporting documents', 'Audit trail'].map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function Flow() {
  return (
    <div className="flow">
      {['Request Preparator / Initiator', 'Finance Department Lead', 'Executive Director', 'Chair of Board', 'Permission and payment execution'].map((stage) => (
        <div className="flow-step" key={stage}>{stage}</div>
      ))}
    </div>
  );
}

function Budget() {
  return <DataTable title="Budget Management" headers={['Project', 'Donor', 'Category', 'Budget Line', 'Approved Budget', 'Actual Expenditure', 'Remaining Balance', 'Forecast', 'Alert']} rows={budgets.map((row) => row.map((item, index) => index >= 4 && index <= 7 ? money(item) : item))} />;
}

function Procurement() {
  return <DataTable title="Procurement and Supplier Management" headers={['Supplier Name', 'Category', 'Contact Person', 'Phone', 'Email', 'Contract End', 'Status', 'Uploaded Contract / Quotes']} rows={suppliers} />;
}

function Payments() {
  return <DataTable title="Finance and Payments" headers={['Payment Ref', 'Payee', 'Project', 'Donor', 'Budget Line', 'Amount', 'Method', 'Status']} rows={payments.map((row) => row.map((item, index) => index === 5 ? money(item) : item))} />;
}

function Administration({ operations, addOperation, sendOperationToFinance }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SectionHead title="Administration" action="Create Admin Operation" onClick={() => setOpen((value) => !value)} />
      {open && <AdminOperationForm onSubmit={addOperation} />}
      <Panel title="Monthly Operations">
        <div className="wide-table">
          <table>
            <thead><tr>{['Operation', 'Amount', 'Responsible', 'Timeline', 'Remarks', 'Mode', 'Action'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
            <tbody>
              {operations.map((operation) => (
                <tr key={`${operation[0]}-${operation[2]}`}>
                  <td>{operation[0]}</td>
                  <td>{money(operation[1])}</td>
                  <td>{operation[2]}</td>
                  <td>{operation[3]}</td>
                  <td>{operation[4]}</td>
                  <td>{operation[5]}</td>
                  <td><button className="primary small" onClick={() => sendOperationToFinance(operation)} type="button">Send to Finance Request</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="grid two">
        <DataTable title="Asset Register" headers={['Category', 'Name', 'Responsible', 'Contact', 'Status', 'Supporting Document']} rows={assets} />
        <DataTable title="HR / Employee Records" headers={['Employee', 'Role', 'Department', 'Contract', 'Payroll', 'Remarks']} rows={hr} />
        <DataTable title="Inventory" headers={['Item', 'Category', 'Qty', 'Assigned', 'Location', 'Status']} rows={inventory} />
        <DataTable title="Travel and Vehicles" headers={['Vehicle', 'Purpose', 'Traveler', 'Destination', 'Date', 'Status']} rows={travel} />
      </div>
    </>
  );
}

function AdminOperationForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', amount: '', responsible: '', timeline: '', remarks: '', method: '' });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  function submit(event) {
    event.preventDefault();
    if (!form.name || !form.amount) return;
    onSubmit(form);
  }
  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-row">
        <Input label="Monthly operation name" value={form.name} onChange={(value) => update('name', value)} />
        <Input label="Amount" type="number" value={form.amount} onChange={(value) => update('amount', value)} />
      </div>
      <div className="form-row">
        <Input label="Responsible" value={form.responsible} onChange={(value) => update('responsible', value)} list="titles" />
        <Input label="Timeline / due date" value={form.timeline} onChange={(value) => update('timeline', value)} />
      </div>
      <div className="form-row">
        <Input label="Remarks" value={form.remarks} onChange={(value) => update('remarks', value)} />
        <Input label="Mode" value={form.method} onChange={(value) => update('method', value)} placeholder="Bank transfer, cheque, mobile money" />
      </div>
      <button className="primary" type="submit">Create admin operation</button>
    </form>
  );
}

function Evidence() {
  return <DataTable title="M&E Evidence" headers={['Project', 'Activity', 'Data', 'Testimonials', 'Documentary / Videos', 'Survey Results', 'Status']} rows={evidence} />;
}

function Grants() {
  return <DataTable title="Grants Database" headers={['Grant Name', 'Funder', 'Who', 'Link', 'Progress', 'Remarks']} rows={grants} />;
}

function WorkLog({ tasks }) {
  return <DataTable title="My Work Log" headers={['Task', 'Project ID', 'Status', 'Due Date', 'Remarks']} rows={tasks.filter((task) => task.assignee === 'Implementor').map((task) => [task.title, task.projectId, task.status, task.due, task.remarks])} />;
}

function Audit() {
  return <DataTable title="Audit Trail and Archive" headers={['Time', 'User', 'Action', 'Record', 'Project', 'Donor', 'Budget Line', 'Status']} rows={auditTrail} />;
}

function Reports({ notify }) {
  return (
    <div className="grid three">
      {['Programs Report', 'Finance Report', 'Administration Report'].map((title) => (
        <Panel title={title} key={title}>
          <p className="muted">Export-ready summary for management review.</p>
          <button className="secondary" onClick={() => notify(`${title} prepared for export`)} type="button">Export</button>
        </Panel>
      ))}
    </div>
  );
}

function Users({ users, addUser }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SectionHead title="Users" action="Add User" onClick={() => setOpen((value) => !value)} />
      {open && <UserForm onSubmit={addUser} />}
      <DataTable title="System Users" headers={['Name / Title', 'Department', 'System Role']} rows={users} />
    </>
  );
}

function UserForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', department: '', systemRole: '' });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  function submit(event) {
    event.preventDefault();
    if (!form.name) return;
    onSubmit(form);
  }
  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-row">
        <Input label="Name or title" value={form.name} onChange={(value) => update('name', value)} />
        <Input label="Department" value={form.department} onChange={(value) => update('department', value)} list="departments" />
      </div>
      <Input label="System role" value={form.systemRole} onChange={(value) => update('systemRole', value)} list="system-roles" />
      <button className="primary" type="submit">Add user</button>
    </form>
  );
}

function DataTable({ title, headers, rows }) {
  return (
    <Panel title={title}>
      <div className="wide-table">
        <table>
          <thead><tr>{headers.map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`}>{row.map((cell, index) => <td key={`${title}-${rowIndex}-${index}`}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function SectionHead({ title, action, onClick }) {
  return (
    <div className="section-head">
      <h3>{title}</h3>
      <button className="primary" onClick={onClick} type="button">{action}</button>
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
      <div className="progress-track"><span style={{ width: `${Math.min(value, 100)}%` }} /></div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || 'Not set'}</dd>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', textarea = false, readOnly = false, dark = false, list, placeholder }) {
  return (
    <label className={dark ? 'dark-field' : ''}>
      <span>{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange?.(event.target.value)} readOnly={readOnly} placeholder={placeholder} rows="3" />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange?.(event.target.value)} readOnly={readOnly} list={list} placeholder={placeholder} />
      )}
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, option];
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

function Datalists() {
  return (
    <>
      <datalist id="titles">
        {['Project Lead', 'Implementor', 'Finance Officer', 'M&E Officer', 'Administrative Assistant', 'Executive Director', 'Board Chair'].map((item) => <option value={item} key={item} />)}
      </datalist>
      <datalist id="departments">
        {['Programs', 'Finance', 'Administration', 'Human Resources', 'Procurement', 'Digital Innovation'].map((item) => <option value={item} key={item} />)}
      </datalist>
      <datalist id="system-roles">
        {['Director', 'Manager', 'Employee', 'Finance Officer', 'Administrator', 'Viewer'].map((item) => <option value={item} key={item} />)}
      </datalist>
      <datalist id="projects">
        {seedProjects.map((project) => <option value={project.title} key={project.title} />)}
      </datalist>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <>
    <Datalists />
    <App />
  </>,
);
