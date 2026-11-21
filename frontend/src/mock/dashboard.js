/**
 * Dashboard mock data.
 * These are sample values for UI development only — not from the database.
 */

export const stats = [
  { id: 'total',      label: 'Total Issues',    value: 128, icon: 'ClipboardList', color: 'var(--color-primary)'  },
  { id: 'open',       label: 'Open Issues',     value: 42,  icon: 'CircleDot',     color: 'var(--color-info)'     },
  { id: 'inprogress', label: 'In Progress',     value: 31,  icon: 'Timer',         color: 'var(--color-warning)'  },
  { id: 'resolved',   label: 'Resolved Issues', value: 55,  icon: 'CheckCircle2',  color: 'var(--color-success)'  },
];

export const recentIssues = [
  { id: 'BUG-127', title: 'Login session expires too quickly',        project: 'Auth Service',   priority: 'High',     status: 'Open',        assignee: 'Alice M.' },
  { id: 'BUG-124', title: 'Dashboard charts fail to render on Safari', project: 'Frontend',       priority: 'Medium',   status: 'In Progress', assignee: 'Bob K.'   },
  { id: 'BUG-119', title: 'Email notifications sent twice',           project: 'Notifications',  priority: 'Critical', status: 'Open',        assignee: 'Carol S.' },
  { id: 'BUG-115', title: 'Profile avatar upload returns 500',        project: 'User Service',   priority: 'High',     status: 'In Progress', assignee: 'Dan T.'   },
  { id: 'BUG-110', title: 'Search results not paginated',             project: 'Frontend',       priority: 'Low',      status: 'Resolved',    assignee: 'Eve R.'   },
  { id: 'BUG-108', title: 'Incorrect timezone on exported reports',   project: 'Reports',        priority: 'Medium',   status: 'Resolved',    assignee: 'Alice M.' },
];

export const projects = [
  { id: 1, name: 'Auth Service',  description: 'Authentication and authorization microservice.',  issueCount: 24, progress: 62 },
  { id: 2, name: 'Frontend',      description: 'React-based web application for BugFlow.',        issueCount: 51, progress: 45 },
  { id: 3, name: 'Notifications', description: 'Email and in-app notification delivery system.',   issueCount: 18, progress: 78 },
];
