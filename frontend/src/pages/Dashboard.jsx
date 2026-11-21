import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ClipboardList,
  CircleDot,
  Timer,
  CheckCircle2,
  FolderKanban,
  ListTodo,
} from 'lucide-react';
import { fetchIssues } from '../api/issues.js';
import { fetchProjects } from '../api/projects.js';
import CreateIssueModal from '../components/CreateIssueModal.jsx';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      try {
        const [issuesRes, projectsRes] = await Promise.allSettled([
          fetchIssues(),
          fetchProjects(),
        ]);

        if (!ignore) {
          if (issuesRes.status === 'fulfilled' && issuesRes.value?.success) {
            setIssues(issuesRes.value.issues || []);
          }
          if (projectsRes.status === 'fulfilled' && projectsRes.value?.success) {
            setProjects(projectsRes.value.projects || []);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    }

    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, []);

  const totalCount = issues.length;
  const openCount = issues.filter((i) => i.status === 'To Do' || i.status === 'Open').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'Done').length;

  const stats = [
    {
      id: 'total',
      label: 'Total Issues',
      value: totalCount,
      Icon: ClipboardList,
      color: 'var(--color-primary)',
    },
    {
      id: 'open',
      label: 'Open Issues',
      value: openCount,
      Icon: CircleDot,
      color: 'var(--color-info)',
    },
    {
      id: 'inprogress',
      label: 'In Progress',
      value: inProgressCount,
      Icon: Timer,
      color: 'var(--color-warning)',
    },
    {
      id: 'resolved',
      label: 'Resolved Issues',
      value: resolvedCount,
      Icon: CheckCircle2,
      color: 'var(--color-success)',
    },
  ];

  const handleIssueCreated = (newIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
  };

  return (
    <div className="dashboard">
      {/* ---- Welcome ---- */}
      <section className="dash-welcome">
        <div className="dash-welcome__text">
          <h1>Good morning, welcome to BugFlow</h1>
          <p>Here&apos;s an overview of your team&apos;s work.</p>
        </div>
        <div className="dash-welcome__action">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Create a new issue"
          >
            <Plus size={16} /> Create Issue
          </button>
        </div>
      </section>

      {/* ---- Statistics ---- */}
      <section className="dash-stats" aria-label="Issue statistics">
        {stats.map((s) => {
          const { Icon } = s;
          return (
            <div className="stat-card" key={s.id}>
              <div
                className="stat-card__icon"
                style={{ background: s.color + '18', color: s.color }}
              >
                <Icon size={22} />
              </div>
              <div className="stat-card__info">
                <span className="stat-card__value">{s.value}</span>
                <span className="stat-card__label">{s.label}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ---- Body: table + projects ---- */}
      <section className="dash-body">
        {/* Recent Issues */}
        <div className="dash-card">
          <div className="dash-card__header">
            <h2>Recent Issues</h2>
            <span
              style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
              onClick={() => navigate('/issues')}
            >
              View all
            </span>
          </div>

          {issues.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              <ListTodo size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
              <p style={{ margin: 0 }}>No issues found in your workspace.</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsModalOpen(true)}
                style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}
              >
                <Plus size={14} /> Create Issue
              </button>
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
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
                  {issues.slice(0, 6).map((issue) => (
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
                        {issue.assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="avatar" style={{ width: 20, height: 20, fontSize: '0.55rem' }}>
                              {issue.assignee.initials || 'U'}
                            </span>
                            <span>{issue.assignee.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Project overview */}
        <div className="dash-card">
          <div className="dash-card__header">
            <h2>Projects</h2>
            <span
              style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
              onClick={() => navigate('/projects')}
            >
              View all
            </span>
          </div>

          {projects.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              <FolderKanban size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
              <p style={{ margin: 0 }}>No projects found.</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/projects')}
                style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}
              >
                Go to Projects
              </button>
            </div>
          ) : (
            <div className="project-list">
              {projects.slice(0, 3).map((p) => (
                <div
                  className="project-item"
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="project-item__name">{p.name}</div>
                  <div className="project-item__desc">
                    {p.description || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No description</span>}
                  </div>
                  <div className="project-item__meta">
                    <span>{p.issueCount || 0} issues</span>
                    <span>{p.progress || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar__fill"
                      style={{ width: `${p.progress || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onIssueCreated={handleIssueCreated}
      />
    </div>
  );
}
