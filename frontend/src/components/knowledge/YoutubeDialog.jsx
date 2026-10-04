import { useState } from "react";
import { useCollection } from "../../hooks/useCollection";
import { api, errorMessage } from "../../services/api";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { ErrorNotice } from "../common/Feedback";
export default function YoutubeDialog({ workspaceId, onClose, onSaved }) {
  const collection = useCollection("/workspaces"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api.post("/documents/youtube", {
        title: data.get("title"),
        url: data.get("url"),
        workspaceId: data.get("workspace"),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Bring a lecture to your bookshelf"
      description="Import a public YouTube lecture. Gemini creates a time-located transcript of the first 30 minutes; verify it against the video before relying on it."
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        {error && <ErrorNotice message={error} />}{" "}
        {collection.error && (
          <ErrorNotice message={collection.error} retry={collection.reload} />
        )}
        <Input label="Lecture title" name="title" required maxLength={200} />
        <Input
          label="Public YouTube URL"
          name="url"
          type="url"
          required
          maxLength={500}
        />
        <label>
          Workspace
          <select
            name="workspace"
            defaultValue={workspaceId || ""}
            required
            disabled={busy}
          >
            <option value="">Choose a workspace</option>
            {collection.data?.items.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <p className="form-note">
          Import only material you can use. The video URL is sent to Gemini; no
          private or unlisted video support.
        </p>
        <Button type="submit" loading={busy}>
          Import lecture
        </Button>
      </form>
    </Modal>
  );
}
