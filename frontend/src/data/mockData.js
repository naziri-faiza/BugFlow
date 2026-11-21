/**
 * BugFlow — Unified mock data for UI development.
 * All values here are sample data for building the interface.
 * None of this data comes from or is saved to PostgreSQL.
 */

export const STATUSES = ['Open', 'In Progress', 'Done'];
export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export const mockStats = [
  { id: 'total',      label: 'Total Issues',    value: 128, icon: 'ClipboardList', color: 'var(--color-primary)'  },
  { id: 'open',       label: 'Open Issues',     value: 42,  icon: 'CircleDot',     color: 'var(--color-info)'     },
  { id: 'inprogress', label: 'In Progress',     value: 31,  icon: 'Timer',         color: 'var(--color-warning)'  },
  { id: 'resolved',   label: 'Resolved Issues', value: 55,  icon: 'CheckCircle2',  color: 'var(--color-success)'  },
];

export const mockUsers = [
  { id: 1, name: 'Alice Martin',  initials: 'AM', email: 'alice@bugflow.dev' },
  { id: 2, name: 'Bob Kim',       initials: 'BK', email: 'bob@bugflow.dev' },
  { id: 3, name: 'Carol Singh',   initials: 'CS', email: 'carol@bugflow.dev' },
  { id: 4, name: 'Dan Torres',    initials: 'DT', email: 'dan@bugflow.dev' },
  { id: 5, name: 'Eve Reyes',     initials: 'ER', email: 'eve@bugflow.dev' },
];

export const mockProjects = [
  { id: 1, name: 'Auth Service',   key: 'AUTH', description: 'Authentication and authorization microservice.', status: 'Active',   issueCount: 24, progress: 62, lead: mockUsers[0] },
  { id: 2, name: 'Frontend',       key: 'FE',   description: 'React-based web application for BugFlow.',       status: 'Active',   issueCount: 51, progress: 45, lead: mockUsers[1] },
  { id: 3, name: 'Notifications',  key: 'NOTIF',description: 'Email and in-app notification delivery system.', status: 'Active',   issueCount: 18, progress: 78, lead: mockUsers[2] },
  { id: 4, name: 'User Service',   key: 'USER', description: 'User profile and account management.',           status: 'Active',   issueCount: 12, progress: 33, lead: mockUsers[3] },
  { id: 5, name: 'Reports',        key: 'RPT',  description: 'Reporting and analytics dashboard.',              status: 'Archived', issueCount: 9,  progress: 90, lead: mockUsers[4] },
];

export const mockIssues = [
  { id: 'BUG-127', title: 'Login session expires too quickly',          projectId: 1, project: 'Auth Service',  priority: 'High',     status: 'Open',        assignee: mockUsers[0], description: 'Users report being logged out after only 5 minutes of inactivity. The session timeout should be at least 30 minutes.', createdAt: '2026-11-10' },
  { id: 'BUG-126', title: 'OAuth callback fails on mobile browsers',   projectId: 1, project: 'Auth Service',  priority: 'Critical', status: 'Open',        assignee: mockUsers[2], description: 'The OAuth redirect URI does not resolve correctly on Chrome mobile. Users see a blank page after Google sign-in.', createdAt: '2026-11-09' },
  { id: 'BUG-124', title: 'Dashboard charts fail to render on Safari',  projectId: 2, project: 'Frontend',      priority: 'Medium',   status: 'In Progress', assignee: mockUsers[1], description: 'Chart.js canvas elements produce a blank white area in Safari 17. Works fine in Chrome and Firefox.', createdAt: '2026-11-08' },
  { id: 'BUG-122', title: 'Sidebar flickers on route change',          projectId: 2, project: 'Frontend',      priority: 'Low',      status: 'In Progress', assignee: mockUsers[1], description: 'The sidebar briefly collapses and re-expands on every navigation event. Likely a re-render issue.', createdAt: '2026-11-07' },
  { id: 'BUG-119', title: 'Email notifications sent twice',             projectId: 3, project: 'Notifications', priority: 'Critical', status: 'Open',        assignee: mockUsers[2], description: 'When an issue status changes, the assigned user receives two identical emails instead of one.', createdAt: '2026-11-06' },
  { id: 'BUG-117', title: 'Push notifications not received on iOS',    projectId: 3, project: 'Notifications', priority: 'High',     status: 'In Progress', assignee: mockUsers[4], description: 'iOS users on version 17+ are not receiving push notifications. Android and web push work fine.', createdAt: '2026-11-05' },
  { id: 'BUG-115', title: 'Profile avatar upload returns 500',          projectId: 4, project: 'User Service',  priority: 'High',     status: 'In Progress', assignee: mockUsers[3], description: 'Uploading a JPEG avatar larger than 2 MB results in a server 500 error. PNG files work at any size.', createdAt: '2026-11-04' },
  { id: 'BUG-113', title: 'User deletion does not cascade to comments', projectId: 4, project: 'User Service',  priority: 'Medium',   status: 'Open',        assignee: mockUsers[3], description: 'When a user account is deleted, their comments remain with a broken foreign key.', createdAt: '2026-11-03' },
  { id: 'BUG-110', title: 'Search results not paginated',               projectId: 2, project: 'Frontend',      priority: 'Low',      status: 'Done',        assignee: mockUsers[4], description: 'The search endpoint returns all matching results in a single response. Needs limit/offset.', createdAt: '2026-11-01' },
  { id: 'BUG-108', title: 'Incorrect timezone on exported reports',     projectId: 5, project: 'Reports',       priority: 'Medium',   status: 'Done',        assignee: mockUsers[0], description: 'PDF exports display timestamps in UTC instead of the user\'s configured timezone.', createdAt: '2026-10-30' },
  { id: 'BUG-105', title: 'CSV export truncates long descriptions',    projectId: 5, project: 'Reports',       priority: 'Low',      status: 'Done',        assignee: mockUsers[4], description: 'Issue descriptions longer than 255 characters are cut off in the CSV export.', createdAt: '2026-10-28' },
  { id: 'BUG-102', title: 'Rate limiter blocks legitimate requests',   projectId: 1, project: 'Auth Service',  priority: 'High',     status: 'Done',        assignee: mockUsers[0], description: 'The rate limiter on /api/auth/login triggers after only 3 attempts per minute, which is too aggressive.', createdAt: '2026-10-25' },
];

export const mockComments = [
  { id: 1, issueId: 'BUG-127', author: mockUsers[1], text: 'I can reproduce this — session cookie maxAge is set to 300s instead of 1800s.', createdAt: '2026-11-11 09:15' },
  { id: 2, issueId: 'BUG-127', author: mockUsers[0], text: 'Good catch. I\'ll update the config and redeploy.', createdAt: '2026-11-11 10:02' },
  { id: 3, issueId: 'BUG-124', author: mockUsers[1], text: 'Appears to be a WebGL context issue in Safari. Looking into fallback rendering.', createdAt: '2026-11-09 14:30' },
];

/** Helper: find an issue by its string ID */
export function findIssue(id) {
  return mockIssues.find((i) => i.id === id) || null;
}

/** Helper: find a project by its numeric ID */
export function findProject(id) {
  return mockProjects.find((p) => p.id === Number(id)) || null;
}

/** Helper: get issues for a project */
export function getProjectIssues(projectId) {
  return mockIssues.filter((i) => i.projectId === Number(projectId));
}

/** Helper: get comments for an issue */
export function getIssueComments(issueId) {
  return mockComments.filter((c) => c.issueId === issueId);
}
