CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  display_name TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  donor TEXT,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'Planning',
  budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
  spent NUMERIC(14, 2) NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  work_plan TEXT,
  budget_details TEXT,
  results TEXT,
  narrative TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee TEXT,
  status TEXT NOT NULL DEFAULT 'Not Started',
  priority TEXT NOT NULL DEFAULT 'Medium',
  due DATE,
  inputs TEXT,
  outputs TEXT,
  indicators TEXT,
  means_of_verification TEXT,
  attachments TEXT,
  remarks TEXT,
  challenges TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE requisitions (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  request_date DATE NOT NULL,
  requesting_title TEXT,
  department TEXT,
  project TEXT,
  donor TEXT,
  budget_line TEXT,
  particular_activity TEXT,
  item TEXT,
  details TEXT,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  documents TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted',
  prepared_by TEXT,
  verified_by TEXT,
  executive_approval TEXT,
  board_approval TEXT,
  comments TEXT,
  recommendations TEXT,
  spent_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  reference_no TEXT,
  variance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_operations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  responsible TEXT,
  timeline TEXT,
  remarks TEXT,
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  happened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  record TEXT,
  project TEXT,
  donor TEXT,
  budget_line TEXT,
  status TEXT NOT NULL DEFAULT 'Logged'
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_project ON requisitions(project);
CREATE INDEX idx_audit_logs_happened_at ON audit_logs(happened_at DESC);
