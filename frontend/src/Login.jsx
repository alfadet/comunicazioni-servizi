import React, { useState } from 'react';
import { api } from './api.js';
import { IconShield } from './Icons.jsx';

export default function Login({ onLogin, onChangeViewMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(username, password);
      localStorage.setItem('token', data.token);
      onLogin(data.username);
    } catch (err) {
      setError(err.message);
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
          <label>Utente</label>
          <input
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </form>
      <button className="btn-ghost" style={{ margin: '16px auto 0', display: 'block' }} onClick={onChangeViewMode}>
        Cambia visualizzazione
      </button>
    </div>
  );
}
