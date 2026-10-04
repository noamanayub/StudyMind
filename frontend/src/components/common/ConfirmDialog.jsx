import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { ErrorNotice } from "./Feedback";
import { errorMessage } from "../../services/api";
export default function ConfirmDialog({
  title,
  description,
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={title}
      description={description}
      onClose={onClose}
      busy={busy}
    >
      {error && <ErrorNotice message={error} />}
      <div className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Keep it
        </Button>
        <Button loading={busy} onClick={confirm}>
          Delete permanently
        </Button>
      </div>
    </Modal>
  );
}
