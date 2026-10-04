import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { BookOpen, NotebookPen, ListChecks, Layers, Plus } from "lucide-react";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import {
  ErrorNotice,
  Loading,
  EmptyState,
  Pagination,
} from "../components/common/Feedback";
import GenerateDialog from "../components/study/GenerateDialog";
import ContentEditor from "../components/study/ContentEditor";
const tabs = [
  ["summaries", "Summaries", BookOpen],
  ["notes", "Study notes", NotebookPen],
  ["quizzes", "Quizzes", ListChecks],
  ["flashcards", "Flashcards", Layers],
];
export default function StudyTools() {
  const [params] = useSearchParams(),
    navigate = useNavigate();
  const tab = tabs.some(([key]) => key === params.get("tab"))
    ? params.get("tab")
    : "summaries";
  const [page, setPage] = useState(1),
    [sharedPage, setSharedPage] = useState(1),
    [dialog, setDialog] = useState(null);
  const resource = useResource(`/${tab}?page=${page}&limit=12`),
    shared = useResource(
      tab === "notes" ? `/notes/shared?page=${sharedPage}&limit=12` : null,
    );
  const [, label, Icon] = tabs.find(([key]) => key === tab);
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE PRACTICE. A CLEARER MIND."
        title="Your study tools"
        description="Turn your material into something you can come back to."
        action={
          <Button onClick={() => setDialog("generate")}>
            <Plus size={17} />
            Create{" "}
            {tab === "flashcards"
              ? "deck"
              : tab === "quizzes"
                ? "quiz"
                : tab === "notes"
                  ? "notes"
                  : "summary"}
          </Button>
        }
      />
      <nav className="study-tabs" aria-label="Study tools">
        {tabs.map(([key, title, TabIcon]) => (
          <Link
            key={key}
            to={`/app/study?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            onClick={() => setPage(1)}
          >
            <TabIcon size={18} />
            {title}
          </Link>
        ))}
      </nav>
      <div className="section-title">
        <h2>{label}</h2>
        {tab === "notes" && (
          <Button variant="secondary" onClick={() => setDialog("write")}>
            <NotebookPen size={16} />
            Write a note
          </Button>
        )}
      </div>
      {resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.reload} />
      ) : resource.loading ? (
        <Loading />
      ) : resource.data?.items.length ? (
        <div className="study-resource-grid">
          {resource.data.items.map((record) => (
            <Link
              className="study-resource-card"
              key={record.id}
              to={`/app/study/${tab}/${record.id}`}
            >
              <span className="workspace-icon">
                <Icon size={22} />
              </span>
              <h3>{record.title}</h3>
              <p>
                {tab === "quizzes"
                  ? `${record.questionCount} questions · ${record.difficulty.toLowerCase()} · ${record._count.attempts} attempts`
                  : tab === "flashcards"
                    ? `${record._count.cards} cards`
                    : record.format.replaceAll("_", " ").toLowerCase()}
              </p>
              <small>
                {new Date(
                  record.updatedAt || record.createdAt,
                ).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </small>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Icon}
          title={`Your ${label.toLowerCase()} start here`}
          action={
            <Button
              onClick={() => setDialog(tab === "notes" ? "write" : "generate")}
            >
              {tab === "notes"
                ? "Write a note"
                : `Create ${tab === "flashcards" ? "a deck" : tab === "quizzes" ? "a quiz" : "a summary"}`}
            </Button>
          }
        >
          Choose your own material to create a resource. Everything you save
          stays here.
        </EmptyState>
      )}
      <Pagination data={resource.data} page={page} setPage={setPage} />
      {tab === "notes" && (
        <section className="shared-notes-section">
          <div className="section-title"><h2>Shared with you</h2></div>
          {shared.error ? (
            <ErrorNotice message={shared.error} retry={shared.reload} />
          ) : shared.loading ? (
            <Loading />
          ) : shared.data?.items.length ? (
            <>
              <div className="study-resource-grid">
                {shared.data.items.map((record) => (
                  <Link className="study-resource-card" key={record.id} to={`/app/study/notes/${record.id}`}>
                    <span className="workspace-icon"><NotebookPen size={22} /></span>
                    <h3>{record.title}</h3>
                    <p>Shared by {record.sharedBy} · {record.shareRole.toLowerCase()}</p>
                    <small>{new Date(record.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</small>
                  </Link>
                ))}
              </div>
              <Pagination data={shared.data} page={sharedPage} setPage={setSharedPage} />
            </>
          ) : (
            <p className="muted">Notes shared with you will appear here.</p>
          )}
        </section>
      )}
      {dialog === "generate" && (
        <GenerateDialog
          kind={tab}
          documentId={params.get("documentId")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "write" && (
        <ContentEditor
          onClose={() => setDialog(null)}
          onSaved={(record) => navigate(`/app/study/notes/${record.id}`)}
        />
      )}
    </>
  );
}
