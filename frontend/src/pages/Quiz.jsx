import { useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useResource } from "../hooks/useResource";
import { api, errorMessage } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import { ErrorNotice, Loading } from "../components/common/Feedback";
import ResourceActions from "../components/study/ResourceActions";
import StudySources from "../components/study/StudySources";
import QuizQuestions from "../components/study/QuizQuestions";
import StartExam from "../components/study/StartExam";
export default function Quiz() {
  const { id } = useParams(),
    resource = useResource(`/quizzes/${id}`);
  const [answers, setAnswers] = useState({}),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const attempt = useRef(null);
  const [examOpen, setExamOpen] = useState(false);
  const exams = useResource("/exams?limit=100");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (!attempt.current) attempt.current = crypto.randomUUID();
    try {
      const response = await api.post(`/quizzes/${id}/attempts`, {
        requestId: attempt.current,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      });
      setResult(response.data.data);
      resource.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (resource.error)
    return <ErrorNotice message={resource.error} retry={resource.reload} />;
  if (resource.loading || !resource.data) return <Loading />;
  const quiz = resource.data;
  return (
    <>
      <Link className="back-link" to="/app/study?tab=quizzes">
        ← Your quizzes
      </Link>
      <PageHeader
        eyebrow={`${quiz.difficulty} · ${quiz.questionCount} QUESTIONS`}
        title={quiz.title}
        action={
          <ResourceActions
            record={quiz}
            endpoint="/quizzes"
            tab="quizzes"
            onChange={resource.reload}
          />
        }
      />
      {error && <ErrorNotice message={error} />}
      <div className="exam-access">
        <Button variant="secondary" onClick={() => setExamOpen(true)}>
          Timed exam practice
        </Button>
        {exams.data?.items
          .filter((e) => e.quizId === id)
          .slice(0, 5)
          .map((e) => (
            <Link key={e.id} to={`/app/exams/${e.id}`}>
              {e.finishedAt
                ? `Result: ${e.score}/${e.total}`
                : "Reopen timed session"}
            </Link>
          ))}
      </div>
      {examOpen && <StartExam quizId={id} onClose={() => setExamOpen(false)} />}
      {result ? (
        <section className="quiz-result" aria-live="polite">
          <p className="eyebrow">A LITTLE MORE UNDERSTANDING</p>
          <h2>
            {result.score} / {result.total} correct
          </h2>
          <p>
            Short answers match the accepted terms, ignoring case, spacing and
            final punctuation. Compare the expected answer below when your
            wording differs.
          </p>
          {result.results.map((r, index) => (
            <article className="quiz-review" key={r.questionId}>
              <strong>
                {index + 1}. {r.question}
              </strong>
              <p>
                {r.correct ? "Correct" : "Needs another look"} · Your answer:{" "}
                {r.submittedAnswer}
              </p>
              <p>
                <strong>Expected answer:</strong> {r.correctAnswer}
              </p>
              <p className="muted">{r.explanation}</p>
            </article>
          ))}
          <Button
            onClick={() => {
              setResult(null);
              setAnswers({});
              attempt.current = null;
            }}
          >
            Try again
          </Button>
        </section>
      ) : (
        <form className="quiz-form" onSubmit={submit}>
          <p className="muted">
            Answer every question, then submit to see your score and
            explanations. Short answers should be concise terms.
          </p>
          <QuizQuestions
            questions={quiz.questions}
            answers={answers}
            busy={busy}
            onAnswer={(questionId, answer) =>
              setAnswers({ ...answers, [questionId]: answer })
            }
          />
          <Button loading={busy} type="submit">
            Submit quiz
          </Button>
        </form>
      )}
      {!!quiz.attempts.length && (
        <section className="study-sources">
          <h2>Previous attempts</h2>
          <div className="attempt-list">
            {quiz.attempts.map((a) => (
              <Button
                key={a.id}
                variant="secondary"
                onClick={() => setResult(a)}
              >
                {a.score}/{a.total} · {new Date(a.createdAt).toLocaleString()}
              </Button>
            ))}
          </div>
        </section>
      )}
      {(result || quiz.attempts.length > 0) && <StudySources record={quiz} />}
    </>
  );
}
