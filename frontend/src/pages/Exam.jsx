import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useResource } from "../hooks/useResource";
import { api, errorMessage } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import { Loading, ErrorNotice } from "../components/common/Feedback";
import QuizQuestions from "../components/study/QuizQuestions";
function ExamContent({ session }) {
  const [answers, setAnswers] = useState(
      Object.fromEntries(session.answers.map((a) => [a.questionId, a.answer])),
    ),
    [result, setResult] = useState(session.finishedAt ? session : null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState("Your saved answers are restored."),
    [now, setNow] = useState(Date.now());
  const current = useRef(answers),
    queue = useRef(Promise.resolve()),
    autoFinished = useRef(false),
    offset = useRef(new Date(session.serverTime).getTime() - Date.now());
  const deadline = new Date(session.deadline).getTime(),
    remaining = Math.max(
      0,
      Math.ceil((deadline - now - offset.current) / 1000),
    );
  function save() {
    const payload = Object.entries(current.current).map(
      ([questionId, answer]) => ({ questionId, answer }),
    );
    setStatus("Saving answers…");
    queue.current = queue.current
      .catch(() => {})
      .then(() =>
        api.patch(`/exams/${session.id}/answers`, { answers: payload }),
      )
      .then(() => {
        setStatus("Answers saved to your account.");
        setError("");
      })
      .catch((err) => {
        setStatus("Answers have not been saved.");
        setError(errorMessage(err));
        throw err;
      });
    queue.current.catch(() => {});
    return queue.current;
  }
  const finish = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      await queue.current.catch(() => {});
      const res = await api.post(`/exams/${session.id}/finish`);
      setResult(res.data.data);
      setStatus("Exam submitted.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [session.id]);
  useEffect(() => {
    if (result) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [result]);
  useEffect(() => {
    if (!remaining && !result && !autoFinished.current) {
      autoFinished.current = true;
      finish();
    }
  }, [remaining, result, finish]);
  async function submit(e) {
    e.preventDefault();
    if (remaining > 0) {
      try {
        await save();
      } catch {
        return;
      }
    }
    await finish();
  }
  function answer(questionId, value) {
    const next = { ...current.current, [questionId]: value };
    current.current = next;
    setAnswers(next);
    const q = session.questions.find((q) => q.id === questionId);
    if (q.type !== "SHORT_ANSWER") save();
    else
      setStatus("Short answer will save when you leave the field or submit.");
  }
  return (
    <>
      <Link className="back-link" to={`/app/study/quizzes/${session.quizId}`}>
        ← Back to quiz
      </Link>
      <PageHeader eyebrow="EXAM PREPARATION" title={session.title} />
      {error && <ErrorNotice message={error} />}{" "}
      {result ? (
        <section className="quiz-result">
          <h2>
            {result.score} / {result.total} correct
          </h2>
          <p>
            Your result is saved. This timed practice uses the same exact-term
            grading as your quizzes.
          </p>
          {result.results.map((r, i) => (
            <article className="quiz-review" key={r.questionId}>
              <strong>
                {i + 1}. {r.question}
              </strong>
              <p>
                {r.correct ? "Correct" : "Needs revision"} · Your answer:{" "}
                {r.submittedAnswer || "Unanswered"}
              </p>
              <p>Expected answer: {r.correctAnswer}</p>
              <p className="muted">{r.explanation}</p>
            </article>
          ))}
        </section>
      ) : (
        <form className="quiz-form" onSubmit={submit}>
          <div className="exam-clock">
            <strong aria-label="Time remaining">
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </strong>
            <p>
              Time remaining · {Object.values(answers).filter(Boolean).length}/
              {session.total} answered
            </p>
          </div>
          <p className="muted" role="status">
            {status}
          </p>
          <p className="muted">
            Answers save when selected; leave a short-answer field to save it.
            At the deadline, only saved answers are scored. You can reopen this
            session from the quiz.
          </p>
          <QuizQuestions
            questions={session.questions}
            answers={answers}
            onAnswer={answer}
            onBlur={() => {
              if (remaining > 0 && !busy) save();
            }}
            busy={busy || !remaining}
            required={false}
          />
          <Button type="submit" loading={busy}>
            {remaining ? "Submit exam" : "Show result"}
          </Button>
        </form>
      )}
    </>
  );
}
export default function Exam() {
  const { id } = useParams(),
    resource = useResource(`/exams/${id}`);
  if (resource.error)
    return <ErrorNotice message={resource.error} retry={resource.reload} />;
  if (resource.loading || !resource.data) return <Loading />;
  return <ExamContent key={resource.data.id} session={resource.data} />;
}
