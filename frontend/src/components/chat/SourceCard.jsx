import { Link } from "react-router-dom";
import { FileText, ArrowUpRight } from "lucide-react";
export default function SourceCard({ source }) {
  const content = (
    <>
      <FileText size={16} />
      <span>
        <strong>{source.documentName}</strong>
        <small>
          {source.pageNumber
            ? `Page ${source.pageNumber}`
            : source.section || "Source passage"}
          {!source.documentId ? " · Document deleted" : ""}
        </small>
      </span>
      {source.documentId && <ArrowUpRight size={14} />}
    </>
  );
  return source.documentId ? (
    <Link
      className="source-card"
      to={`/app/documents/${source.documentId}?chunk=${source.chunkId}${source.pageNumber ? `&page=${source.pageNumber}` : ""}`}
      title={source.contentPreview}
    >
      {content}
    </Link>
  ) : (
    <div className="source-card unavailable">{content}</div>
  );
}
