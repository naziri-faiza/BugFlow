import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ListTodo, Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchIssues } from '../api/issues.js';
import { useAuth } from '../context/authContext.js';
import CreateIssueModal from '../components/CreateIssueModal.jsx';
import '../components/Shared.css';

export default function MyIssues() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scope, setScope] = useState('assigned'); // 'assigned' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-desc');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setError(err.response?.data?.message || 'Could not connect to server.');
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
          setError(err.response?.data?.message || 'Could not connect to server.');
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

  const currentUserId = user?.id;

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        // Scope filter: assigned to me vs all
        if (scope === 'assigned' && currentUserId) {
          if (issue.assignee?.id !== currentUserId) {
            return false;
          }
        }

        const matchesSearch =
          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'ALL'
            ? true
            : statusFilter === 'Open'
            ? issue.status === 'To Do' || issue.status === 'Open'
            : issue.status === statusFilter;

        const matchesPriority =
          priorityFilter === 'ALL' ? true : issue.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'id-desc') return (b.numericId || 0) - (a.numericId || 0);
        if (sortBy === 'id-asc') return (a.numericId || 0) - (b.numericId || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'priority') {
          const weights = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (weights[b.priority] || 0) - (weights[a.priority] || 0);
        }
        return 0;
      });
  }, [issues, scope, currentUserId, searchTerm, statusFilter, priorityFilter, sortBy]);

  const handleIssueCreated = (newIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>My Issues</h1>
          <p>Filter, search, and manage issues assigned to you or your team.</p>
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

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Scope selector */}
        <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setScope('assigned')}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8125rem',
              background: scope === 'assigned' ? 'var(--color-primary)' : 'transparent',
              color: scope === 'assigned' ? '#fff' : 'var(--color-text)',
              border: 'none',
              borderRadius: 0,
            }}
          >
            Assigned to Me
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8125rem',
              background: scope === 'all' ? 'var(--color-primary)' : 'transparent',
              color: scope === 'all' ? '#fff' : 'var(--color-text)',
              border: 'none',
              borderRadius: 0,
            }}
          >
            All Issues ({issues.length})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: '180px' }}>
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
            placeholder="Search by ID or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '1.8rem', width: '100%' }}
            aria-label="Search issues"
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Filter size={14} color="var(--color-text-secondary)" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="ALL">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort issues by"
        >
          <option value="id-desc">Sort: ID (Newest first)</option>
          <option value="id-asc">Sort: ID (Oldest first)</option>
          <option value="title">Sort: Title (A-Z)</option>
          <option value="priority">Sort: Highest Priority</option>
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={36} className="auth-spinner" />
          <p style={{ marginTop: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Loading issues from database...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: 'var(--color-danger)', marginBottom: '0.75rem' }} />
          <h3>Unable to load issues</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>{error}</p>
          <button type="button" className="btn-secondary" onClick={loadIssues}>
            Try Again
          </button>
        </div>
      )}

      {/* Issues Table */}
      {!loading && !error && (
        <div className="card">
          <div className="card__header">
            <h2>Issues List</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Showing {filteredIssues.length} of {issues.length} total
            </span>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
              <ListTodo size={40} />
              <h3>No matching issues found</h3>
              <p style={{ marginBottom: '1.25rem' }}>
                {scope === 'assigned'
                  ? "You don't have any issues assigned to you yet."
                  : 'Try clearing or modifying your search and filter criteria.'}
              </p>
              {scope === 'assigned' && issues.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setScope('all')}
                >
                  View All Team Issues
                </button>
              )}
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      onClick={() => navigate(`/issues/${issue.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="issue-id">{issue.id}</td>
                      <td>{issue.title}</td>
                      <td>{issue.project || '—'}</td>
                      <td>
                        <span className={`badge badge--${(issue.priority || 'Medium').toLowerCase()}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge badge--${(issue.status || 'To Do').toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {issue.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {issue.assignee ? (
                            <>
                              <span className="avatar" style={{ width: 22, height: 22, fontSize: '0.6rem' }}>
                                {issue.assignee.initials || 'U'}
                              </span>
                              <span>{issue.assignee.name}</span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                              Unassigned
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
