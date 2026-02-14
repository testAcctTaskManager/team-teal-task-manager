import "./projectcard.css";

export default function ProjectCard({ project, isSelected, onClick }) {
    if (!project || project.id == null) {
        return null;
    }

    const {
        name
    } = project;

    return (
        <div className={isSelected ? "selected-project-card" : "project-card"} 
        onClick={onClick}>
            <div className="project-card__header">
                <h3>{name}</h3>
            </div>
        </div>
    );
}