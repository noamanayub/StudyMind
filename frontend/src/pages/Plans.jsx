import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Plus, Check, Trash2 } from "lucide-react";
import { useResource } from "../hooks/useResource";
import { useCollection } from "../hooks/useCollection";
import { api, errorMessage } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  Loading,
  ErrorNotice,
  EmptyState,
  Pagination,
} from "../components/common/Feedback";
const targets = {
  DOCUMENT: "documents",
  QUIZ: "study/quizzes",
  FLASHCARDS: "study/flashcards",
  NOTES: "study/notes",
};
function CreatePlan({ onClose, onSaved }) {
  const documents = useCollection("/documents?ready=true"),
    quizzes = useCollection("/quizzes"),
    decks = useCollection("/flashcards"),
    notes = useCollection("/notes");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lists = [
      ["DOCUMENT", documents],
      ["QUIZ", quizzes],
      ["FLASHCARDS", decks],
      ["NOTES", notes],
    ],
    today = new Date().toLocaleDateString("en-CA");
  async function save(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api.post("/plans", {
        title: data.get("title"),
        startDate: data.get("start"),
        examDate: data.get("exam"),
        dailyMinutes: Number(data.get("minutes")),
        materials: data.getAll("material").map((v) => {
          const [kind, id] = v.split(":");
          return { kind, id };
        }),
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
      title="Make room for revision"
      description="Build a daily rotation from your saved material. One focused task each day, up to the day before your exam. No AI generation is needed."
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={save}>
        {error && <ErrorNotice message={error} />}
        <Input label="Plan title" name="title" maxLength={160} required />
        <div className="plan-date-fields">
          <Input
            label="First study day"
            name="start"
            type="date"
            defaultValue={today}
            required
          />
          <Input label="Exam date" name="exam" type="date" required />
        </div>
        <Input
          label="Daily study minutes"
          name="minutes"
          type="number"
          min="10"
          max="180"
          defaultValue="30"
          required
        />
        <fieldset className="plan-materials" disabled={busy} data-lenis-prevent>
          <legend>Choose material (up to 30)</legend>
          {lists.map(([kind, collection]) => (
            <div key={kind}>
              {collection.error ? (
                <ErrorNotice
                  message={collection.error}
                  retry={collection.reload}
                />
              ) : !collection.data ? (
                <Loading />
              ) : (
                collection.data.items.map((item) => (
                  <label className="scope-document" key={item.id}>
                    <input
                      type="checkbox"
                      name="material"
                      value={`${kind}:${item.id}`}
                    />
                    <span>
                      {item.title || item.originalName}
                      <small>{kind.toLowerCase()}</small>
                    </span>
                  </label>
                ))
              )}
            </div>
          ))}
        </fieldset>
        <Button type="submit" loading={busy}>
          Save study plan
        </Button>
      </form>
    </Modal>
  );
}
export default function Plans() {
  const [page, setPage] = useState(1),
    resource = useResource(`/plans?limit=10&page=${page}`),
    [create, setCreate] = useState(false),
    [remove, setRemove] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(null);
  async function toggle(planId, task) {
    setBusy(task.id);
    setError("");
    try {
      await api.patch(`/plans/${planId}/tasks/${task.id}`, {
        completed: !task.completedAt,
      });
      resource.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }
  async function exportCalendar(plan) {
    setBusy(plan.id);
    setError("");
    try {
      const response = await api.get(`/plans/${plan.id}/calendar`, {
          responseType: "blob",
        }),
        url = URL.createObjectURL(response.data),
        link = document.createElement("a");
      link.href = url;
      link.download = "study-plan.ics";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE EVERY DAY"
        title="Your study rhythm"
        description="A realistic plan, a focused session, and one less thing to remember."
        action={
          <Button onClick={() => setCreate(true)}>
            <Plus size={17} />
            New study plan
          </Button>
        }
      />
      <Link className="text-link" to="/app/review">
        Review cards due today →
      </Link>
      {error && <ErrorNotice message={error} />}{" "}
      {resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.reload} />
      ) : resource.loading ? (
        <Loading />
      ) : !resource.data?.items.length ? (
        <EmptyState icon={CalendarDays} title="Start with a small daily habit">
          Choose saved notes, documents, quizzes or decks and give revision a
          place in your week.
        </EmptyState>
      ) : (
        resource.data.items.map((plan) => (
          <section className="plan-section" key={plan.id}>
            <div className="section-title">
              <div>
                <h2>{plan.title}</h2>
                <p className="muted">
                  Exam {plan.examDate.slice(0, 10)} · {plan.dailyMinutes}{" "}
                  minutes a day ·{" "}
                  {plan.tasks.filter((t) => t.completedAt).length}/
                  {plan.tasks.length} complete
                </p>
              </div>
              <div className="resource-actions">
                <Button
                  variant="secondary"
                  disabled={busy === plan.id}
                  onClick={() => exportCalendar(plan)}
                >
                  Export calendar
                </Button>
                <Button variant="secondary" onClick={() => setRemove(plan)}>
                  <Trash2 size={16} />
                  Delete plan
                </Button>
              </div>
            </div>
            <ol className="plan-task-list">
              {plan.tasks.map((task) => (
                <li
                  key={task.id}
                  className={task.completedAt ? "is-complete" : ""}
                >
                  <button
                    type="button"
                    className="task-check"
                    disabled={busy === task.id}
                    aria-label={`${task.completedAt ? "Mark incomplete" : "Complete"}: ${task.title} on ${task.date.slice(0, 10)}`}
                    aria-pressed={!!task.completedAt}
                    onClick={() => toggle(plan.id, task)}
                  >
                    {task.completedAt && <Check size={18} />}
                  </button>
                  <time dateTime={task.date.slice(0, 10)}>
                    {task.date.slice(0, 10)}
                  </time>
                  <Link to={`/app/${targets[task.kind]}/${task.resourceId}`}>
                    {task.title}
                  </Link>
                  <span>{task.minutes} min</span>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
      {!resource.loading && !resource.error && resource.data && (
        <Pagination data={resource.data} page={page} setPage={setPage} />
      )}
      {create && (
        <CreatePlan
          onClose={() => setCreate(false)}
          onSaved={resource.reload}
        />
      )}{" "}
      {remove && (
        <ConfirmDialog
          title="Delete study plan?"
          description="Your saved material stays in your library. This removes only the plan and its tasks."
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await api.delete(`/plans/${remove.id}`);
            resource.reload();
          }}
        />
      )}
    </>
  );
}
