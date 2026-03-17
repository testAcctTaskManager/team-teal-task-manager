import { Routes, Route, Navigate, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Clinician from "./pages/Clinician.jsx";
import TaskDetail from "./pages/TaskDetail.jsx";
import Profile from "./pages/Profile.jsx";
import LoginButton from "./components/login/LoginButton.jsx";
import LoginPage from "./components/login/LoginPage.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import { useUsers } from "./contexts/UsersContext.jsx";
import { USER_ROLES } from "./constants/roles.js";

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

function AdminRoute({ children }) {
  const { currentUser } = useUsers();

  if (currentUser?.role !== USER_ROLES.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated, authLoading } = useUsers();

  return (
    <div className="w-full min-h-screen flex flex-col items-center p-8 text-center bg-slate-900 scrollbar-none">
      <div className="mb-6 flex gap-8">
        {!authLoading && isAuthenticated && (
          <>
            <Link
              to="/profile"
              className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
            >
              My Profile
            </Link>
            <Link
              to="/"
              className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200 border border-slate-300"
              aria-label="Kanban"
            >
              Kanban
            </Link>
            <Link
              to="/clinician"
              className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200 border border-slate-300"
              aria-label="Clinician"
            >
              Clinician
            </Link>
          </>
        )}
        <LoginButton />
      </div>
      <Routes>
        <Route
          path="/clinician"
          element={
            <ProtectedRoute>
              <Clinician />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home projectId={1} sprintId={1} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/task/:id"
          element={
            <ProtectedRoute>
              <TaskDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/task-demo"
          element={
            <ProtectedRoute>
              <Navigate to="/task/1" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
