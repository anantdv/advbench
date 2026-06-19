import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ModulePage } from './pages/ModulePage';
import { useAuthStore } from './store/authStore';
import type { SectionKey } from './types';

const sectionToPath: Record<SectionKey, string> = {
  dashboard: '/',
  projects: '/projects',
  tasks: '/tasks',
  collaboration: '/collaboration',
  sprints: '/sprints',
  resources: '/resources',
  'time-tracking': '/time-tracking',
  clients: '/clients',
  reports: '/reports',
  administration: '/administration',
};

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={user ? <AppShell /> : <Navigate to="/login" replace />}>
        <Route index element={<DashboardPage />} />
        <Route path={sectionToPath.projects} element={<ModulePage />} />
        <Route path={sectionToPath.tasks} element={<ModulePage />} />
        <Route path={sectionToPath.collaboration} element={<ModulePage />} />
        <Route path={sectionToPath.sprints} element={<ModulePage />} />
        <Route path={sectionToPath.resources} element={<ModulePage />} />
        <Route path={sectionToPath['time-tracking']} element={<ModulePage />} />
        <Route path={sectionToPath.clients} element={<ModulePage />} />
        <Route path={sectionToPath.reports} element={<ModulePage />} />
        <Route path={sectionToPath.administration} element={<ModulePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
