import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import TaskDetail from "./pages/TaskDetail.jsx";
import Customers from "./components/Customers.jsx";
import Tasks from "./components/Tasks.jsx";



export default function App() {
  return (
    <Routes>
      {/*
        A static route:
      */}
      <Route path="/" element={<Home />} />

      {/*
        A dynamic route with a parameter.
        In the rendered component, you can read { id } via useParams().
      */}
      <Route path="/task/:id" element={<TaskDetail />} />

      {/*
        Convenience route to preview TaskDetail quickly.
        Adjust the id if your seed data uses a different task id.
      */}
      <Route path="/task-demo" element={<Navigate to="/task/1" replace />} />
    </Routes>
  );
}
