import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Users,
  Plus,
} from 'lucide-react';
import { fetchProjectById } from '../api/projects.js';
import CreateIssueModal from '../components/CreateIssueModal.jsx';
import '../components/Shared.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reloadProject = async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const data = await fetchProjectById(id);
      if (data && data.success && data.project) {
        setProject(data.project);
      } else {
        setError('Project details could not be loaded.');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else if (err.response?.status === 403) {
        setError('Access denied: You are not authorized to view this project.');
      } else {
        const msg =
          err.response?.data?.message ||
          (err.code === 'ERR_NETWORK'
            ? 'Cannot connect to backend server. Make sure API is running.'
            : 'Failed to retrieve project details.');
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await fetchProjectById(id);
        if (!ignore) {
          if (data && data.success && data.project) {
            setProject(data.project);
          } else {
            setError('Project details could not be loaded.');
          }
        }
      } catch (err) {
        if (!ignore) {
          if (err.response?.status === 404) {
            setNotFound(true);
          } else if (err.response?.status === 403) {
            setError('Access denied: You are not authorized to view this project.');
          } else {
            const msg =
              err.response?.data?.message ||
              (err.code === 'ERR_NETWORK'
                ? 'Cannot connect to backend server. Make sure API is running.'
                : 'Failed to retrieve project details.');
            setError(msg);
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="empty-state">
            <Loader2 size={36} className="auth-spinner" />
            <p style={{ marginTop: '0.75rem' }}>Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State (404)
  if (notFound) {
    return (
      <div className="container">
        <div className="not-found card" style={{ padding: '3rem' }}>
          <FolderKanban size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }} />
          <h2>Project Not Found</h2>
          <p>We couldn&apos;t find a project with ID #{id}. It may have been deleted or the ID is invalid.</p>
          <Link to="/projects" className="btn-secondary" style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // Generic Error State
  if (error || !project) {
    return (
      <div className="container">
        <div className="not-found card" style={{ padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
          <h2>Unable to Load Project</h2>
          <p>{error || 'An unexpected error occurred.'}</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={reloadProject}>
              Retry
            </button>
            <Link to="/projects">
              <button type="button">
                <ArrowLeft size={16} /> Back to Projects
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const issues = project.issues || [];
  const members = project.members || [];
  const openCount = issues.filter((i) => i.status === 'Open' || i.status === 'To Do').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const doneCount = issues.filter((i) => i.status === 'Done' || i.status === 'Resolved').length;

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/projects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          <ArrowLeft size={14} /> Back to Projects
        </Link>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ margin: 0 }}>{project.name}</h1>
            <span className={`badge badge--${(project.status || 'Active').toLowerCase()}`}>
              {project.status || 'Active'}
            </span>
          </div>
          <p>{project.description || <span style={{ fontStyle: 'italic' }}>No description provided</span>}</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Create Issue
        </button>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'issues' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Issues ({issues.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'members' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members ({members.length})
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="detail-grid">
          <div>
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div className="card__header">
                <h2>Project Statistics</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Live metrics
                </span>
              </div>
              <div className="card__body">
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                    <span>Progress</span>
                    <strong>{project.progress || 0}%</strong>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${project.progress || 0}%` }} />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    textAlign: 'center',
                    marginTop: '1.5rem',
                  }}
                >
                  <div style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                    <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{openCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>To Do</div>
                  </div>

                  <div style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                    <div style={{ color: 'var(--color-warning)', display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                      <Clock size={18} />
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{inProgressCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>In Progress</div>
                  </div>

                  <div style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                    <div style={{ color: 'var(--color-success)', display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{doneCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Done</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">
                <h2>Recent Project Issues</h2>
                {issues.length > 0 && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setActiveTab('issues')}
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.slice(0, 4).map((i) => (
                      <tr key={i.id} onClick={() => navigate(`/issues/${i.numericId || i.id}`)} style={{ cursor: 'pointer' }}>
                        <td className="issue-id">{i.id}</td>
                        <td>{i.title}</td>
                        <td>
                          <span className={`badge badge--${(i.priority || 'Medium').toLowerCase()}`}>
                            {i.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge--${(i.status || 'To Do').toLowerCase().replace(/\s+/g, '-')}`}>
                            {i.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {issues.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-secondary)' }}>
                          No issues have been created in this project yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="detail-sidebar-card">
            <div className="field">
              <div className="field-label">Project Key</div>
              <div><strong>{project.key || `PRJ-${project.id}`}</strong></div>
            </div>
            <div className="field">
              <div className="field-label">Project Lead</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="avatar">{project.lead?.initials || 'U'}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{project.lead?.name || 'Owner'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {project.lead?.email || ''}
                  </div>
                </div>
              </div>
            </div>
            <div className="field">
              <div className="field-label">Total Issues</div>
              <div>{project.issueCount || 0}</div>
            </div>
            <div className="field">
              <div className="field-label">Your Role</div>
              <div>
                <span className="badge badge--open" style={{ textTransform: 'capitalize' }}>
                  {project.userRole || 'Member'}
                </span>
              </div>
            </div>
            <div className="field">
              <div className="field-label">Created Date</div>
              <div>
                {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recently'}
              </div>
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="card">
          <div className="card__header">
            <h2>All Issues for {project.name}</h2>
            <span>{issues.length} issues</span>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id} onClick={() => navigate(`/issues/${i.numericId || i.id}`)} style={{ cursor: 'pointer' }}>
                    <td className="issue-id">{i.id}</td>
                    <td>{i.title}</td>
                    <td>
                      <span className={`badge badge--${(i.priority || 'Medium').toLowerCase()}`}>
                        {i.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge--${(i.status || 'To Do').toLowerCase().replace(/\s+/g, '-')}`}>
                        {i.status}
                      </span>
                    </td>
                    <td>{i.assignee?.name || <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Unassigned</span>}</td>
                  </tr>
                ))}
                {issues.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                        No issues created for this project yet. Click &quot;Create Issue&quot; above to add one.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card">
          <div className="card__header">
            <h2>Project Members</h2>
            <span>{members.length} members</span>
          </div>
          <div className="card__body">
            {members.length === 0 ? (
              <div className="empty-state">
                <Users size={32} />
                <p>No member records found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {members.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <span className="avatar">{m.initials}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{m.email}</div>
                      <span className="badge badge--open" style={{ marginTop: '0.25rem', fontSize: '0.625rem' }}>
                        {m.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onIssueCreated={reloadProject}
        initialProjectId={project.id}
      />
    </div>
  );
}
