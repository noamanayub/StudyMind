import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Pencil,
  Trash2,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { useResource } from "../hooks/useResource";
import { api, contentUrl, errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  Loading,
  ErrorNotice,
  EmptyState,
} from "../components/common/Feedback";
import { DocumentStatus } from "../components/knowledge/DocumentCard";
export default function Document() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const resource = useResource(`/documents/${id}`, { poll: true });
  const [dialog, setDialog] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const toast = useToast();
  const navigate = useNavigate();
  const doc = resource.data;
  const documentId = doc?.id,
    chunkCount = doc?.chunks?.length;
  useEffect(() => {
    if (documentId && params.get("chunk"))
      document
        .getElementById(`chunk-${params.get("chunk")}`)
        ?.scrollIntoView({ block: "center" });
  }, [documentId, params, chunkCount]);
  async function rename(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/documents/${id}`, {
        name: new FormData(e.currentTarget).get("name"),
      });
      resource.reload();
      setDialog(null);
      toast("Document renamed.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function retry() {
    setBusy(true);
    try {
      await api.post(`/documents/${id}/reprocess`);
      resource.reload();
      toast("Processing restarted.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (resource.loading && !doc) return <Loading />;
  if (resource.error && !doc)
    return <ErrorNotice message={resource.error} retry={resource.reload} />;
  if (!doc) return null;
  return (
    <>
      <Link
        className="text-link back-link"
        to={`/app/workspaces/${doc.workspaceId}`}
      >
        <ArrowLeft size={16} />
        {doc.workspace?.name || "Workspace"}
      </Link>
      <PageHeader
        eyebrow="ON YOUR BOOKSHELF"
        title={doc.originalName}
        description={`${(doc.fileSize / 1024).toFixed(0)} KB${doc.pageCount ? ` · ${doc.pageCount} pages` : ""} · Added ${new Date(doc.createdAt).toLocaleDateString()}`}
        action={
          <div className="button-row">
            <button
              className="icon-button"
              aria-label="Rename document"
              onClick={() => {
                setError("");
                setDialog("rename");
              }}
            >
              <Pencil size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Delete document"
              onClick={() => setDialog("delete")}
            >
              <Trash2 size={18} />
            </button>
            <a
              className="button button-secondary"
              href={doc.sourceUrl || contentUrl(id)}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={16} />
              Open original
            </a>
          </div>
        }
      />
      <div className="document-status-bar">
        <DocumentStatus status={doc.status} />
        {doc.status === "READY" && (
          <div className="resource-actions">
            <Link
              className="text-link"
              to="/app/agent"
              state={{ documentIds: [id] }}
            >
              Ask about this document <MessageSquare size={16} />
            </Link>
            <Link className="text-link" to={`/app/study?documentId=${id}`}>
              Create study tools
            </Link>
          </div>
        )}
      </div>
      {doc.extractionMode === "YOUTUBE" && (
        <p className="form-note">
          AI-generated lecture transcript, limited to the initial configured
          import duration. Verify wording and timestamps against the original
          video.
        </p>
      )}
      {["VISION", "AUDIO"].includes(doc.extractionMode) && (
        <p className="form-note">
          AI-generated{" "}
          {doc.extractionMode === "VISION"
            ? "image analysis"
            : "audio transcript"}
          . Verify it against the original before relying on it.
        </p>
      )}
      {error && dialog !== "rename" && <ErrorNotice message={error} />}
      {doc.status === "PROCESSING" ? (
        <EmptyState title="Connecting the ideas in your material">
          Study Mind is extracting and indexing your document. This page updates
          automatically.
        </EmptyState>
      ) : doc.status === "FAILED" ? (
        <EmptyState
          title="This one needs another look"
          action={
            <Button loading={busy} onClick={retry}>
              <RotateCcw size={16} />
              Try again
            </Button>
          }
        >
          {doc.errorMessage ||
            "We couldn’t process this document. Check the file and try again."}
        </EmptyState>
      ) : (
        <div className="document-viewer">
          {doc.mimeType.startsWith("audio/") && (
            <audio controls className="document-audio" src={contentUrl(id)}>
              Open the original to listen to this recording.
            </audio>
          )}
          {doc.mimeType.startsWith("image/") && (
            <img
              className="document-image"
              src={contentUrl(id)}
              alt={`Uploaded study material: ${doc.originalName}`}
            />
          )}
          {doc.mimeType === "application/pdf" && (
            <>
              <iframe
                title={`Original PDF: ${doc.originalName}`}
                src={`${contentUrl(id)}#page=${Number(params.get("page")) || 1}`}
                className="pdf-frame"
              />
              <p className="form-note">
                If your browser does not display the PDF, use “Open original.”
                The indexed text is available below.
              </p>
            </>
          )}
          <div className="section-title">
            <h2>Inside this document</h2>
            <span className="muted">Indexed text</span>
          </div>
          <div className="document-text">
            {doc.chunks.map((chunk) => (
              <section
                id={`chunk-${chunk.id}`}
                key={chunk.id}
                className={
                  params.get("chunk") === chunk.id ? "highlighted-chunk" : ""
                }
              >
                <p className="eyebrow">
                  {chunk.pageNumber
                    ? `PAGE ${chunk.pageNumber}`
                    : chunk.section || `PASSAGE ${chunk.chunkIndex + 1}`}
                </p>
                <p>{chunk.content}</p>
              </section>
            ))}
          </div>
        </div>
      )}
      {dialog === "rename" && (
        <Modal
          title="Rename your document"
          onClose={() => setDialog(null)}
          busy={busy}
        >
          <form onSubmit={rename}>
            {error && <ErrorNotice message={error} />}
            <Input
              name="name"
              label="Document name"
              required
              defaultValue={doc.originalName}
              maxLength={200}
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
      {dialog === "delete" && (
        <ConfirmDialog
          title="Delete this document?"
          description="The original file and its indexed knowledge will be removed. Previous conversations remain, but their links to this file will be unavailable."
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await api.delete(`/documents/${id}`);
            toast("Document deleted.");
            navigate(`/app/workspaces/${doc.workspaceId}`);
          }}
        />
      )}
    </>
  );
}
