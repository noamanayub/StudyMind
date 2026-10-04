import { useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { ErrorNotice } from "../common/Feedback";
import { useCollection } from "../../hooks/useCollection";
import { useResource } from "../../hooks/useResource";
import { api, errorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
export default function UploadDialog({ workspaceId, onClose, onSaved }) {
  const { data, error: workspaceError } = useCollection("/workspaces");
  const config = useResource("/config");
  const maxFileSizeMb = config.data?.maxFileSizeMb ?? 20;
  const [file, setFile] = useState(null),
    [workspace, setWorkspace] = useState(workspaceId || ""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState("");
  const ref = useRef();
  const [vision, setVision] = useState(false);
  const toast = useToast();
  function choose(value) {
    if (value?.size > maxFileSizeMb * 1024 * 1024) {
      setError(`Please choose a file smaller than ${maxFileSizeMb} MB.`);
      setFile(null);
      return;
    }
    setFile(value);
    setError("");
  }
  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("workspaceId", workspace);
    form.append("file", file);
    form.append(
      "extractionMode",
      vision && file.type.startsWith("image/") ? "VISION" : "TEXT",
    );
    try {
      await api.post("/documents/upload", form, {
        onUploadProgress: (e) =>
          setProgress(Math.round((e.loaded / (e.total || file.size)) * 100)),
      });
      toast("Uploaded. Study Mind is reading your material.");
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Something new to learn"
      description="Add your material. We’ll make it searchable."
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        {(error || workspaceError || config.error) && (
          <ErrorNotice message={error || workspaceError || config.error} />
        )}
        <div className="field">
          <label htmlFor="upload-workspace">Workspace</label>
          <select
            id="upload-workspace"
            required
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
          >
            <option value="">Choose a workspace</option>
            {data?.items.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <input
          ref={ref}
          className="sr-only"
          type="file"
          accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a"
          aria-label="Choose study document"
          onChange={(e) => choose(e.target.files[0])}
        />
        <button
          type="button"
          className="upload-zone"
          disabled={busy}
          onClick={() => ref.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!busy) choose(e.dataTransfer.files[0]);
          }}
        >
          {file ? <FileText size={30} /> : <Upload size={30} />}
          <strong>{file ? file.name : "Choose a file or drop it here"}</strong>
          <span>
            {file
              ? `${(file.size / 1024).toFixed(0)} KB · Click to change`
              : `Documents, images, MP3, WAV or M4A · Up to ${maxFileSizeMb} MB`}
          </span>
        </button>
        {busy && (
          <div className="upload-progress" role="status">
            <progress value={progress} max="100" />
            <span>
              {progress === 100
                ? "Saving your document…"
                : `Uploading ${progress}%`}
            </span>
          </div>
        )}
        {file?.type.startsWith("image/") && (
          <label className="quiz-option">
            <input
              type="checkbox"
              checked={vision}
              disabled={busy}
              onChange={(e) => setVision(e.target.checked)}
            />
            <span>
              Understand diagrams or photos with Gemini instead of local text
              OCR
            </span>
          </label>
        )}
        <p className="form-note">
          Scanned PDF pages and text in images use local OCR. Extracted text is
          sent to Gemini for embeddings. Visual analysis sends the image to
          Gemini; lecture audio is sent for transcription (up to 30 minutes). AI
          descriptions and transcripts should be checked against the original.
        </p>
        <div className="modal-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={busy}
            disabled={!file || !workspace || config.loading || !!config.error}
          >
            Upload document
          </Button>
        </div>
      </form>
    </Modal>
  );
}
