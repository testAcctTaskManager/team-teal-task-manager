import { useState, useEffect, useMemo } from "react";
import TaskForm from "../components/TaskForm.jsx";
import NewTaskButton from "../components/NewTaskButton.jsx";
import { Link } from "react-router-dom";
import ProjectSelector from "../components/ProjectSelector.jsx";
import Scrum from "../components/Scrum.jsx";
import Backlog from "../components/Backlog.jsx";
import Sprints from "../components/Sprints.jsx";
import OldSprints from "../components/OldSprints.jsx";

export default function Home({ projectId: initialProjectId }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [columns, setColumns] = useState([]);
  const [backlogColumns, setBacklogColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [projectTab, setProjectTab] = useState("Board");
  const [sprints, setSprints] = useState([]);
  const [sprintStatus, setSprintStatus] = useState("not_started");
  const [sprintColumns, setSprintColumns] = useState([]);
  const [sprintId, setSprintId] = useState(null);
  const [allTasks, setAllTasks] = useState([]);

  /* Adding states for task filtering */
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [selectedReporter, setSelectedReporter] = useState("all");
  const [users, setUsers] = useState([]);

  // Load the columns and tasks for the provided project ID
  async function loadColumns(projectId) {
    try {
      const [colRes, taskRes, sprintRes] = await Promise.all([
        fetch(`/api/columns?project_id=${projectId}`),
        fetch(`/api/tasks?project_id=${projectId}`),
        fetch(`/api/sprints?project_id=${projectId}`),
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

      const sprintList = await sprintRes.json().catch(() => null);
      if (!Array.isArray(sprintList) || sprintList.error) {
        console.error("API error loading sprints", sprintList);
        setSprints([]);
        setSprintColumns([]);
        return;
      }
      setSprints(sprintList);
      setAllTasks(taskList);

      // Select the active (in_progress) sprint, fall back to first not_started sprint.
      const activeSprint =
        sprintList.find((s) => s.status === "in_progress") ||
        sprintList.find((s) => s.status === "not_started");
      const activeSprintId = activeSprint ? activeSprint.id : null;
      if (activeSprintId != sprintId) {
        setSprintId(activeSprintId);
      }

      const isSprintActive = activeSprint?.status === "in_progress";

      const columnsWithTasks = cols.map((col) => {
        const colTasks = isSprintActive
          ? taskList
              .filter(
                (t) =>
                  Number(t.column_id) === Number(col.id) &&
                  t.sprint_id == activeSprintId,
              )
              .sort(
                (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0),
              )
          : [];
        return {
          ...col,
          title: col.name,
          tasks: colTasks,
        };
      });
      setColumns(columnsWithTasks);

      const backlogTasks = taskList.filter(
        (t) => t.column_id == null && t.sprint_id == null,
      );
      setBacklogColumns([{ id: null, title: "Backlog", tasks: backlogTasks }]);
      if (activeSprint) {
        setSprintStatus(activeSprint.status);
        const sprintTasks = taskList.filter(
          (t) =>
            t.sprint_id == activeSprintId &&
            Number(t.project_id) === Number(projectId),
        );
        setSprintColumns([
          { id: activeSprintId, title: activeSprint.name, tasks: sprintTasks },
        ]);
      } else {
        setSprintColumns([]);
      }
    } catch (err) {
      console.error("Fetch error", err);
      setColumns([]);
      setBacklogColumns([]);
    }
  }

  /* Custom data loader for task filtering - added to fetch user/project lists */
  async function loadFilterMetadata() {
    try {
      const [uRes, pRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/projects"),
      ]);
      const uData = await uRes.json();
      const pData = await pRes.json();
      if (Array.isArray(uData)) setUsers(uData);
      if (Array.isArray(pData)) setProjects(pData);
    } catch (e) {
      console.error("Filter metadata error", e);
    }
  }

  async function loadProjects() {
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
    } catch (err) {
      console.error("Fetch error", err);
      setProjects([]);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  /* Eslint creates a warning about not having loadcolumns in the dependancy array
   however adding it will cause the application to rerender constantly */
  useEffect(() => {
    if (!projectId) return;
    setColumns([]);
    loadColumns(projectId);
    // Added to trigger task filtering metadata load
    loadFilterMetadata();
  }, [projectId, sprintId]); // eslint-disable-line

  const activeProjectColumns = useMemo(() => {
    return columns.filter(
      (col) => Number(col.project_id) === Number(projectId),
    );
  }, [columns, projectId]);

  /* Task filtering engine - Calculates a 'view' without changing columns state */
  const filteredColumns = useMemo(() => {
    return activeProjectColumns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => {
        const mAssignee =
          selectedAssignee === "all" ||
          Number(t.assignee_id) === Number(selectedAssignee);
        const mReporter =
          selectedReporter === "all" ||
          Number(t.reporter_id) === Number(selectedReporter);
        return mAssignee && mReporter;
      }),
    }));
  }, [activeProjectColumns, selectedAssignee, selectedReporter]);

  function handleProjectTabSwitch(e) {
    setProjectTab(e.target.value);
  }

  function handleProjectChange(nextProjectId) {
    setProjectId(nextProjectId);
  }

  async function handleProjectCreated(newProject) {
    await loadProjects();
    setProjectId(newProject.id);
    setProjectTab("Board");
  }

  // Update sprint status in the database.
  async function updateSprintStatus(newStatus) {
    try {
      const statusRes = await fetch(`/api/sprints/${sprintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const bodyRes = await statusRes.json().catch(() => null);
      if (!statusRes.ok) {
        console.error("Error updating sprint status", bodyRes);
        return;
      }

      if (newStatus === "in_progress") {
        const todoColumn = columns.find((col) => col.key === "todo");
        if (todoColumn) {
          const unplacedTasks = (sprintColumns[0]?.tasks ?? []).filter(
            (t) => t.column_id == null,
          );
          await Promise.all(
            unplacedTasks.map((task) =>
              fetch(`/api/tasks/${task.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ column_id: todoColumn.id }),
              }),
            ),
          );
        }
      }

      if (newStatus === "complete") {
        const completeColumnId =
          columns.find((col) => col.key === "complete")?.id ?? null;
        const incompleteTasks = columns
          .filter((col) => Number(col.id) !== Number(completeColumnId))
          .flatMap((col) => col.tasks);
        await Promise.all(
          incompleteTasks.map((task) =>
            fetch(`/api/tasks/${task.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sprint_id: null, column_id: null }),
            }),
          ),
        );
      }

      await loadColumns(projectId);
    } catch (err) {
      console.error("Error updating sprint status", err);
    }
  }

  async function addTaskToSprint(taskId) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprint_id: sprintId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("Error adding task to sprint", data);
        return;
      }
      await loadColumns(projectId);
    } catch (err) {
      console.error("Error adding task to sprint", err);
    }
  }

  async function createSprint() {
    try {
      const nextNumber = sprints.length + 1;
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          name: `Sprint ${nextNumber}`,
          created_by: 1,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Error creating sprint", data);
        return;
      }
      await loadColumns(projectId);
    } catch (err) {
      console.error("Error creating sprint", err);
    }
  }

  const projectTabs = {
    "Old Sprints": <OldSprints sprints={sprints} allTasks={allTasks} />,
    Board: (
      <Scrum
        key={projectId}
        columns={filteredColumns}
        setColumns={setColumns}
      />
    ),
    Backlog: (
      <div>
        <Sprints
          columns={sprintColumns}
          sprintStatus={sprintStatus}
          sprintName={sprintColumns[0]?.title ?? null}
          setSprintColumns={setSprintColumns}
          setSprintStatus={setSprintStatus}
          updateSprintStatus={updateSprintStatus}
          createSprint={createSprint}
          boardTitle="Sprints"
        />
        <Backlog
          key={projectId}
          backlog={backlogColumns}
          onAddToSprint={sprintId ? addTaskToSprint : null}
        />
      </div>
    ),
  };

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
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg px-6 py-4 shadow-lg mb-6">
        <h1 className="text-3xl font-bold text-white m-0 mb-3">
          Project {projectId} {projectTab}
        </h1>
        <div className="flex gap-2 justify-center">
          <button type="button" value="Board" onClick={handleProjectTabSwitch}>
            Board
          </button>
          <button
            type="button"
            value="Backlog"
            onClick={handleProjectTabSwitch}
          >
            Backlog
          </button>
          <button
            type="button"
            value="Old Sprints"
            onClick={handleProjectTabSwitch}
          >
            Old Sprints
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <ProjectSelector
          projects={projects}
          selectedProjectId={projectId}
          onSelectProject={handleProjectChange}
          onProjectCreated={handleProjectCreated}
        />

        <NewTaskButton openModal={openModal} />

        <div className="flex items-center gap-3 flex-1">
          <span className="font-semibold text-white text-sm whitespace-nowrap">
            Filter Board:
          </span>

          <div className="flex items-center gap-2">
            <label
              htmlFor="assignee-filter"
              className="text-white/70 text-sm whitespace-nowrap"
            >
              Assignee:
            </label>
            <select
              id="assignee-filter"
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 cursor-pointer"
            >
              <option value="all" className="bg-slate-800">
                All Assignees
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-800">
                  {u.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="reporter-filter"
              className="text-white/70 text-sm whitespace-nowrap"
            >
              Reporter:
            </label>
            <select
              id="reporter-filter"
              value={selectedReporter}
              onChange={(e) => setSelectedReporter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 cursor-pointer"
            >
              <option value="all" className="bg-slate-800">
                All Reporters
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-800">
                  {u.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showCreateModal && (
          <TaskForm
            projectId={projectId}
            createdBy={1}
            modifiedBy={1}
            columnsForStatus={columns}
            activeSprint={
              sprints.find(
                (s) => s.status === "in_progress" || s.status === "not_started",
              ) ?? null
            }
            onSuccess={handleCreated}
            onCancel={closeModal}
          />
        )}
      </div>

      <div>{projectTabs[projectTab] ?? <div>unknown tab</div>}</div>
    </div>
  );
}
