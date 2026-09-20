import { useState } from 'react';
import Dashboard from './Dashboard';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [bec, setBec] = useState('');
  const [password, setPassword] = useState('');

  const [token, setToken] = useState(
    localStorage.getItem('token') || ''
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bec,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    setToken('');
    setBec('');
    setPassword('');
    setError('');
  }

  if (user && token) {
    return (
      <Dashboard
        user={user}
        token={token}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="login-page">
      <h1>Towards Connected Campus</h1>

      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="bec">BEC</label>

          <input
            id="bec"
            type="text"
            value={bec}
            onChange={(event) => setBec(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}
    </div>
  );
}

export default App;