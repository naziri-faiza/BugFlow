import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/authContext.js';
import './TopBar.css';

const pageTitles = {
  '/': 'Dashboard',
  '/kanban': 'Kanban Board',
  '/projects': 'Projects',
  '/issues': 'My Issues',
  '/settings': 'Settings',
};

function getPageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/projects/')) return 'Project Details';
  if (pathname.startsWith('/issues/')) return 'Issue Details';
  return 'BugFlow';
}

export default function TopBar({ sidebarCollapsed, onMobileMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const title = getPageTitle(location.pathname);

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <header className={`topbar ${sidebarCollapsed ? 'topbar--sidebar-collapsed' : ''}`}>
      {/* Mobile menu button */}
      <button
        type="button"
        className="topbar__mobile-menu"
        onClick={onMobileMenuToggle}
        aria-label="Toggle navigation menu"
      >
        <Menu size={20} />
      </button>

      <h1 className="topbar__title">{title}</h1>

      <div className="topbar__actions">
        {/* Search */}
        <div className="topbar__search">
          <Search size={16} className="topbar__search-icon" />
          <input
            type="text"
            placeholder="Search issues..."
            className="topbar__search-input"
            aria-label="Search issues"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate('/issues');
              }
            }}
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="topbar__icon-btn"
          aria-label="Notifications"
          onClick={() => navigate('/settings')}
        >
          <Bell size={20} />
        </button>

        {/* User avatar */}
        <button
          type="button"
          className="topbar__avatar"
          aria-label="User profile settings"
          onClick={() => navigate('/settings')}
          title={user?.name ? `${user.name} (${user.email})` : 'Profile Settings'}
          style={{ fontSize: '0.8125rem', fontWeight: 600 }}
        >
          {user ? userInitial : <User size={18} />}
        </button>
      </div>
    </header>
  );
}
