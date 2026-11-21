import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Info, GripVertical, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchIssues, updateIssue } from '../api/issues.js';
import CreateIssueModal from '../components/CreateIssueModal.jsx';
import '../components/Shared.css';

const COLUMNS = [
  { key: 'To Do', label: 'To Do' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Done', label: 'Done' },
];

export default function Kanban() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [toast, setToast] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const triggerToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchIssues();
      if (data && data.success) {
        setIssues(data.issues || []);
      } else {
        setError('Failed to retrieve issues.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not connect to server to load issues.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchIssues();
        if (!ignore) {
          if (data && data.success) {
            setIssues(data.issues || []);
          } else {
            setError('Failed to retrieve issues.');
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message || 'Could not connect to server to load issues.'
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDragLeave = (colKey) => {
    if (dragOverCol === colKey) {
      setDragOverCol(null);
    }
  };

  const persistStatusChange = async (issueId, targetStatus) => {
    const targetIssue = issues.find((i) => i.id === issueId || i.numericId === issueId);
    if (!targetIssue) return;
    if (targetIssue.status === targetStatus) return;

    const previousStatus = targetIssue.status;
    const realId = targetIssue.id;

    // Optimistic update
    setIssues((prev) =>
      prev.map((item) =>
        item.id === realId ? { ...item, status: targetStatus } : item
      )
    );
    setUpdatingId(realId);

    try {
      const res = await updateIssue(targetIssue.numericId || realId, { status: targetStatus });
      if (res && res.success) {
        triggerToast(`Updated ${realId} to "${targetStatus}"`);
      } else {
        throw new Error(res?.message || 'Update failed');
      }
    } catch (err) {
      // Revert optimistic update
      setIssues((prev) =>
        prev.map((item) =>
          item.id === realId ? { ...item, status: previousStatus } : item
        )
      );
      triggerToast(`Failed to update ${realId}: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const rawData = e.dataTransfer.getData('text/plain') || draggedId;
    setDraggedId(null);
    if (!rawData) return;
    persistStatusChange(rawData, targetStatus);
  };

  const handleStatusChange = (id, newStatus) => {
    persistStatusChange(id, newStatus);
  };

  const handleIssueCreated = (newIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
    triggerToast(`Created issue ${newIssue.id}`);
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Kanban Board</h1>
          <p>Track issues across workflow stages in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={loadIssues}
            disabled={loading}
            title="Refresh issues"
          >
            <RefreshCw size={15} className={loading ? 'auth-spinner' : ''} />
          </button>
          <button type="button" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Issue
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={36} className="auth-spinner" />
          <p style={{ marginTop: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Loading board issues...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: 'var(--color-danger)', marginBottom: '0.75rem' }} />
          <h3>Unable to load Kanban board</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>{error}</p>
          <button type="button" className="btn-secondary" onClick={loadIssues}>
            Try Again
          </button>
        </div>
      )}

      {/* Kanban Board Columns */}
      {!loading && !error && (
        <div className="kanban">
          {COLUMNS.map((col) => {
            const colIssues = issues.filter((i) => i.status === col.key);
            const isOver = dragOverCol === col.key;

            return (
              <div className="kanban-column" key={col.key}>
                <div className="kanban-column__header">
                  <span>{col.label}</span>
                  <span className="kanban-column__count">{colIssues.length}</span>
                </div>

                <div
                  className={`kanban-column__body ${isOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={() => handleDragLeave(col.key)}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {colIssues.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                      <p>No issues in {col.label}</p>
                    </div>
                  ) : (
                    colIssues.map((issue) => {
                      const isUpdating = updatingId === issue.id;
                      return (
                        <div
                          key={issue.id}
                          className={`kanban-card ${draggedId === issue.id ? 'dragging' : ''}`}
                          style={{ opacity: isUpdating ? 0.6 : 1 }}
                          draggable={!isUpdating}
                          onDragStart={(e) => handleDragStart(e, issue.id)}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <span
                              className="kanban-card__id"
                              onClick={() => navigate(`/issues/${issue.id}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              {issue.id}
                            </span>
                            <GripVertical size={14} color="var(--color-text-secondary)" />
                          </div>

                          <div
                            className="kanban-card__title"
                            onClick={() => navigate(`/issues/${issue.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            {issue.title}
                          </div>

                          {issue.project && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)',
                                marginBottom: '0.4rem',
                              }}
                            >
                              {issue.project}
                            </div>
                          )}

                          <div className="kanban-card__footer">
                            <span className={`badge badge--${(issue.priority || 'Medium').toLowerCase()}`}>
                              {issue.priority}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {/* Quick status selector */}
                              <select
                                className="inline-select"
                                value={issue.status}
                                onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                aria-label={`Change status for ${issue.id}`}
                                onClick={(e) => e.stopPropagation()}
                                disabled={isUpdating}
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>

                              {issue.assignee ? (
                                <span className="avatar" title={issue.assignee.name}>
                                  {issue.assignee.initials || 'U'}
                                </span>
                              ) : (
                                <span
                                  className="avatar"
                                  style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                                  title="Unassigned"
                                >
                                  -
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Info size={16} />
          {toast}
        </div>
      )}

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onIssueCreated={handleIssueCreated}
      />
    </div>
  );
}
