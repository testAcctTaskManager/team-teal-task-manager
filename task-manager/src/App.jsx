import { Routes, Route, Navigate, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Clinician from "./pages/Clinician.jsx";
import TaskDetail from "./pages/TaskDetail.jsx";
import ProjectSidebar from "./pages/ProjectSidebar.jsx";
import Profile from "./pages/Profile.jsx";
import LoginButton from "./components/login/LoginButton.jsx";
import ProfileButton from "./components/login/ProfileButton.jsx";
import LoginPage from "./components/login/LoginPage.jsx";
import UserManagement from "./pages/UserManagement.jsx";

export default function App() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center p-8 text-center bg-slate-900 scrollbar-none">
      <div className="mb-6 flex gap-8">
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
      </div>
      <Routes>
        {/* Clinician section route */}
        <Route path="/clinician" element={<Clinician />} />
        {/*
          A static route:
        */}
        <Route path="/" element={<Home projectId={1} />} />

        {/*
          A dynamic route with a parameter.
          In the rendered component, you can read { id } via useParams().
        */}
        <Route path="/task/:id" element={<TaskDetail />} />

        {/*
          Convenience route to preview ProjectSidebar quickly.
        */}
        <Route path="/project-sidebar" element={<ProjectSidebar />} />

        {/*
          Convenience route to preview TaskDetail quickly.
          Adjust the id if your seed data uses a different task id.
        */}
        <Route path="/task-demo" element={<Navigate to="/task/1" replace />} />

        {/*
          Profile route
        */}
        <Route path="/profile" element={<Profile />} />

        {/*
          Login page
        */}
        <Route path="/login" element={<LoginPage />} />
        {/*
          UserManagement page
        */}
        <Route path="/user-management" element={<UserManagement />} />
      </Routes>
      <ProfileButton />
      <LoginButton />
    </div>
  );
}
