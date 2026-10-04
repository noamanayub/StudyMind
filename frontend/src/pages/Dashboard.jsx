import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Plus,
  ArrowRight,
  MessageSquare,
  Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/common/PageHeader";
import Companion from "../components/common/Companion";
import Button from "../components/common/Button";
import {
  ErrorNotice,
  EmptyState,
  Loading,
} from "../components/common/Feedback";
import WorkspaceCard from "../components/knowledge/WorkspaceCard";
import DocumentCard from "../components/knowledge/DocumentCard";
import WorkspaceForm from "../components/knowledge/WorkspaceForm";
import UploadDialog from "../components/knowledge/UploadDialog";
import StudyStatistics from "../components/study/StudyStatistics";
export default function Dashboard() {
  const { user } = useAuth();
  const workspaces = useResource("/workspaces?limit=3"),
    documents = useResource("/documents?limit=3", { poll: true }),
    conversations = useResource("/conversations?limit=3");
  const [dialog, setDialog] = useState(null);
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const reload = () => {
    workspaces.reload();
    documents.reload();
  };
  function ask(e) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("question");
    navigate("/app/agent", { state: { question: q } });
  }
  return (
    <>
      <PageHeader
        eyebrow="A FRESH PAGE, EVERY DAY"
        title={`Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}.`}
        description="What will you make sense of today?"
        action={
          <Button
            onClick={() =>
              setDialog(workspaces.data?.items.length ? "upload" : "workspace")
            }
          >
            <Plus size={17} />
            Add material
          </Button>
        }
      />
      <section className="welcome-panel">
        <div>
          <span className="eyebrow">YOUR PERSONAL STUDY COMPANION</span>
          <h2>
            Big questions.
            <br />
            Clearer thinking.
          </h2>
          <p>
            Bring your curiosity. Let’s find the answers
            <br className="desktop-only" /> in your study material.
          </p>
          <form className="quick-ask" onSubmit={ask}>
            <input
              name="question"
              required
              maxLength={8000}
              aria-label="Ask Study Mind"
              placeholder="What’s on your mind?"
            />
            <button aria-label="Ask Study Mind" type="submit">
              <ArrowUpRight size={22} />
            </button>
          </form>
        </div>
        <Companion decorative />
        <span className="welcome-label">A LITTLE HELP GOES A LONG WAY.</span>
      </section>
      <section className="dashboard-section">
        <div className="section-title">
          <h2>Your learning spaces</h2>
          <Link className="text-link" to="/app/knowledge">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        {workspaces.error ? (
          <ErrorNotice message={workspaces.error} retry={workspaces.reload} />
        ) : workspaces.loading ? (
          <Loading />
        ) : workspaces.data?.items.length ? (
          <div className="workspace-grid">
            {workspaces.data.items.map((w) => (
              <WorkspaceCard key={w.id} workspace={w} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Every idea needs a place to start"
            action={
              <Button onClick={() => setDialog("workspace")}>
                <Plus size={16} />
                Create a workspace
              </Button>
            }
          >
            Make a workspace for your first subject, then add your notes.
          </EmptyState>
        )}
      </section>
      <section className="dashboard-section">
        <div className="section-title">
          <h2>Fresh on your bookshelf</h2>
          <Link className="text-link" to="/app/knowledge">
            All documents <ArrowRight size={16} />
          </Link>
        </div>
        {documents.error ? (
          <ErrorNotice message={documents.error} retry={documents.reload} />
        ) : documents.loading ? (
          <Loading />
        ) : documents.data?.items.length ? (
          <div className="document-grid">
            {documents.data.items.map((d) => (
              <DocumentCard key={d.id} document={d} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Upload}
            title="Your knowledge starts with your material"
          >
            Upload a lecture, reading, or note to give Study Mind something to
            explore.
          </EmptyState>
        )}
      </section>
      <section className="dashboard-section">
        <div className="section-title">
          <h2>Pick up the conversation</h2>
          <Link className="text-link" to="/app/history">
            View history <ArrowRight size={16} />
          </Link>
        </div>
        {conversations.error ? (
          <ErrorNotice
            message={conversations.error}
            retry={conversations.reload}
          />
        ) : conversations.data?.items.length ? (
          <div className="recent-conversations">
            {conversations.data.items.map((c) => (
              <Link to={`/app/agent/${c.id}`} key={c.id}>
                <MessageSquare size={20} />
                <span>
                  <strong>{c.title}</strong>
                  <small>
                    {c.workspace?.name || "Your knowledge"} ·{" "}
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </small>
                </span>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">
            No conversations yet. Your first question is a good place to start.
          </p>
        )}
      </section>
      <StudyStatistics />
      {dialog === "workspace" && (
        <WorkspaceForm onClose={() => setDialog(null)} onSaved={reload} />
      )}
      {dialog === "upload" && (
        <UploadDialog onClose={() => setDialog(null)} onSaved={reload} />
      )}
    </>
  );
}
