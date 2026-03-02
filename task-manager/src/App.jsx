import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import TaskDetail from "./pages/TaskDetail.jsx";
import ProjectSidebar from "./pages/ProjectSidebar.jsx";
import Profile from "./pages/Profile.jsx";
import LoginButton from "./components/login/LoginButton.jsx";
import LoginPage from "./components/login/LoginPage.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import { useUsers } from "./contexts/UsersContext.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useUsers();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center p-8 text-center bg-slate-900 scrollbar-none">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<ProtectedRoute><Home projectId={1} /></ProtectedRoute>} />
        <Route path="/task/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
        <Route path="/project-sidebar" element={<ProtectedRoute><ProjectSidebar /></ProtectedRoute>} />
        <Route path="/task-demo" element={<ProtectedRoute><Navigate to="/task/1" replace /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      </Routes>
      {/* <LoginButton /> */}
    </div>
  );
}
