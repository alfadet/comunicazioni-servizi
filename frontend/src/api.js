async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || 'Errore di rete');
  }
  return data;
}

async function downloadPdf(path, filename) {
  const res = await fetch(`/api${path}`);
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
  previewCommunication: (protocols) =>
    request('/communications/preview', { method: 'POST', body: JSON.stringify({ protocols }) }),
  sendCommunication: (protocols) =>
    request('/communications', { method: 'POST', body: JSON.stringify({ protocols }) }),
};
