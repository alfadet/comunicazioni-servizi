import React, { useState } from 'react';
import { api } from './api.js';
import { IconShield } from './Icons.jsx';

export default function Login({ onLogin, onChangeViewMode }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (loading || !password) return;
    setError('');
    setLoading(true);
    try {
      await api.login(password);
      onLogin();
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <IconShield size={34} className="view-mode-logo" />
      <h1>Comunicazioni Servizi<br />Alfa Security</h1>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Accesso in corso...' : 'Entra'}
        </button>
      </form>
      <button className="btn-ghost" style={{ margin: '16px auto 0', display: 'block' }} onClick={onChangeViewMode}>
        Cambia visualizzazione
      </button>
    </div>
  );
}
