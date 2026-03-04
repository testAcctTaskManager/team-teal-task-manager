function NewTaskButton({ openModal = () => {} }) {
    return (
        <button
            type="button"
            onClick={openModal}
            className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-6 py-3 rounded-lg shadow-md transition-all duration-200 whitespace-nowrap"
        >
            + New Task
        </button>
    )
}

export default NewTaskButton;