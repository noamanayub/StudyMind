import { useState } from "react";
import {
  BookOpen,
  Code,
  FlaskConical,
  Brain,
  Globe,
  Folder,
} from "lucide-react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { ErrorNotice } from "../common/Feedback";
import { api, errorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
export const workspaceIcons = {
  book: BookOpen,
  code: Code,
  science: FlaskConical,
  brain: Brain,
  globe: Globe,
  folder: Folder,
};
export default function WorkspaceForm({ workspace, onClose, onSaved }) {
  const [icon, setIcon] = useState(workspace?.icon || "book"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const toast = useToast();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = { ...Object.fromEntries(new FormData(e.currentTarget)), icon };
    try {
      const response = workspace
        ? await api.patch(`/workspaces/${workspace.id}`, data)
        : await api.post("/workspaces", data);
      toast(workspace ? "Workspace updated." : "Your new workspace is ready.");
      onSaved(response.data.data);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={workspace ? "Edit your workspace" : "Make room for a subject"}
      description="A home for related documents and conversations."
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        {error && <ErrorNotice message={error} />}
        <Input
          label="Workspace name"
          name="name"
          defaultValue={workspace?.name}
          required
          maxLength={100}
          placeholder="e.g. Database Systems"
          autoFocus
        />
        <Input
          label="Description (optional)"
          name="description"
          defaultValue={workspace?.description}
          maxLength={500}
          placeholder="What are you exploring?"
        />
        <fieldset className="icon-picker">
          <legend>Choose an icon</legend>
          {Object.entries(workspaceIcons).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              aria-label={key}
              aria-pressed={icon === key}
              onClick={() => setIcon(key)}
            >
              <Icon size={22} />
            </button>
          ))}
        </fieldset>
        <div className="modal-actions">
          <Button
            variant="secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button loading={busy} type="submit">
            {workspace ? "Save changes" : "Create workspace"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
