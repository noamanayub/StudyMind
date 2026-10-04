import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { ErrorNotice } from "../common/Feedback";
import MaterialPicker from "./MaterialPicker";
import { api, errorMessage } from "../../services/api";
const names = {
  summaries: "summary",
  notes: "study notes",
  quizzes: "quiz",
  flashcards: "flashcard deck",
};
export default function GenerateDialog({ kind, documentId, onClose }) {
  const [material, setMaterial] = useState({
    scope: "documents",
    workspaceId: "",
    documentIds: documentId ? [documentId] : [],
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const request = useRef(null),
    navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (material.scope === "documents" && !material.documentIds.length) {
      setError("Choose at least one ready document.");
      return;
    }
    if (material.documentIds.length > 24) {
      setError("Choose up to 24 documents.");
      return;
    }
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    const body = {
      ...material,
      workspaceId: material.workspaceId || undefined,
      ...fields,
    };
    for (const field of ["questionCount", "cardCount"])
      if (body[field]) body[field] = Number(body[field]);
    const fingerprint = JSON.stringify(body);
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() };
    setBusy(true);
    try {
      const endpoint =
        kind === "summaries" ? "summarize" : kind === "quizzes" ? "quiz" : kind;
      const res = await api.post(`/study/${endpoint}`, {
        ...body,
        requestId: request.current.id,
      });
      navigate(`/app/study/${kind}/${res.data.data.id}`);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`Create ${names[kind]}`}
      description="Grounded in your own material, then saved to your study tools."
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        {error && <ErrorNotice message={error} />}
        <MaterialPicker
          value={material}
          onChange={setMaterial}
          disabled={busy}
        />
        <fieldset className="study-options" disabled={busy}>
          {kind === "summaries" && (
            <label>
              Summary format
              <select name="format" defaultValue="QUICK">
                <option value="QUICK">Quick summary</option>
                <option value="DETAILED">Detailed summary</option>
                <option value="KEY_POINTS">Key points</option>
                <option value="EXAM_REVISION">Exam revision</option>
              </select>
            </label>
          )}
          {kind === "quizzes" && (
            <>
              <label>
                Questions
                <select name="questionCount">
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label>
                Question type
                <select name="questionType">
                  <option value="MULTIPLE_CHOICE">Multiple choice</option>
                  <option value="TRUE_FALSE">True / false</option>
                  <option value="SHORT_ANSWER">Short answer</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </label>
              <label>
                Difficulty
                <select name="difficulty" defaultValue="MEDIUM">
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </label>
            </>
          )}
          {kind === "flashcards" && (
            <label>
              Cards
              <select name="cardCount" defaultValue="10">
                {[5, 10, 20, 30].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
        </fieldset>
        {busy && (
          <p role="status">
            Creating your {names[kind]} from the selected material…
          </p>
        )}
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
            Generate and save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
