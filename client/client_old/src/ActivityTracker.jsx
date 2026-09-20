import { useEffect, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000';

const categories = [
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'certification', label: 'Certification' },
  { value: 'nss_ncc', label: 'NSS / NCC' },
  { value: 'sports', label: 'Sports' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'other', label: 'Other' }
];

async function apiFetch(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

function ActivityTracker({ user, token }) {
  const [activities, setActivities] = useState([]);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [poActivities, setPoActivities] = useState([]);

  const [form, setForm] = useState({
    category: 'hackathon',
    title: '',
    organizer: '',
    activity_date: '',
    description: '',
    proof_url: ''
  });

  const [poBec, setPoBec] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isStudent = user?.role === 'student';
  const isReviewer = user?.role === 'teacher' || user?.role === 'hod';
  const isPo = user?.role === 'po';

  useEffect(() => {
    if (isStudent) {
      loadMyActivities();
    }

    if (isReviewer) {
      loadPendingActivities();
    }
  }, [user?.role]);

  async function loadMyActivities() {
    try {
      setLoading(true);
      setError('');

      const data = await apiFetch('/activities/me', token);
      setActivities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingActivities() {
    try {
      setLoading(true);
      setError('');

      const data = await apiFetch('/activities/pending', token);
      setPendingActivities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitActivity(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      setMessage('');

      await apiFetch('/activities', token, {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setMessage('Activity submitted successfully.');

      setForm({
        category: 'hackathon',
        title: '',
        organizer: '',
        activity_date: '',
        description: '',
        proof_url: ''
      });

      await loadMyActivities();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function reviewActivity(id, decision) {
    let rejectionReason = '';

    if (decision === 'rejected') {
      rejectionReason = window.prompt('Enter rejection reason:') || '';

      if (!rejectionReason.trim()) {
        setError('Rejection reason is required.');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      await apiFetch(`/activities/${id}/verify`, token, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          rejection_reason: rejectionReason
        })
      });

      setMessage(`Activity ${decision} successfully.`);
      await loadPendingActivities();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPoActivities(event) {
    event.preventDefault();

    if (!poBec.trim()) {
      setError('Enter a BEC.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const data = await apiFetch(
        `/activities/verified/${encodeURIComponent(poBec.trim())}`,
        token
      );

      setPoActivities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusClass(status) {
    return `status status-${status}`;
  }

  return (
    <div className="activity-tracker">
      <h1>Activity Tracker</h1>

      <p>
        Logged in as <strong>{user?.name}</strong> ({user?.role})
      </p>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {isStudent && (
        <>
          <section>
            <h2>Submit Activity</h2>

            <form onSubmit={submitActivity}>
              <div>
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value
                    })
                  }
                >
                  {categories.map((category) => (
                    <option
                      key={category.value}
                      value={category.value}
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value
                    })
                  }
                  required
                />
              </div>

              <div>
                <label>Organizer</label>
                <input
                  type="text"
                  value={form.organizer}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      organizer: event.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>Activity Date</label>
                <input
                  type="date"
                  value={form.activity_date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      activity_date: event.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value
                    })
                  }
                />
              </div>

              <div>
                <label>Proof URL</label>
                <input
                  type="url"
                  value={form.proof_url}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      proof_url: event.target.value
                    })
                  }
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Activity'}
              </button>
            </form>
          </section>

          <section>
            <h2>My Activities</h2>

            {loading && activities.length === 0 ? (
              <p>Loading activities...</p>
            ) : activities.length === 0 ? (
              <p>No activities submitted yet.</p>
            ) : (
              <div>
                {activities.map((activity) => (
                  <article key={activity.id}>
                    <h3>{activity.title}</h3>

                    <p>
                      <strong>Category:</strong> {activity.category}
                    </p>

                    <p>
                      <strong>Organizer:</strong>{' '}
                      {activity.organizer || '—'}
                    </p>

                    <p>
                      <strong>Date:</strong>{' '}
                      {activity.activity_date
                        ? new Date(
                            activity.activity_date
                          ).toLocaleDateString()
                        : '—'}
                    </p>

                    <p>
                      <strong>Description:</strong>{' '}
                      {activity.description || '—'}
                    </p>

                    {activity.proof_url && (
                      <p>
                        <strong>Proof:</strong>{' '}
                        <a
                          href={activity.proof_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open proof
                        </a>
                      </p>
                    )}

                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={getStatusClass(activity.status)}>
                        {activity.status}
                      </span>
                    </p>

                    {activity.rejection_reason && (
                      <p>
                        <strong>Rejection reason:</strong>{' '}
                        {activity.rejection_reason}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {isReviewer && (
        <section>
          <h2>Pending Activities</h2>

          <button
            type="button"
            onClick={loadPendingActivities}
            disabled={loading}
          >
            Refresh
          </button>

          {pendingActivities.length === 0 ? (
            <p>No pending activities.</p>
          ) : (
            <div>
              {pendingActivities.map((activity) => (
                <article key={activity.id}>
                  <h3>{activity.title}</h3>

                  <p>
                    <strong>Student:</strong> {activity.name}
                  </p>

                  <p>
                    <strong>BEC:</strong> {activity.bec}
                  </p>

                  <p>
                    <strong>Department:</strong>{' '}
                    {activity.department || '—'}
                  </p>

                  <p>
                    <strong>Category:</strong> {activity.category}
                  </p>

                  <p>
                    <strong>Organizer:</strong>{' '}
                    {activity.organizer || '—'}
                  </p>

                  <p>
                    <strong>Date:</strong>{' '}
                    {activity.activity_date
                      ? new Date(
                          activity.activity_date
                        ).toLocaleDateString()
                      : '—'}
                  </p>

                  <p>
                    <strong>Description:</strong>{' '}
                    {activity.description || '—'}
                  </p>

                  {activity.proof_url && (
                    <p>
                      <strong>Proof:</strong>{' '}
                      <a
                        href={activity.proof_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open proof
                      </a>
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      reviewActivity(activity.id, 'verified')
                    }
                    disabled={loading}
                  >
                    Verify
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      reviewActivity(activity.id, 'rejected')
                    }
                    disabled={loading}
                  >
                    Reject
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {isPo && (
        <section>
          <h2>Verified Activities Lookup</h2>

          <form onSubmit={loadPoActivities}>
            <label>Student BEC</label>

            <input
              type="text"
              value={poBec}
              onChange={(event) => setPoBec(event.target.value)}
              placeholder="Enter BEC"
            />

            <button type="submit" disabled={loading}>
              Search
            </button>
          </form>

          {poActivities.length === 0 ? (
            <p>No verified activities found.</p>
          ) : (
            <div>
              {poActivities.map((activity) => (
                <article key={activity.id}>
                  <h3>{activity.title}</h3>

                  <p>
                    <strong>Category:</strong> {activity.category}
                  </p>

                  <p>
                    <strong>Organizer:</strong>{' '}
                    {activity.organizer || '—'}
                  </p>

                  <p>
                    <strong>Date:</strong>{' '}
                    {activity.activity_date
                      ? new Date(
                          activity.activity_date
                        ).toLocaleDateString()
                      : '—'}
                  </p>

                  <p className={`status status-${activity.status}`}>
  <strong>Status:</strong> {activity.status}
</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default ActivityTracker;