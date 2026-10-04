import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Upload, Search, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useResource } from "../hooks/useResource";
import { useCollection } from "../hooks/useCollection";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  EmptyState,
  ErrorNotice,
  Loading,
  Pagination,
} from "../components/common/Feedback";
import WorkspaceForm from "../components/knowledge/WorkspaceForm";
import WorkspaceCard from "../components/knowledge/WorkspaceCard";
import DocumentCard from "../components/knowledge/DocumentCard";
import UploadDialog from "../components/knowledge/UploadDialog";
import YoutubeDialog from "../components/knowledge/YoutubeDialog";
export default function Knowledge() {
  const { workspaceId } = useParams();
  const [dialog, setDialog] = useState(null),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("newest"),
    [filter, setFilter] = useState(""),
    [page, setPage] = useState(1),
    [workspacePage, setWorkspacePage] = useState(1);
  const toast = useToast();
  const navigate = useNavigate();
  const workspaceOptions = useCollection("/workspaces");
  const workspaces = useResource(`/workspaces?limit=6&page=${workspacePage}`),
    workspace = useResource(workspaceId ? `/workspaces/${workspaceId}` : null);
  const documents = useResource(
    `/documents?limit=12&page=${page}&search=${encodeURIComponent(search)}&sort=${sort}${workspaceId || filter ? `&workspaceId=${workspaceId || filter}` : ""}`,
    { poll: true },
  );
  function reload() {
    workspaces.reload();
    workspaceOptions.reload();
    workspace.reload();
    documents.reload();
  }
  async function remove() {
    await api.delete(`/workspaces/${workspaceId}`);
    toast("Workspace deleted.");
    navigate("/app/knowledge");
    workspaces.reload();
    documents.reload();
  }
  return (
    <>
      {workspaceId && (
        <Link className="text-link back-link" to="/app/knowledge">
          <ArrowLeft size={16} />
          All knowledge
        </Link>
      )}
      <PageHeader
        eyebrow={workspaceId ? "YOUR LEARNING SPACE" : "A HOME FOR YOUR IDEAS"}
        title={
          workspaceId
            ? workspace.data?.name || "Your workspace"
            : "My knowledge"
        }
        description={
          workspaceId
            ? workspace.data?.description ||
              "Your documents, connected by curiosity."
            : "A little more organized. A lot easier to explore."
        }
        action={
          <div className="button-row">
            {workspaceId ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setDialog("workspace")}
                  disabled={!workspace.data}
                >
                  <Pencil size={16} />
                  Edit
                </Button>
                <button
                  className="icon-button"
                  aria-label="Delete workspace"
                  disabled={!workspace.data}
                  onClick={() => setDialog("delete")}
                >
                  <Trash2 size={18} />
                </button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setDialog("workspace")}
              >
                <Plus size={17} />
                New workspace
              </Button>
            )}
            <Button
              onClick={() => setDialog("upload")}
              disabled={!workspaceId && !workspaces.data?.total}
            >
              <Upload size={17} />
              Upload material
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDialog("youtube")}
              disabled={!workspaceId && !workspaces.data?.total}
            >
              Import YouTube
            </Button>
          </div>
        }
      />
      {workspace.error && (
        <ErrorNotice message={workspace.error} retry={workspace.reload} />
      )}{" "}
      {!workspaceId && (
        <section className="dashboard-section">
          <div className="section-title">
            <h2>Your workspaces</h2>
            <span className="muted">
              Organize by subject, project, or big idea.
            </span>
          </div>
          {workspaces.error ? (
            <ErrorNotice message={workspaces.error} retry={workspaces.reload} />
          ) : workspaces.loading ? (
            <Loading />
          ) : workspaces.data?.items.length ? (
            <>
              <div className="workspace-grid">
                {workspaces.data.items.map((w) => (
                  <WorkspaceCard key={w.id} workspace={w} />
                ))}
              </div>
              <Pagination
                data={workspaces.data}
                page={workspacePage}
                setPage={setWorkspacePage}
              />
            </>
          ) : (
            <EmptyState
              title="Make room for your first subject"
              action={
                <Button onClick={() => setDialog("workspace")}>
                  Create a workspace
                </Button>
              }
            >
              Keep related notes and conversations together.
            </EmptyState>
          )}
        </section>
      )}
      <section className="dashboard-section">
        <div className="section-title">
          <h2>{workspaceId ? "Study material" : "All your material"}</h2>
          <span className="muted">{documents.data?.total ?? 0} documents</span>
        </div>
        <div className="library-toolbar">
          <form
            className="search-field"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(new FormData(e.currentTarget).get("search"));
              setPage(1);
            }}
          >
            <Search size={18} />
            <input
              name="search"
              aria-label="Search documents"
              placeholder="Find a document…"
            />
            <button className="text-button" type="submit">
              Search
            </button>
          </form>
          {!workspaceId && (
            <select
              aria-label="Filter by workspace"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All workspaces</option>
              {workspaceOptions.data?.items.map((w) => (
                <option value={w.id} key={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Sort documents"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        {documents.error ? (
          <ErrorNotice message={documents.error} retry={documents.reload} />
        ) : documents.loading ? (
          <Loading />
        ) : documents.data?.items.length ? (
          <div className="document-grid">
            {documents.data.items.map((d) => (
              <DocumentCard key={d.id} document={d} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Upload}
            title={
              search || filter
                ? "No matching material"
                : "A fresh shelf, waiting for your notes"
            }
            action={
              !search &&
              !filter &&
              (workspaceId || workspaces.data?.total > 0) ? (
                <Button onClick={() => setDialog("upload")}>
                  Upload your first document
                </Button>
              ) : undefined
            }
          >
            {search || filter
              ? "Try a different search or workspace."
              : "Add a lecture, reading, or note. Study Mind will take it from there."}
          </EmptyState>
        )}
        <Pagination data={documents.data} page={page} setPage={setPage} />
      </section>
      {dialog === "workspace" && (
        <WorkspaceForm
          workspace={workspaceId ? workspace.data : null}
          onClose={() => setDialog(null)}
          onSaved={reload}
        />
      )}
      {dialog === "upload" && (
        <UploadDialog
          workspaceId={workspaceId}
          onClose={() => setDialog(null)}
          onSaved={reload}
        />
      )}
      {dialog === "youtube" && (
        <YoutubeDialog
          workspaceId={workspaceId}
          onClose={() => setDialog(null)}
          onSaved={reload}
        />
      )}
      {dialog === "delete" && (
        <ConfirmDialog
          title="Delete this workspace?"
          description="This permanently deletes its documents, indexed knowledge, and workspace conversations. This cannot be undone."
          onClose={() => setDialog(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
