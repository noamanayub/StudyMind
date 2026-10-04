import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import Modal from "../common/Modal";
import ConfirmDialog from "../common/ConfirmDialog";
import Input from "../common/Input";
import Button from "../common/Button";
import { ErrorNotice } from "../common/Feedback";
import { api, errorMessage } from "../../services/api";
export default function ResourceActions({ record, endpoint, tab, onChange }) {
  const [dialog, setDialog] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function rename(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`${endpoint}/${record.id}`, {
        title: new FormData(e.currentTarget).get("title"),
      });
      onChange();
      setDialog(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="resource-actions">
      <Button
        variant="secondary"
        onClick={() => {
          setError("");
          setDialog("rename");
        }}
      >
        <Pencil size={16} />
        Rename
      </Button>
      <Button variant="secondary" onClick={() => setDialog("delete")}>
        <Trash2 size={16} />
        Delete
      </Button>
      {dialog === "rename" && (
        <Modal
          title="Rename study resource"
          onClose={() => setDialog(null)}
          busy={busy}
        >
          <form onSubmit={rename}>
            {error && <ErrorNotice message={error} />}
            <Input
              label="Resource title"
              name="title"
              required
              maxLength={160}
              defaultValue={record.title}
            />
            <Button loading={busy} type="submit">
              Save name
            </Button>
          </form>
        </Modal>
      )}
      {dialog === "delete" && (
        <ConfirmDialog
          title="Delete this study resource?"
          description="This removes the saved resource and its review or attempt history. Your source documents stay in your library."
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await api.delete(`${endpoint}/${record.id}`);
            navigate(`/app/study?tab=${tab}`);
          }}
        />
      )}
    </div>
  );
}
