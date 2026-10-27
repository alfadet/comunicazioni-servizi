const TOKEN_KEY = 'auth_token';

export const auth = {
  hasToken: () => !!localStorage.getItem(TOKEN_KEY),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleExpired(res) {
  if (res.status === 401 && localStorage.getItem(TOKEN_KEY)) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('auth-expired'));
  }
}

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  handleExpired(res);
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || 'Errore di rete');
  }
  return data;
}

async function downloadPdf(path, filename) {
  const res = await fetch(`/api${path}`, { headers: authHeaders() });
  handleExpired(res);
  if (!res.ok) throw new Error('Impossibile generare il PDF');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  login: async (password) => {
    const { token } = await request('/auth/login', { method: 'POST', body: JSON.stringify({ password }) });
    localStorage.setItem(TOKEN_KEY, token);
  },
  getOperators: () => request('/operators'),
  addOperator: (nome) => request('/operators', { method: 'POST', body: JSON.stringify({ nome }) }),
  importOperators: (nomi) => request('/operators/bulk', { method: 'POST', body: JSON.stringify({ nomi }) }),
  updateOperator: (id, data) => request(`/operators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOperator: (id) => request(`/operators/${id}`, { method: 'DELETE' }),
  getSites: () => request('/sites'),
  addSite: (nome) => request('/sites', { method: 'POST', body: JSON.stringify({ nome }) }),
  updateSite: (id, data) => request(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSite: (id) => request(`/sites/${id}`, { method: 'DELETE' }),
  getCommunications: () => request('/communications'),
  getServiceReport: (type, query) =>
    request(`/communications/report?type=${type}&query=${encodeURIComponent(query)}`),
  getMonthSummary: (year, month) => request(`/reports/summary?year=${year}&month=${month}`),
  getMonthProjection: (year, month) => request(`/reports/projection?year=${year}&month=${month}`),
  downloadMonthSummaryPdf: (year, month) =>
    downloadPdf(`/reports/summary/pdf?year=${year}&month=${month}`, `riepilogo_${year}_${String(month).padStart(2, '0')}.pdf`),
  downloadCommunicationPdf: (id) => downloadPdf(`/communications/${id}/pdf`, `comunicazione_${id}.pdf`),
  getCommunication: (id) => request(`/communications/${id}`),
  addOperatorsToProtocol: (id, idx, protocol, nomi) =>
    request(
      `/communications/${id}/protocols/${idx}/operators` +
        `?sito=${encodeURIComponent(protocol.sito)}&data=${encodeURIComponent(protocol.data)}`,
      { method: 'POST', body: JSON.stringify({ nomi }) }
    ),
  removeOperatorFromProtocol: (id, idx, protocol, nome) =>
    request(
      `/communications/${id}/protocols/${idx}/operators/${encodeURIComponent(nome)}` +
        `?sito=${encodeURIComponent(protocol.sito)}&data=${encodeURIComponent(protocol.data)}`,
      { method: 'DELETE' }
    ),
  deleteProtocol: (id, idx, protocol) =>
    request(
      `/communications/${id}/protocols/${idx}` +
        `?sito=${encodeURIComponent(protocol.sito)}&data=${encodeURIComponent(protocol.data)}`,
      { method: 'DELETE' }
    ),
  previewCommunication: (protocols) =>
    request('/communications/preview', { method: 'POST', body: JSON.stringify({ protocols }) }),
  sendCommunication: (protocols) =>
    request('/communications', { method: 'POST', body: JSON.stringify({ protocols }) }),
};
