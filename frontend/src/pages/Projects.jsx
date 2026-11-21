import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Info, Loader2, AlertCircle, X } from 'lucide-react';
import { fetchProjects, createProject } from '../api/projects.js';
import '../components/Shared.css';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState('');

  // Create Project Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProjects();
      if (data && data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      } else {
        setError('Unexpected server response format.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Make sure the API is running on port 5000.'
          : 'Failed to load projects.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await fetchProjects();
        if (!ignore) {
          if (data && data.success && Array.isArray(data.projects)) {
            setProjects(data.projects);
          } else {
            setError('Unexpected server response format.');
          }
        }
      } catch (err) {
        if (!ignore) {
          const msg =
            err.response?.data?.message ||
            (err.code === 'ERR_NETWORK'
              ? 'Cannot connect to backend server. Make sure the API is running on port 5000.'
              : 'Failed to load projects.');
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const trimmedName = newProjectName.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      setModalError('Project name must be between 2 and 100 characters.');
      return;
    }

    if (newProjectDesc.length > 1000) {
      setModalError('Description cannot exceed 1000 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createProject({
        name: trimmedName,
        description: newProjectDesc.trim() || undefined,
      });

      if (res && res.success && res.project) {
        setIsModalOpen(false);
        setNewProjectName('');
        setNewProjectDesc('');
        triggerToast(`Project "${res.project.name}" created successfully!`);
        // Refresh project list
        loadProjects();
      } else {
        setModalError(res?.message || 'Failed to create project.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Network error. Could not connect to backend server.'
          : 'Unable to create project. Please try again.');
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>View and manage all projects you have access to.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} aria-label="Create a new project">
          <Plus size={16} /> Create Project
        </button>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '0.6rem',
              color: 'var(--color-text-secondary)',
            }}
          />
          <input
            type="search"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '1.8rem' }}
            aria-label="Search projects"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <Loader2 size={36} className="auth-spinner" />
            <p style={{ marginTop: '0.75rem' }}>Loading projects from database...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="card">
          <div className="empty-state">
            <AlertCircle size={40} style={{ color: 'var(--color-danger)' }} />
            <h3>Unable to load projects</h3>
            <p style={{ marginBottom: '1rem' }}>{error}</p>
            <button type="button" className="btn-secondary" onClick={loadProjects}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Empty State — No projects exist yet */}
      {!loading && !error && projects.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <FolderKanban size={40} />
            <h3>No projects yet</h3>
            <p style={{ marginBottom: '1.25rem' }}>
              You don&apos;t have any projects. Create your first project to start tracking issues.
            </p>
            <button type="button" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Create Project
            </button>
          </div>
        </div>
      )}

      {/* Empty State — Search filter yields no results */}
      {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <FolderKanban size={40} />
            <h3>No matching projects</h3>
            <p>Try refining your search term or clear the filter.</p>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && filteredProjects.length > 0 && (
        <div className="project-grid">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="project-card"
              onClick={() => navigate(`/projects/${p.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/projects/${p.id}`);
                }
              }}
            >
              <div className="project-card__top">
                <span className="project-card__name">{p.name}</span>
                <span className={`badge badge--${(p.status || 'Active').toLowerCase()}`}>
                  {p.status || 'Active'}
                </span>
              </div>

              <div className="project-card__desc">
                {p.description || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No description provided</span>}
              </div>

              <div className="project-card__meta">
                <span>{p.issueCount || 0} issues</span>
                <span>{p.progress || 0}% completed</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${p.progress || 0}%` }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span>Lead: {p.lead?.name || 'Owner'}</span>
                <span className="avatar" style={{ width: 22, height: 22, fontSize: '0.6rem' }}>
                  {p.lead?.initials || 'U'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div className="alert-error" role="alert">
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="settings-form-group">
                  <label htmlFor="modal-project-name">
                    Project Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    id="modal-project-name"
                    type="text"
                    placeholder="e.g. Payment Gateway"
                    value={newProjectName}
                    onChange={(e) => {
                      setNewProjectName(e.target.value);
                      setModalError('');
                    }}
                    required
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>

                <div className="settings-form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="modal-project-desc">Description (Optional)</label>
                  <textarea
                    id="modal-project-desc"
                    rows={4}
                    placeholder="Briefly describe what this project tracks..."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="auth-spinner" /> Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Info size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
