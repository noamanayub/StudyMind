import { useState } from "react";
import { api, errorMessage } from "../../services/api";
import { useCollection } from "../../hooks/useCollection";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Input from "../common/Input";
import { ErrorNotice, Loading } from "../common/Feedback";

export default function ShareNoteDialog({ note, onClose }) {
  const shares = useCollection(`/notes/${note.id}/shares`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function invite(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await api.post(`/notes/${note.id}/shares`, {
        email: data.get("email"),
        role: data.get("role"),
      });
      form.reset();
      await shares.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function update(share, patch) {
    try {
      await api.patch(`/notes/${note.id}/shares/${share.id}`, patch);
      await shares.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(share) {
    try {
      await api.delete(`/notes/${note.id}/shares/${share.id}`);
      await shares.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal
      title="Share this note"
      description="Share the note text with an existing Study Mind account. Source documents stay private."
      onClose={onClose}
      busy={busy}
    >
      {error && <ErrorNotice message={error} />}
      <form className="stack-form" onSubmit={invite}>
        <Input
          label="Account email"
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
        />
        <label className="field">
          <span>Access</span>
          <select name="role" defaultValue="VIEWER">
            <option value="VIEWER">Viewer · can read</option>
            <option value="EDITOR">Editor · can read and edit</option>
          </select>
        </label>
        <Button type="submit" loading={busy}>Share note</Button>
      </form>
      <h3>People with access</h3>
      {shares.loading ? (
        <Loading />
      ) : shares.error ? (
        <ErrorNotice message={shares.error} retry={shares.reload} />
      ) : (
        <ul className="share-list">
          {shares.data?.map((share) => (
            <li key={share.id}>
              <div><strong>{share.user.name}</strong><small>{share.user.email}</small></div>
              <select
                aria-label={`Access for ${share.user.name}`}
                value={share.role}
                onChange={(event) => update(share, { role: event.target.value })}
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              <Button variant="secondary" onClick={() => remove(share)}>
                Remove
              </Button>
            </li>
          ))}
          {!shares.data?.length && <li>No one else has access yet.</li>}
        </ul>
      )}
    </Modal>
  );
}
