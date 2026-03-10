import { useState } from "react";
import ClinicianForm from "../components/ClinicianForm.jsx";
import PageLayout from "../components/PageLayout.jsx";
import ClinicianBoard from "../components/ClinicianBoard.jsx";

export default function ClinicianPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

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

        {showCreateModal && (
          <ClinicianForm onSuccess={handleCreated} onCancel={closeModal} />
        )}
      </div>

      <ClinicianBoard/>
    </PageLayout>
  );
}
