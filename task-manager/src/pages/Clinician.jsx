import { useContext, useState } from "react";
import ClinicianForm from "../components/ClinicianForm.jsx";
import PageLayout from "../components/PageLayout.jsx";
import ClinicianBoard from "../components/ClinicianBoard.jsx";
import { UsersContext } from "../contexts/UsersContext.jsx";

export default function ClinicianPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* Adding states for task filtering */
  const { users } = useContext(UsersContext);
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [selectedReporter, setSelectedReporter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  /* Manually defining columns for task filtering since they aren't coming from an API call in this file*/
  const clinicianColumns = [
    { id: "0", title: "To Do" },
    { id: "1", title: "In Progress" },
    { id: "2", title: "Blocked" },
    { id: "3", title: "In Review" },
    { id: "4", title: "Complete" }
  ];

  function openModal() {
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
  }

  function handleCreated() {
    closeModal();
  }

  return (
    <PageLayout title="Clinician Requests">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={openModal}
          className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-6 py-3 rounded-lg shadow-md transition-all duration-200 whitespace-nowrap"
        >
          + New Request
        </button>

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

          <div className="flex items-center gap-2">
            <label
              htmlFor="status-filter"
              className="text-white/70 text-sm whitespace-nowrap"
            >
              Status:
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 cursor-pointer">
              <option value="all" className="bg-slate-800">All Task Statuses</option>
              {clinicianColumns.map((col) => (
                <option key={col.id} value={col.id} className="bg-slate-800">
                  {col.title}
                </option>
              ))}
            </select>
          </div>
        </div>


        {showCreateModal && (
          <ClinicianForm onSuccess={handleCreated} onCancel={closeModal} />
        )}
      </div>

      <ClinicianBoard
        selectedAssignee={selectedAssignee}
        selectedReporter={selectedReporter}
        selectedStatus={selectedStatus}
      />
    </PageLayout>
  );
}
