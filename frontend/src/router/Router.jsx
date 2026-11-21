import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import PublicRoute from '../components/PublicRoute.jsx';
import Layout from '../components/layout/Layout.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Kanban from '../pages/Kanban.jsx';
import Projects from '../pages/Projects.jsx';
import ProjectDetail from '../pages/ProjectDetail.jsx';
import MyIssues from '../pages/MyIssues.jsx';
import IssueDetail from '../pages/IssueDetail.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Settings from '../pages/Settings.jsx';
import NotFound from '../pages/NotFound.jsx';

export default function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public authentication routes — outside main layout */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected application routes — requires authenticated session */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/issues" element={<MyIssues />} />
              <Route path="/issues/:id" element={<IssueDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
