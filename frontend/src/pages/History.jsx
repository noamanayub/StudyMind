import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MessageSquare,
  ArrowUpRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { useResource } from "../hooks/useResource";
import { api, errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  Loading,
  ErrorNotice,
  EmptyState,
  Pagination,
} from "../components/common/Feedback";
export default function History() {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [edit, setEdit] = useState(null),
    [remove, setRemove] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const resource = useResource(
    `/conversations?search=${encodeURIComponent(search)}&page=${page}&limit=20`,
  );
  const toast = useToast();
  async function rename(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/conversations/${edit.id}`, {
        title: new FormData(e.currentTarget).get("title"),
      });
      setEdit(null);
      resource.reload();
      toast("Conversation renamed.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="GOOD QUESTIONS ARE WORTH KEEPING"
        title="Your conversations"
        description="A trail of ideas. Ready to pick up again."
        action={
          <Link className="button button-primary" to="/app/agent">
            Start a conversation <ArrowUpRight size={17} />
          </Link>
        }
      />
      <form
        className="search-field history-search"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(new FormData(e.currentTarget).get("search"));
          setPage(1);
        }}
      >
        <Search size={18} />
        <input
          name="search"
          aria-label="Search conversations"
          placeholder="Find a conversation…"
        />
        <button className="text-button">Search</button>
      </form>
      {resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.reload} />
      ) : resource.loading ? (
        <Loading />
      ) : resource.data?.items.length ? (
        <div className="history-list">
          {resource.data.items.map((c) => (
            <article key={c.id}>
              <span className="workspace-icon">
                <MessageSquare size={21} />
              </span>
              <Link className="history-link" to={`/app/agent/${c.id}`}>
                <h2>{c.title}</h2>
                <p>
                  {c.workspace?.name || "Your knowledge"} · {c._count.messages}{" "}
                  messages ·{" "}
                  {new Date(c.updatedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </Link>
              <button
                className="icon-button"
                aria-label={`Rename ${c.title}`}
                onClick={() => {
                  setEdit(c);
                  setError("");
                }}
              >
                <Pencil size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={`Delete ${c.title}`}
                onClick={() => setRemove(c)}
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title={
            search
              ? "No matching conversations"
              : "Your first question is the beginning"
          }
        >
          {search
            ? "Try a different title."
            : "Ask Study Mind a question. Your conversations will be saved here."}
        </EmptyState>
      )}
      <Pagination data={resource.data} page={page} setPage={setPage} />
      {edit && (
        <Modal
          title="Give this conversation a name"
          onClose={() => setEdit(null)}
          busy={busy}
        >
          <form onSubmit={rename}>
            {error && <ErrorNotice message={error} />}
            <Input
              name="title"
              label="Conversation title"
              defaultValue={edit.title}
              maxLength={160}
              required
              autoFocus
            />
            <div className="modal-actions">
              <Button type="submit" loading={busy}>
                Save name
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <ConfirmDialog
          title="Delete this conversation?"
          description="Its messages and saved source references will be permanently removed."
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await api.delete(`/conversations/${remove.id}`);
            resource.reload();
            toast("Conversation deleted.");
          }}
        />
      )}
    </>
  );
}
