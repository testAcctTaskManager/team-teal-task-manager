import { useState, useEffect, useMemo } from "react";
import TaskForm from "../components/TaskForm.jsx";
import Kanban from "../components/Kanban.jsx";
import { Link } from "react-router-dom";
import ProjectSelector from "../components/ProjectSelector.jsx";
import Scrum from "../components/Scrum.jsx";

export default function Home({ projectId: initialProjectId }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(initialProjectId);

  /* Adding states for task filtering */
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [selectedReporter, setSelectedReporter] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [users, setUsers] = useState([]);

  // Load the columns and tasks for the provided project ID
  async function loadColumns(projectId) {
    try {
      const [colRes, taskRes] = await Promise.all([
        fetch(`/api/columns?project_id=${projectId}`),
        fetch(`/api/tasks?project_id=${projectId}`),
      ]);

      const cols = await colRes.json().catch(() => null);
      if (!Array.isArray(cols) || cols.error) {
        console.error("API error loading columns", cols);
        setColumns([]);
        return;
      }

      const taskList = await taskRes.json().catch(() => null);
      if (!Array.isArray(taskList) || taskList.error) {
        console.error("API error loading tasks", taskList);
        setColumns([]);
        return;
      }
      console.log(taskList);
      const columnsWithTasks = cols.map((col) => {
        const colTasks = taskList
          .filter((t) => Number(t.column_id) === Number(col.id))
          .sort(
            (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0),
          );
        return {
          ...col,
          title: col.name,
          tasks: colTasks,
        };
      });

      setColumns(columnsWithTasks);
    } catch (err) {
      console.error("Fetch error", err);
      setColumns([]);
    }
  }

  /* Custom data loader for task filtering - added to fetch user/project lists */
  async function loadFilterMetadata() {
    try {
      const [uRes, pRes] = await Promise.all([fetch("/api/users"), fetch("/api/projects")]);
      const uData = await uRes.json();
      const pData = await pRes.json();
      if (Array.isArray(uData)) setUsers(uData);
      if (Array.isArray(pData)) setProjects(pData);
    } catch (e) { console.error("Filter metadata error", e); }
  }

  async function loadProjects(){
    try {
      // Fetch projects from API
      const res = await fetch(`/api/projects`);

      // Ensure projectsArr is an array and there was no error
      const projectsArr = await res.json().catch(() => null);
      if (!Array.isArray(projectsArr) || projectsArr.error) {
        console.error("API error loading projects", projectsArr);
        setProjects([]);
        return;
      }

      // Update projects useState
      setProjects(projectsArr);
    } 
    catch (err) {
      console.error("Fetch error", err);
      setProjects([]);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    loadColumns(projectId);
    // Added to trigger task filtering metadata load
    loadFilterMetadata();
  }, [projectId]);

  /* Task filtering engine - Calculates a 'view' without changing columns state */
  const filteredColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => {
        const mStatus = selectedStatus === "all" || Number(t.column_id) === Number(selectedStatus);
        const mAssignee = selectedAssignee === "all" || Number(t.assignee_id) === Number(selectedAssignee);
        const mReporter = selectedReporter === "all" || Number(t.reporter_id) === Number(selectedReporter);
        const mProject = selectedProject === "all" || Number(t.project_id) === Number(selectedProject);
        return mStatus && mAssignee && mReporter && mProject;
      })
    }));
  }, [columns, selectedStatus, selectedAssignee, selectedReporter, selectedProject]);
 
  /* Gets the correct board type based on the current project. Defaults to Kanban */
  const selectedProjectType = useMemo(() => {
    const currentProject = projects.find((p) => Number(p.id) === Number(projectId));
    const type = (currentProject?.type || "kanban").toLowerCase();
    return type;
  }, [projects, projectId])

  const BoardComponent = useMemo(() => {
    const boardByType = {
      kanban: Kanban,
      scrum: Scrum,
    };
    return boardByType[selectedProjectType] || Kanban;
  }, [selectedProjectType]);

  function openModal() {
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
  }

  async function handleCreated(task) {
    console.log("Created task", task);
    // On successful task creation, reload columns data to show the new task
    try {
      await loadColumns(projectId);
    } catch (err) {
      console.error("Error reloading board after create", err);
    }
    closeModal();
  }

  return (
    <div>
      <ProjectSelector projects={projects} selectedProjectId={projectId} onSelectProject={setProjectId}/>
      <header>
        <Link to="/profile" style={{float: "right"}}>
          My Profile
        </Link>
      </header>

      <h1>Project {projectId} Board</h1>
      <div>
        <button type="button" onClick={openModal}>
          + New Task
        </button>

        {/* Task Filtering UI Section */}

        <div style={{ display: "flex", gap: "10px", margin: "20px 0", padding: "10px", background: "#0f172a", borderRadius: "5px", alignContent: "left" }}>
          <span style={{ fontWeight: "bold", color: "#ffffff", fontSize: "14px" }}>
            Filter Board:
          </span>

          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="all" style={{color: "#0f172a"}}>All Statuses</option>
            <option value="1" style={{color: "#0f172a"}}>To Do</option>
            <option value="2" style={{color: "#0f172a"}}>Blocked</option>
            <option value="3" style={{color: "#0f172a"}}>In Progress</option>
            <option value="4" style={{color: "#0f172a"}}>In Review</option>
            <option value="5" style={{color: "#0f172a"}}>Complete</option>
          </select>

          <select value={selectedAssignee} onChange={e => setSelectedAssignee(e.target.value)}>
            <option value="all" style={{color: "#0f172a"}}>All Assignees</option>
            {users.map(u => <option key={u.id} value={u.id} style={{color: "#0f172a"}}>{u.display_name}</option>)}
          </select>

          <select value={selectedReporter} onChange={e => setSelectedReporter(e.target.value)}>
            <option value="all" style={{color: "#0f172a"}}>All Reporters</option>
            {users.map(u => <option key={u.id} value={u.id} style={{color: "#0f172a"}}>{u.display_name}</option>)}
          </select>

          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="all" style={{color: "#0f172a"}}>All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id} style={{color: "#0f172a"}}>{p.name}</option>)}
          </select>
        </div>

        {showCreateModal && (
          <TaskForm
            projectId={projectId}
            createdBy={1}
            modifiedBy={1}
            columnsForStatus={columns}
            onSuccess={handleCreated}
            onCancel={closeModal}
          />
        )}
      </div>

      <div>
        <BoardComponent columns={filteredColumns} setColumns={setColumns} />
      </div>
    </div>
  );
}
