import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { workspaceIcons } from "./WorkspaceForm";
export default function WorkspaceCard({ workspace }) {
  const Icon = workspaceIcons[workspace.icon] || workspaceIcons.book;
  return (
    <Link to={`/app/workspaces/${workspace.id}`} className="workspace-card">
      <div className="workspace-card-top">
        <span className="workspace-icon">
          <Icon size={23} />
        </span>
        <ArrowUpRight size={19} />
      </div>
      <h3>{workspace.name}</h3>
      <p>{workspace.description || "A little space for your next big idea."}</p>
      <span className="workspace-meta">
        {workspace._count?.documents || 0} documents <span>·</span>{" "}
        {workspace._count?.conversations || 0} conversations
      </span>
    </Link>
  );
}
