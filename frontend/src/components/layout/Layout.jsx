import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import './Layout.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleToggleSidebar() {
    setCollapsed((prev) => !prev);
  }

  function handleMobileMenuToggle() {
    setMobileOpen((prev) => !prev);
  }

  function handleOverlayClick() {
    setMobileOpen(false);
  }

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <TopBar
        sidebarCollapsed={collapsed}
        onMobileMenuToggle={handleMobileMenuToggle}
      />

      <main
        className={`layout__main ${collapsed ? 'layout__main--sidebar-collapsed' : ''}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
