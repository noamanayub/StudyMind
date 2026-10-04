import { useId, useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { ErrorNotice } from "../common/Feedback";
import { api, errorMessage } from "../../services/api";
export default function ContentEditor({
  record,
  endpoint = "/notes",
  onSaved,
  onClose,
}) {
  const id = useId(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      const result = record
        ? await api.patch(`${endpoint}/${record.id}`, values)
        : await api.post(endpoint, values);
      onSaved(result.data.data);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={record ? "Edit your study resource" : "Write a study note"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={save}>
        {error && <ErrorNotice message={error} />}
        <Input
          label="Title"
          name="title"
          required
          maxLength={160}
          defaultValue={record?.title || ""}
        />
        <div className="field">
          <label htmlFor={id}>Study content</label>
          <textarea
            id={id}
            name="content"
            required
            maxLength={50000}
            rows={12}
            defaultValue={record?.content || ""}
          />
        </div>
        <p className="muted">
          Your edits are saved as personal study content. Original source
          references are retained for checking.
        </p>
        <div className="modal-actions">
          <Button
            variant="secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {record?.kind === "SUMMARY" ? "Save summary" : "Save note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
