import "./projectselector.css";
import ProjectCard from "./ProjectCard";

export default function ProjectSelector({ projects = [], selectedProjectId, onSelectProject }) {
  if (projects.length === 0) {
    return <p>No Projects Available</p>;
  }

  return (
    <div className="project-selector">
        <div className="project-selector__list">
        {projects.map((project) => (
            <ProjectCard
            key={project.id}
            project={project}
            isSelected={project.id === selectedProjectId}
            onClick={() => onSelectProject(project.id)}
            />
        ))}
        </div>
    </div>
  );
}
