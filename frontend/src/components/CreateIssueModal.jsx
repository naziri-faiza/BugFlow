import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { fetchProjects, fetchProjectById } from '../api/projects.js';
import { createIssue } from '../api/issues.js';

export default function CreateIssueModal({ isOpen, onClose, onIssueCreated, initialProjectId = null }) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('To Do');
  const [assigneeId, setAssigneeId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available projects when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;

    async function loadProjects() {
      setLoadingProjects(true);
      setError('');
      try {
        const data = await fetchProjects();
        if (isCurrent && data && data.success) {
          const list = data.projects || [];
          setProjects(list);
          if (initialProjectId) {
            setSelectedProjectId(String(initialProjectId));
          } else if (list.length > 0) {
            setSelectedProjectId(String(list[0].id));
          }
        }
      } catch (err) {
        if (isCurrent) {
          setError(err.response?.data?.message || 'Failed to load projects.');
        }
      } finally {
        if (isCurrent) setLoadingProjects(false);
      }
    }

    loadProjects();
    return () => {
      isCurrent = false;
    };
  }, [isOpen, initialProjectId]);

  // Fetch members when selected project changes
  useEffect(() => {
    let isCurrent = true;

    async function loadMembers() {
      if (!isOpen || !selectedProjectId) {
        return;
      }
      setLoadingMembers(true);
      try {
        const data = await fetchProjectById(selectedProjectId);
        if (isCurrent) {
          if (data && data.success && data.project?.members) {
            setMembers(data.project.members);
          } else {
            setMembers([]);
          }
        }
      } catch {
        if (isCurrent) setMembers([]);
      } finally {
        if (isCurrent) setLoadingMembers(false);
      }
    }

    loadMembers();
    return () => {
      isCurrent = false;
    };
  }, [isOpen, selectedProjectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanTitle = title.trim();
    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }
    if (!cleanTitle || cleanTitle.length < 2) {
      setError('Issue title must be at least 2 characters long.');
      return;
    }
    if (cleanTitle.length > 200) {
      setError('Issue title cannot exceed 200 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        projectId: parseInt(selectedProjectId, 10),
        title: cleanTitle,
        description: description.trim() || undefined,
        priority,
        status,
        assigneeId: assigneeId ? parseInt(assigneeId, 10) : undefined,
      };

      const result = await createIssue(payload);
      if (result && result.success) {
        // Reset form
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setStatus('To Do');
        setAssigneeId('');
        if (onIssueCreated) {
          onIssueCreated(result.issue);
        }
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to create issue. Please check fields and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-issue-title"
    >
      <div className="modal-card" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h2 id="create-issue-title">Create Issue</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Project Selection */}
            <div className="form-group">
              <label htmlFor="issue-project">
                Project <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              {loadingProjects ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Loader2 size={16} className="auth-spinner" /> Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>
                  No projects available. You must create or join a project first.
                </p>
              ) : (
                <select
                  id="issue-project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={submitting || Boolean(initialProjectId)}
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Title Input */}
            <div className="form-group">
              <label htmlFor="issue-title">
                Title <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="issue-title"
                type="text"
                placeholder="e.g. Session expires unexpectedly on refresh"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                disabled={submitting}
              />
            </div>

            {/* Status and Priority Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="issue-status">Status</label>
                <select
                  id="issue-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={submitting}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="issue-priority">Priority</label>
                <select
                  id="issue-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Assignee Selection */}
            <div className="form-group">
              <label htmlFor="issue-assignee">
                Assignee {loadingMembers && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(loading...)</span>}
              </label>
              <select
                id="issue-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={submitting || loadingMembers}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Description Textarea */}
            <div className="form-group">
              <label htmlFor="issue-desc">Description (Optional)</label>
              <textarea
                id="issue-desc"
                rows={3}
                placeholder="Provide steps to reproduce or expected behavior..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || projects.length === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {submitting && <Loader2 size={16} className="auth-spinner" />}
              {submitting ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
