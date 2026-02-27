import ProjectCard from "./ProjectCard";
import { useState } from "react";

export default function ProjectSelector({
  projects = [],
  selectedProjectId,
  onSelectProject,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (projects.length === 0) {
    return <p className="text-white/60 text-sm">No Projects Available</p>;
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-5 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center gap-3 whitespace-nowrap"
      >
        <span>{selectedProject?.name || "Select Project"}</span>
        <span className="text-sm">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800/95 rounded-lg border border-white/10 shadow-2xl overflow-hidden z-50 backdrop-blur-sm">
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelected={project.id === selectedProjectId}
                onClick={() => {
                  onSelectProject(project.id);
                  setIsExpanded(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
