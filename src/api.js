const API_BASE = '/api';
let sessionToken = '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  bootstrap: () => request('/bootstrap'),
  login: async ({ role, email, password }) => {
    const session = await request('/login', { method: 'POST', body: JSON.stringify({ role, email, password }) });
    sessionToken = session.token;
    return session;
  },
  createProject: (project) => request('/projects', { method: 'POST', body: JSON.stringify(project) }),
  createTask: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  createRequest: (requisition) => request('/requests', { method: 'POST', body: JSON.stringify(requisition) }),
  updateRequestStatus: (id, status) =>
    request(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createAdminOperation: (operation) =>
    request('/admin-operations', { method: 'POST', body: JSON.stringify(operation) }),
  createUser: (user) => request('/users', { method: 'POST', body: JSON.stringify(user) }),
  createUpload: (upload) => request('/uploads', { method: 'POST', body: JSON.stringify(upload) }),
  exportReport: (type) => request(`/reports/${type}`),
};
