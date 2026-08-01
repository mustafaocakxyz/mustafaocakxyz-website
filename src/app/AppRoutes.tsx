import { Navigate, Route, Routes } from 'react-router-dom';
import { AppAuthProvider } from './AppAuthContext';
import { AdminChatPage } from './pages/AdminChatPage';
import { AdminPreviewPage } from './pages/AdminPreviewPage';
import { AdminShowcasePage } from './pages/AdminShowcasePage';
import { AppLoginPage } from './pages/AppLoginPage';
import { StudentChatPage } from './pages/StudentChatPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';

export function AppRoutes() {
  return (
    <AppAuthProvider>
      <Routes>
        <Route index element={<AppLoginPage />} />
        <Route path="student" element={<StudentDashboardPage />} />
        <Route path="student/chat" element={<StudentChatPage />} />
        <Route path="admin" element={<AdminPreviewPage />} />
        <Route path="admin/preview" element={<Navigate to="/app/admin" replace />} />
        <Route path="admin/showcase" element={<AdminShowcasePage />} />
        <Route path="admin/chat" element={<AdminChatPage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AppAuthProvider>
  );
}
