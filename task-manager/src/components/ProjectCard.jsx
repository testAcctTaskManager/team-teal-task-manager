export default function ProjectCard({ project, isSelected, onClick }) {
  if (!project || project.id == null) {
    return null;
  }

  const { name } = project;

  return (
    <div
      className={`px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 border ${
        isSelected
          ? "bg-gradient-to-r from-slate-700 to-slate-600 border-white/30 shadow-md"
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
      }`}
      onClick={onClick}
      data-testid="project-card"
    >
      <h3 className="text-white font-medium text-base m-0">{name}</h3>
    </div>
  );
}
