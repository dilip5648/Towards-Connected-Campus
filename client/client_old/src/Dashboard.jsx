import { useState } from 'react';
import ActivityTracker from './ActivityTracker';

function Dashboard({ user, token, onLogout }) {
  const [showActivities, setShowActivities] = useState(false);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Towards Connected Campus</h1>

          <p>
            Welcome, <strong>{user?.name}</strong>
          </p>

          <p>
            BEC: <strong>{user?.bec}</strong>
          </p>

          <p>
            Role: <strong>{user?.role}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      {!showActivities ? (
        <main className="dashboard-content">
          <h2>Dashboard</h2>

          <div className="dashboard-card">
            <h3>Activity Tracker</h3>

            <p>
              Submit, verify, and view student activities.
            </p>

            <button
              type="button"
              onClick={() => setShowActivities(true)}
            >
              Open Activity Tracker
            </button>
          </div>
        </main>
      ) : (
        <main className="activity-page">
          <button
            type="button"
            onClick={() => setShowActivities(false)}
          >
            ← Back to Dashboard
          </button>

          <ActivityTracker
            user={user}
            token={token}
          />
        </main>
      )}
    </div>
  );
}

export default Dashboard;