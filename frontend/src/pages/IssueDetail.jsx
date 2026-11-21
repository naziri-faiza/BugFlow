import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, AlertCircle, Info, Send, Loader2, RefreshCw } from 'lucide-react';
import { fetchIssueById, updateIssue, fetchIssueComments, createIssueComment } from '../api/issues.js';
import '../components/Shared.css';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function IssueDetail() {
  const { id } = useParams();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  // Comments-specific loading and error states
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');

  const [updatingField, setUpdatingField] = useState(null); // 'status' | 'priority'
  const [submittingComment, setSubmittingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [toast, setToast] = useState('');

  const triggerToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsError('');
    try {
      const commentRes = await fetchIssueComments(id);
      if (commentRes && commentRes.success) {
        setComments(commentRes.comments || []);
      } else {
        setCommentsError('Could not load comments.');
      }
    } catch (err) {
      setCommentsError(
        err.response?.data?.message || 'Failed to retrieve comments from server.'
      );
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  const loadIssueData = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const issueRes = await fetchIssueById(id);
      if (issueRes && issueRes.success && issueRes.issue) {
        setIssue(issueRes.issue);
      } else {
        setError('Issue could not be loaded.');
      }

      await loadComments();
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err.response?.data?.message || 'Could not load issue from database.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, loadComments]);

  useEffect(() => {
    let ignore = false;

    async function init() {
      setLoading(true);
      setError('');
      setNotFound(false);
      try {
        const issueRes = await fetchIssueById(id);
        if (!ignore) {
          if (issueRes && issueRes.success && issueRes.issue) {
            setIssue(issueRes.issue);
          } else {
            setError('Issue could not be loaded.');
          }
        }

        try {
          const commentRes = await fetchIssueComments(id);
          if (!ignore) {
            if (commentRes && commentRes.success) {
              setComments(commentRes.comments || []);
            } else {
              setCommentsError('Could not load comments.');
            }
          }
        } catch (cErr) {
          if (!ignore) {
            setCommentsError(cErr.response?.data?.message || 'Failed to load comments.');
          }
        }
      } catch (err) {
        if (!ignore) {
          if (err.response?.status === 404) {
            setNotFound(true);
          } else {
            setError(
              err.response?.data?.message || 'Could not load issue from database.'
            );
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!issue || issue.status === newStatus || updatingField) return;
    setUpdatingField('status');

    try {
      const res = await updateIssue(issue.numericId || issue.id, { status: newStatus });
      if (res && res.success && res.issue) {
        setIssue((prev) => ({ ...prev, status: res.issue.status }));
        triggerToast(`Status saved: "${res.issue.status}"`);
      } else {
        throw new Error(res?.message || 'Update failed');
      }
    } catch (err) {
      triggerToast(`Failed to update status: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingField(null);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!issue || issue.priority === newPriority || updatingField) return;
    setUpdatingField('priority');

    try {
      const res = await updateIssue(issue.numericId || issue.id, { priority: newPriority });
      if (res && res.success && res.issue) {
        setIssue((prev) => ({ ...prev, priority: res.issue.priority }));
        triggerToast(`Priority saved: "${res.issue.priority}"`);
      } else {
        throw new Error(res?.message || 'Update failed');
      }
    } catch (err) {
      triggerToast(`Failed to update priority: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingField(null);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (submittingComment) return;

    const clean = newComment.trim();
    if (!clean || !issue) return;

    if (clean.length > 2000) {
      triggerToast('Comment cannot exceed 2000 characters.');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await createIssueComment(issue.numericId || issue.id, { content: clean });
      if (res && res.success && res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setNewComment('');
        triggerToast('Comment posted successfully.');
      } else {
        throw new Error(res?.message || 'Failed to add comment');
      }
    } catch (err) {
      triggerToast(`Failed to post comment: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Loader2 size={36} className="auth-spinner" />
          <p style={{ marginTop: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Loading issue details...
          </p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container">
        <div className="not-found card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
          <h2>Issue Not Found</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            We could not find an issue with ID &ldquo;{id}&rdquo; in the database.
          </p>
          <Link to="/issues" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={16} /> Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: 'var(--color-danger)', marginBottom: '0.75rem' }} />
          <h3>Error loading issue</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button type="button" className="btn-secondary" onClick={loadIssueData}>
              Try Again
            </button>
            <Link to="/issues" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={16} /> Back to Issues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/issues"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          <ArrowLeft size={14} /> Back to Issues
        </Link>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {issue.id}
            </span>
            <span className={`badge badge--${(issue.status || 'To Do').toLowerCase().replace(/\s+/g, '-')}`}>
              {issue.status}
            </span>
            <span className={`badge badge--${(issue.priority || 'Medium').toLowerCase()}`}>
              {issue.priority}
            </span>
          </div>
          <h1 style={{ margin: '0.2rem 0' }}>{issue.title}</h1>
          <p style={{ margin: 0 }}>
            Project:{' '}
            {issue.projectId ? (
              <Link to={`/projects/${issue.projectId}`} style={{ fontWeight: 600 }}>
                {issue.project || `Project #${issue.projectId}`}
              </Link>
            ) : (
              <span>{issue.project || 'General'}</span>
            )}
          </p>
        </div>
      </div>

      <div className="detail-grid">
        {/* Main Content */}
        <div>
          {/* Description */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card__header">
              <h2>Description</h2>
            </div>
            <div className="card__body">
              <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                {issue.description || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No description provided.</span>}
              </p>
            </div>
          </div>

          {/* Activity / Comments */}
          <div className="card">
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Activity &amp; Comments ({comments.length})</h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={loadComments}
                disabled={commentsLoading}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                title="Refresh comments"
              >
                <RefreshCw size={12} className={commentsLoading ? 'auth-spinner' : ''} />
              </button>
            </div>
            <div className="card__body">
              {/* Comments Error */}
              {commentsError && (
                <div className="alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={16} />
                  <span>{commentsError}</span>
                  <button
                    type="button"
                    onClick={loadComments}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Comments Loading */}
              {commentsLoading && comments.length === 0 ? (
                <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                  <Loader2 size={24} className="auth-spinner" />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    Loading comments...
                  </p>
                </div>
              ) : comments.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 0' }}>
                  <MessageSquare size={32} />
                  <p>No comments on this issue yet. Leave the first comment below.</p>
                </div>
              ) : (
                <div className="comment-list">
                  {comments.map((c) => (
                    <div className="comment" key={c.id}>
                      <span className="avatar">{c.author?.initials || 'U'}</span>
                      <div className="comment__body">
                        <div className="comment__meta">
                          <strong>{c.author?.name || 'User'}</strong>
                          <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Just now'}</span>
                        </div>
                        <p className="comment__text">{c.text || c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment form */}
              <form className="comment-form" onSubmit={handleAddComment}>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  aria-label="New comment"
                  disabled={submittingComment}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submittingComment ? <Loader2 size={14} className="auth-spinner" /> : <Send size={14} />}
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar info & editable fields */}
        <aside className="detail-sidebar-card">
          <div className="field">
            <div className="field-label">Status</div>
            <select
              className="inline-select"
              value={issue.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label="Change issue status"
              style={{ width: '100%' }}
              disabled={updatingField === 'status'}
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="field-label">Priority</div>
            <select
              className="inline-select"
              value={issue.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              aria-label="Change issue priority"
              style={{ width: '100%' }}
              disabled={updatingField === 'priority'}
            >
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="field-label">Assignee</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {issue.assignee ? (
                <>
                  <span className="avatar">{issue.assignee.initials || 'U'}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{issue.assignee.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {issue.assignee.email}
                    </div>
                  </div>
                </>
              ) : (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  Unassigned
                </span>
              )}
            </div>
          </div>

          <div className="field">
            <div className="field-label">Reporter</div>
            <div style={{ fontSize: '0.875rem' }}>
              {issue.reporter?.name || 'System'}
            </div>
          </div>

          <div className="field">
            <div className="field-label">Created Date</div>
            <div style={{ fontSize: '0.875rem' }}>
              {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="toast" role="status">
          <Info size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
