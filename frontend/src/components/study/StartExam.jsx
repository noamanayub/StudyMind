import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { ErrorNotice } from "../common/Feedback";
import { api, errorMessage } from "../../services/api";
export default function StartExam({ quizId, onClose }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    navigate = useNavigate(),
    request = useRef(crypto.randomUUID());
  async function start(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/exams", {
        quizId,
        requestId: request.current,
        durationMinutes: Number(form.get("duration")),
      });
      navigate(`/app/exams/${res.data.data.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Start timed practice"
      description="Your answers are saved to this account. The server enforces the deadline; unanswered questions score zero. This is personal exam practice, not a proctored assessment."
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={start}>
        {error && <ErrorNotice message={error} />}
        <Input
          label="Time limit in minutes"
          name="duration"
          type="number"
          min="1"
          max="180"
          defaultValue="15"
          required
        />
        <Button type="submit" loading={busy}>
          Start exam
        </Button>
      </form>
    </Modal>
  );
}
