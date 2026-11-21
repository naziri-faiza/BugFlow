import { useState } from 'react';
import { User, Bell, Shield, Info, Save, LogOut } from 'lucide-react';
import { useAuth } from '../context/authContext.js';
import '../components/Shared.css';

function ProfileSection({ user, onSave }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'Developer');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, email, role });
  };

  return (
    <section className="settings-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <User size={18} color="var(--color-primary)" />
        <h2 style={{ margin: 0, padding: 0, border: 'none' }}>Profile Information</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="settings-form-group">
          <label htmlFor="settings-name">Full Name</label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="settings-form-group">
          <label htmlFor="settings-email">Email Address</label>
          <input
            id="settings-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="settings-form-group">
          <label htmlFor="settings-role">Role / Job Title</label>
          <input
            id="settings-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="submit">
            <Save size={15} /> Save Changes
          </button>
        </div>
      </form>
    </section>
  );
}

export default function Settings() {
  const { user, logout, updateUser } = useAuth();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [issueAssignedAlert, setIssueAssignedAlert] = useState(true);

  const [toast, setToast] = useState('');

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleProfileSave = (updatedData) => {
    updateUser(updatedData);
    triggerToast('Profile updated in current session. (Demo UI — backend profile update API not implemented yet)');
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    triggerToast('Notification preferences updated locally. (Demo UI only)');
  };

  return (
    <div className="container" style={{ maxWidth: 840 }}>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account settings, preferences, and notifications.</p>
        </div>
      </div>

      {/* Profile Section */}
      <ProfileSection key={user?.id || 'guest'} user={user} onSave={handleProfileSave} />

      {/* Account Session / Logout */}
      <section className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <LogOut size={18} color="var(--color-danger)" />
          <h2 style={{ margin: 0, padding: 0, border: 'none' }}>Account Session</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Signed in as {user?.email || 'Authenticated User'}
            </p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Role: <span className="badge badge--open">{user?.role || 'user'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              backgroundColor: 'var(--color-danger)',
              color: '#fff',
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Bell size={18} color="var(--color-primary)" />
          <h2 style={{ margin: 0, padding: 0, border: 'none' }}>Notification Preferences</h2>
        </div>

        <form onSubmit={handleSaveNotifications}>
          <div className="settings-row">
            <div>
              <label htmlFor="notif-email" style={{ fontWeight: 600 }}>Email Notifications</label>
              <p>Receive email updates on issue assignments and status changes.</p>
            </div>
            <label className="toggle">
              <input
                id="notif-email"
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div>
              <label htmlFor="notif-inapp" style={{ fontWeight: 600 }}>In-App Alert Popups</label>
              <p>Show notifications inside the application when changes happen.</p>
            </div>
            <label className="toggle">
              <input
                id="notif-inapp"
                type="checkbox"
                checked={inAppAlerts}
                onChange={(e) => setInAppAlerts(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div>
              <label htmlFor="notif-assigned" style={{ fontWeight: 600 }}>Direct Assignment Alerts</label>
              <p>Notify immediately when a bug or task is assigned to you.</p>
            </div>
            <label className="toggle">
              <input
                id="notif-assigned"
                type="checkbox"
                checked={issueAssignedAlert}
                onChange={(e) => setIssueAssignedAlert(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div>
              <label htmlFor="notif-digest" style={{ fontWeight: 600 }}>Weekly Digest</label>
              <p>Receive a summary of completed issues and team progress every Monday.</p>
            </div>
            <label className="toggle">
              <input
                id="notif-digest"
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button type="submit">
              <Save size={15} /> Save Preferences
            </button>
          </div>
        </form>
      </section>

      {/* Security notice */}
      <section className="settings-section" style={{ background: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
          <Shield size={18} color="var(--color-info)" />
          <h2 style={{ margin: 0, padding: 0, border: 'none', fontSize: '0.9375rem' }}>Security &amp; JWT Storage Note</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Authentication tokens are stored in browser localStorage (<code style={{ fontSize: '0.75rem' }}>bugflow_token</code>) for this development environment. For production applications, HttpOnly secure cookies are recommended to protect against cross-site scripting (XSS) risks.
        </p>
      </section>

      {toast && (
        <div className="toast" role="status">
          <Info size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
