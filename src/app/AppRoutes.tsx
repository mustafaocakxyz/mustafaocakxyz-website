import { Navigate, Route, Routes } from 'react-router-dom';
import { AppAuthProvider } from './AppAuthContext';
import { AdminHomePage } from './pages/AdminHomePage';
import { AdminShowcasePage } from './pages/AdminShowcasePage';
import { AppLoginPage } from './pages/AppLoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';

export function AppRoutes() {
  return (
    <AppAuthProvider>
      <Routes>
        <Route index element={<AppLoginPage />} />
        <Route path="student" element={<StudentDashboardPage />} />
        <Route path="admin" element={<AdminHomePage />} />
        <Route path="admin/showcase" element={<AdminShowcasePage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AppAuthProvider>
  );
}
