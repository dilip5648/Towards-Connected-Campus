import { useEffect, useState } from 'react';
import ActivityTracker from './ActivityTracker';

const API_BASE_URL = 'http://localhost:5000';

function Dashboard({ user, token, onLogout }) {
  const [showActivities, setShowActivities] = useState(
    window.location.pathname === '/activities'
  );

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const isStudent = user?.role === 'student';

  const isReviewer =
    user?.role === 'teacher' ||
    user?.role === 'hod';

  const isPo = user?.role === 'po';

  /*
    Load student statistics.
  */
  async function loadStats() {
    if (!isStudent || !token) {
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError('');

      const response = await fetch(
        `${API_BASE_URL}/activities/stats/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to load statistics'
        );
      }

      setStats(data);
    } catch (error) {
      console.error(error);
      setStatsError(error.message);
    } finally {
      setStatsLoading(false);
    }
  }

  /*
    Load statistics when Dashboard first opens.
  */
  useEffect(() => {
    loadStats();
  }, [isStudent, token]);

  /*
    Listen for browser navigation.
  */
  useEffect(() => {
    function handlePopState() {
      const activitiesOpen =
        window.location.pathname === '/activities';

      setShowActivities(activitiesOpen);

      /*
        When returning to Dashboard,
        reload the statistics.
      */
      if (!activitiesOpen) {
        loadStats();
      }
    }

    window.addEventListener(
      'popstate',
      handlePopState
    );

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState
      );
    };
  }, [isStudent, token]);

  /*
    Open Activity Tracker.
  */
  function openActivities() {
    window.history.pushState(
      {},
      '',
      '/activities'
    );

    setShowActivities(true);
  }

  /*
    Return to Dashboard and
    immediately reload statistics.
  */
  async function closeActivities() {
    window.history.pushState(
      {},
      '',
      '/'
    );

    setShowActivities(false);

    await loadStats();
  }

  /*
    Logout.
  */
  function handleLogout() {
    window.history.replaceState(
      {},
      '',
      '/'
    );

    onLogout();
  }

  return (
    <div className="dashboard">

      {/* =====================================
          HEADER
      ====================================== */}

      <header className="dashboard-header">

        <div className="dashboard-brand">

          <div className="brand-mark">
            T
          </div>

          <div>

            <h1>
              Towards Connected Campus
            </h1>

            <p className="dashboard-welcome">
              Welcome, <strong>{user?.name}</strong>
            </p>

          </div>

        </div>

        <div className="dashboard-user-info">

          <div className="user-detail">

            <span>
              BEC
            </span>

            <strong>
              {user?.bec}
            </strong>

          </div>

          <div className="user-detail">

            <span>
              Role
            </span>

            <strong className="role-badge">
              {user?.role}
            </strong>

          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* =====================================
          DASHBOARD
      ====================================== */}

      {!showActivities ? (

        <main className="dashboard-content">

          <div className="dashboard-heading">

            <span className="section-label">
              CAMPUS PORTAL
            </span>

            <h2>
              Dashboard
            </h2>

            <p>
              Your connected campus workspace.
            </p>

          </div>


          {/* PROFILE */}

          <div className="dashboard-card profile-card">

            <div className="card-heading">

              <div className="card-icon">
                👤
              </div>

              <div>

                <span className="card-label">
                  PROFILE
                </span>

                <h3>
                  Student Profile
                </h3>

              </div>

            </div>


            <div className="profile-grid">

              <div className="profile-item">

                <span>
                  Name
                </span>

                <strong>
                  {user?.name ||
                    'Not available'}
                </strong>

              </div>


              <div className="profile-item">

                <span>
                  BEC
                </span>

                <strong>
                  {user?.bec ||
                    'Not available'}
                </strong>

              </div>


              <div className="profile-item">

                <span>
                  Department
                </span>

                <strong>
                  {user?.department ||
                    'Not available'}
                </strong>

              </div>


              <div className="profile-item">

                <span>
                  Role
                </span>

                <strong>
                  {user?.role ||
                    'Not available'}
                </strong>

              </div>

            </div>

          </div>


          {/* STUDENT STATISTICS */}

          {isStudent && (

            <div className="dashboard-card statistics-card">

              <div className="card-heading">

                <div className="card-icon">
                  ◈
                </div>

                <div>

                  <span className="card-label">
                    ACTIVITY
                  </span>

                  <h3>
                    Campus Activity Overview
                  </h3>

                </div>

              </div>


              {statsLoading && (

                <p className="loading-message">
                  Loading statistics...
                </p>

              )}


              {statsError && (

                <p className="error-message">
                  {statsError}
                </p>

              )}


              {!statsLoading &&
                !statsError && (

                  <div className="stats-grid">

                    <div className="stat-box stat-total">

                      <span>
                        Total
                      </span>

                      <strong>
                        {stats.total}
                      </strong>

                      <small>
                        Activities
                      </small>

                    </div>


                    <div className="stat-box stat-pending">

                      <span>
                        Pending
                      </span>

                      <strong>
                        {stats.pending}
                      </strong>

                      <small>
                        Awaiting review
                      </small>

                    </div>


                    <div className="stat-box stat-verified">

                      <span>
                        Verified
                      </span>

                      <strong>
                        {stats.verified}
                      </strong>

                      <small>
                        Approved
                      </small>

                    </div>


                    <div className="stat-box stat-rejected">

                      <span>
                        Rejected
                      </span>

                      <strong>
                        {stats.rejected}
                      </strong>

                      <small>
                        Needs attention
                      </small>

                    </div>

                  </div>

                )}

            </div>

          )}


          {/* STUDENT ACTIVITY */}

          {isStudent && (

            <div className="dashboard-card action-card">

              <div className="card-heading">

                <div className="card-icon">
                  ✦
                </div>

                <div>

                  <span className="card-label">
                    STUDENT
                  </span>

                  <h3>
                    Activity Tracker
                  </h3>

                </div>

              </div>


              <p>
                Submit and view your campus
                activities.
              </p>


              <button
                type="button"
                className="primary-action"
                onClick={openActivities}
              >
                Open Activity Tracker

                <span>
                  →
                </span>

              </button>

            </div>

          )}


          {/* TEACHER / HOD */}

          {isReviewer && (

            <div className="dashboard-card action-card">

              <div className="card-heading">

                <div className="card-icon">
                  ✓
                </div>

                <div>

                  <span className="card-label">
                    REVIEW
                  </span>

                  <h3>
                    Activity Verification
                  </h3>

                </div>

              </div>


              <p>
                Review and verify student
                activities.
              </p>


              <button
                type="button"
                className="primary-action"
                onClick={openActivities}
              >
                Open Activity Verification

                <span>
                  →
                </span>

              </button>

            </div>

          )}


          {/* PLACEMENT CELL */}

          {isPo && (

            <div className="dashboard-card action-card">

              <div className="card-heading">

                <div className="card-icon">
                  ◉
                </div>

                <div>

                  <span className="card-label">
                    PLACEMENT CELL
                  </span>

                  <h3>
                    Verified Activities
                  </h3>

                </div>

              </div>


              <p>
                View verified student
                activities.
              </p>


              <button
                type="button"
                className="primary-action"
                onClick={openActivities}
              >
                Open Verified Activities

                <span>
                  →
                </span>

              </button>

            </div>

          )}

        </main>

      ) : (

        /* ===================================
           ACTIVITY PAGE
        ==================================== */

        <main className="activity-page">

          <button
            type="button"
            className="back-button"
            onClick={closeActivities}
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