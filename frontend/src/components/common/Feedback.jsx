import { AlertCircle, BookOpen } from "lucide-react";
import Button from "./Button";
export function Loading({ text = "Loading your space…" }) {
  return (
    <div className="loading" role="status">
      <span className="button-loader" />
      {text}
    </div>
  );
}
export function ErrorNotice({ message, retry }) {
  return (
    <div className="error-notice" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
      {retry && (
        <Button variant="ghost" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function EmptyState({ icon: Icon = BookOpen, title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={27} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Pagination({ data, page, setPage }) {
  return data && data.total > data.limit ? (
    <nav className="pagination" aria-label="Pagination">
      <Button
        variant="secondary"
        disabled={page === 1}
        onClick={() => setPage((p) => p - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page} of {Math.ceil(data.total / data.limit)}
      </span>
      <Button
        variant="secondary"
        disabled={page * data.limit >= data.total}
        onClick={() => setPage((p) => p + 1)}
      >
        Next
      </Button>
    </nav>
  ) : null;
}
