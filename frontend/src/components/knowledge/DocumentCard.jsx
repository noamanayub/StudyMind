import { Link } from "react-router-dom";
import {
  FileText,
  Check,
  Clock,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
export function DocumentStatus({ status }) {
  const Icon =
    status === "READY" ? Check : status === "FAILED" ? AlertCircle : Clock;
  return (
    <span className={`document-status ${status.toLowerCase()}`}>
      <Icon size={12} />
      {status === "READY"
        ? "Ready to study"
        : status === "FAILED"
          ? "Needs attention"
          : "Processing"}
    </span>
  );
}
export default function DocumentCard({ document: doc }) {
  return (
    <Link className="document-card" to={`/app/documents/${doc.id}`}>
      <div className="document-card-heading">
        <span className="file-icon">
          <FileText size={23} />
        </span>
        <ArrowUpRight size={17} />
      </div>
      <h3>{doc.originalName}</h3>
      <p>
        {doc.workspace?.name}
        {doc.pageCount ? ` · ${doc.pageCount} pages` : ""}
      </p>
      <div className="document-card-footer">
        <DocumentStatus status={doc.status} />
        <span>
          {new Date(doc.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </Link>
  );
}
