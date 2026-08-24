function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
    throw new Error('Sessione scaduta');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || 'Errore di rete');
  }
  return data;
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getOperators: () => request('/operators'),
  addOperator: (nome) => request('/operators', { method: 'POST', body: JSON.stringify({ nome }) }),
  updateOperator: (id, data) => request(`/operators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOperator: (id) => request(`/operators/${id}`, { method: 'DELETE' }),
  getSites: () => request('/sites'),
  addSite: (nome) => request('/sites', { method: 'POST', body: JSON.stringify({ nome }) }),
  updateSite: (id, data) => request(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSite: (id) => request(`/sites/${id}`, { method: 'DELETE' }),
  getCommunications: () => request('/communications'),
  getServiceReport: (type, query) =>
    request(`/communications/report?type=${type}&query=${encodeURIComponent(query)}`),
  getCommunication: (id) => request(`/communications/${id}`),
  previewCommunication: (protocols) =>
    request('/communications/preview', { method: 'POST', body: JSON.stringify({ protocols }) }),
  sendCommunication: (protocols) =>
    request('/communications', { method: 'POST', body: JSON.stringify({ protocols }) }),
};
