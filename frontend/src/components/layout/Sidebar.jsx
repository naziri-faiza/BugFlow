import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Columns3,
  FolderKanban,
  ListTodo,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bug,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/authContext.js';
import './Sidebar.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/kanban', label: 'Kanban Board', icon: Columns3 },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/issues', label: 'My Issues', icon: ListTodo },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();

  const classes = [
    'sidebar',
    collapsed ? 'sidebar--collapsed' : '',
    mobileOpen ? 'sidebar--mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={classes} aria-label="Main navigation">
      {/* Brand */}
      <Link
        to="/"
        className="sidebar__brand"
        onClick={() => onCloseMobile && onCloseMobile()}
        style={{ textDecoration: 'none' }}
      >
        <Bug size={24} className="sidebar__logo-icon" />
        {!collapsed && <span className="sidebar__brand-text">BugFlow</span>}
      </Link>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={collapsed ? label : undefined}
            aria-label={label}
            onClick={() => onCloseMobile && onCloseMobile()}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="sidebar__user">
          <Link
            to="/settings"
            className="sidebar__user-link"
            title={`${user.name} (${user.email})`}
            onClick={() => onCloseMobile && onCloseMobile()}
          >
            <div className="avatar" style={{ width: 26, height: 26, fontSize: '0.7rem' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user.name}</span>
                <span className="sidebar__user-role">{user.role || 'Member'}</span>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              className="sidebar__logout-btn"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        type="button"
        className="sidebar__toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
