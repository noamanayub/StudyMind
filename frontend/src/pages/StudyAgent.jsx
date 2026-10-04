import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp,
  X,
  BookOpen,
  MessageSquare,
  Settings,
  UserRound,
  FileText,
  Library,
} from "lucide-react";
import { useResource } from "../hooks/useResource";
import { useCollection } from "../hooks/useCollection";
import { api, errorMessage, get } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Companion from "../components/common/Companion";
import Button from "../components/common/Button";
import { ErrorNotice, Loading } from "../components/common/Feedback";
import SourceCard from "../components/chat/SourceCard";
import VoiceControls from "../components/chat/VoiceControls";
export default function StudyAgent() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initial = location.state || {};
  const [draft, setDraft] = useState(initial.question || ""),
    [scope, setScope] = useState(initial.documentIds ? "documents" : "all"),
    [workspaceId, setWorkspaceId] = useState(""),
    [documentIds, setDocumentIds] = useState(initial.documentIds || []),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState(""),
    [error, setError] = useState(""),
    [loadingOlder, setLoadingOlder] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [dictationTarget, setDictationTarget] = useState(null);
  const sessionsMenu = useRef(null);
  const resource = useResource(id ? `/conversations/${id}?limit=100` : null),
    sessions = useCollection("/conversations"),
    workspaces = useCollection("/workspaces"),
    documents = useCollection("/documents?ready=true");
  const end = useRef(),
    input = useRef(),
    retryRequest = useRef(null),
    activeConversation = useRef(id);
  useEffect(() => {
    if (!sessionsOpen) return undefined;
    function closeOutside(event) {
      if (!sessionsMenu.current?.contains(event.target)) setSessionsOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setSessionsOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [sessionsOpen]);
  const messages = resource.data?.messages || [];
  useEffect(() => {
    if (activeConversation.current !== id) {
      setBusy(false);
      setPending("");
      retryRequest.current = null;
    }
    activeConversation.current = id;
  }, [id]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);
  useEffect(
    () => () => {
      activeConversation.current = null;
    },
    [],
  );
  useEffect(() => {
    setError("");
    if (!id) {
      setDraft(location.state?.question || "");
      setScope(location.state?.documentIds ? "documents" : "all");
      setDocumentIds(location.state?.documentIds || []);
    }
  }, [id, location.key, location.state]);
  async function send(generalKnowledge = false, text = draft) {
    const content = text.trim();
    if (!content || busy) return;
    if (
      !id &&
      ((scope === "workspace" && !workspaceId) ||
        (scope === "documents" && !documentIds.length))
    ) {
      setError("Choose material for this conversation first.");
      return;
    }
    setBusy(true);
    setPending(content);
    setError("");
    let conversationId = id;
    const previous = retryRequest.current;
    const requestId =
      previous?.content === content &&
      previous?.generalKnowledge === generalKnowledge
        ? previous.requestId
        : crypto.randomUUID();
    retryRequest.current = { content, generalKnowledge, requestId };
    try {
      if (!conversationId) {
        const response = await api.post("/conversations", {
          scope,
          workspaceId: workspaceId || undefined,
          documentIds,
        });
        conversationId = response.data.data.id;
        activeConversation.current = conversationId;
        sessions.reload();
        navigate(`/app/agent/${conversationId}`, { replace: true });
      }
      await api.post(`/conversations/${conversationId}/messages`, {
        content,
        generalKnowledge,
        requestId,
      });
      const saved = await get(`/conversations/${conversationId}?limit=100`);
      if (activeConversation.current === conversationId) {
        setDraft("");
        retryRequest.current = null;
        resource.setData(saved);
      }
    } catch (e) {
      if (activeConversation.current === conversationId) {
        setError(errorMessage(e));
        setDraft(content);
      }
    } finally {
      if (activeConversation.current === conversationId) {
        setBusy(false);
        setPending("");
        input.current?.focus();
      }
    }
  }
  async function older() {
    setLoadingOlder(true);
    try {
      const data = await get(
        `/conversations/${id}?limit=100&before=${encodeURIComponent(messages[0].createdAt)}`,
      );
      resource.setData({
        ...resource.data,
        messages: [...data.messages, ...messages],
        hasMore: data.hasMore,
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingOlder(false);
    }
  }
  const activeScope = resource.data?.scope || scope;
  return (
    <div className="study-agent">
      <header className="chat-heading">
        <button className="button button-secondary chat-back" onClick={() => navigate("/app")}>
          <ArrowLeft size={19} />
          Back
        </button>
        <div className="chat-heading-brand">
          <span className="chat-brand-icon">
            <BookOpen size={22} />
          </span>
          <div className="chat-heading-brand-copy">
            <h1>Study Agent</h1>
            <p>Your material. A new perspective.</p>
          </div>
        </div>
        <div className="chat-heading-actions" ref={sessionsMenu}>
          <Link
            className="button button-secondary chat-account-toggle"
            to="/app/settings"
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={18} />
          </Link>
          <Link
            className="button button-secondary chat-account-toggle"
            to="/app/profile"
            aria-label="My profile"
            title="My profile"
          >
            <UserRound size={18} />
          </Link>
          <button
            className="button button-secondary chat-sessions-toggle"
            aria-label={sessionsOpen ? "Close conversations" : "Open conversations"}
            aria-expanded={sessionsOpen}
            aria-controls="chat-sessions"
            onClick={() => setSessionsOpen((open) => !open)}
          >
            {sessionsOpen ? <X size={18} /> : <MessageSquare size={18} />}
          </button>
          {sessionsOpen && (
            <div className="chat-sessions" id="chat-sessions" role="region" aria-label="Saved conversations" data-lenis-prevent>
              <div className="chat-sessions-heading">
                <h2>Conversations</h2>
                <button className="icon-button" aria-label="Close conversations" onClick={() => setSessionsOpen(false)}><X size={18} /></button>
              </div>
              {sessions.loading ? <Loading text="Loading conversations…" /> : sessions.error ? <ErrorNotice message={sessions.error} retry={sessions.reload} /> : sessions.data?.items.length ? (
                <nav className="chat-session-list" aria-label="Conversation sessions">
                  {sessions.data.items.map((session) => (
                    <Link key={session.id} to={`/app/agent/${session.id}`} aria-current={session.id === id ? "page" : undefined} onClick={() => setSessionsOpen(false)}>
                      <MessageSquare size={16} />
                      <span><strong>{session.title}</strong><small>{new Date(session.updatedAt).toLocaleDateString()}</small></span>
                    </Link>
                  ))}
                </nav>
              ) : <p className="chat-sessions-empty">Your saved conversations will appear here.</p>}
            </div>
          )}
        </div>
      </header>
      {(resource.error || workspaces.error || documents.error) && (
        <ErrorNotice
          message={resource.error || workspaces.error || documents.error}
          retry={() => {
            resource.reload();
            workspaces.reload();
            documents.reload();
          }}
        />
      )}
      <div className="chat-scroll" aria-label="Conversation" data-lenis-prevent>
        {resource.loading && id && !resource.data ? (
          <Loading text="Opening your conversation…" />
        ) : !messages.length && !busy ? (
          <div className="chat-intro">
            <Companion decorative />
            <p className="eyebrow">HELLO, CURIOUS MIND.</p>
            <h2>What shall we figure out?</h2>
            <p>
              Ask a question about your study material.
              <br />
              We’ll find the connections, together.
            </p>
            <div className="suggested-prompts">
              {[
                "Explain a concept from my notes",
                "Compare ideas across my documents",
                "Help me understand this lecture",
              ].map((text, i) => (
                <button
                  key={text}
                  onClick={() => {
                    setDraft(text);
                    input.current?.focus();
                  }}
                >
                  {i === 0 ? (
                    <BookOpen size={17} />
                  ) : i === 1 ? (
                    <Library size={17} />
                  ) : (
                    <MessageSquare size={17} />
                  )}
                  <span>{text}</span>
                </button>
              ))}
            </div>
            {documents.data?.total === 0 && (
              <p className="chat-empty-help">
                <FileText size={15} />
                Start by{" "}
                <Link to="/app/knowledge">adding your first document</Link>.
              </p>
            )}
          </div>
        ) : (
          <div className="messages">
            {resource.data?.hasMore && (
              <Button
                variant="secondary"
                onClick={older}
                loading={loadingOlder}
              >
                Load earlier messages
              </Button>
            )}
            {messages.map((message, index) => (
              <article
                className={`message ${message.role.toLowerCase()}`}
                key={message.id}
              >
                <span className="message-avatar">
                  {message.role === "USER" ? (
                    user.name.slice(0, 1)
                  ) : (
                    <BookOpen size={17} />
                  )}
                </span>
                <div className="message-body">
                  <div className="message-author">
                    {message.role === "USER" ? "You" : "Study Mind"}
                    {message.generalKnowledge && (
                      <span className="general-label">
                        General knowledge · Not from your documents
                      </span>
                    )}
                  </div>
                  <div className="message-content">{message.content}</div>
                  {message.sources?.length > 0 && (
                    <div className="message-sources">
                      <p className="eyebrow">FROM YOUR MATERIAL</p>
                <div data-lenis-prevent>
                        {message.sources.map((s) => (
                          <SourceCard source={s} key={s.id} />
                        ))}
                      </div>
                    </div>
                  )}
                  {message.insufficientEvidence && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        send(true, messages[index - 1]?.content || "")
                      }
                    >
                      Ask using general knowledge
                    </Button>
                  )}
                </div>
              </article>
            ))}
            {busy && (
              <>
                <article className="message user">
                  <span className="message-avatar">
                    {user.name.slice(0, 1)}
                  </span>
                  <div className="message-body">
                    <div className="message-author">You</div>
                    <div className="message-content">{pending}</div>
                  </div>
                </article>
                <div className="thinking" role="status">
                  <BookOpen size={17} />
                  <span>Finding the connections in your material…</span>
                </div>
              </>
            )}
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="chat-composer-area">
        <div className="chat-scope">
          <Library size={16} />
          {id ? (
            <span>
              {activeScope === "all"
                ? "All my knowledge"
                : activeScope === "workspace"
                  ? "Selected workspace"
                  : "Selected documents"}{" "}
              <span className="muted">· Scope saved with this conversation</span>
            </span>
          ) : (
            <>
              <label className="sr-only" htmlFor="chat-scope">
                Conversation material
              </label>
              <select
                id="chat-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                disabled={busy}
              >
                <option value="all">All my knowledge</option>
                <option value="workspace">A workspace</option>
                <option value="documents">Specific documents</option>
              </select>
              {scope === "workspace" && (
                <select
                  aria-label="Choose workspace"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                >
                  <option value="">Select workspace</option>
                  {workspaces.data?.items.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
              {scope === "documents" && (
                <details className="document-picker">
                  <summary>
                    {documentIds.length
                      ? `${documentIds.length} selected`
                      : "Select ready documents"}
                  </summary>
                  <div>
                    {documents.data?.items.length ? (
                      documents.data.items.map((d) => (
                        <label key={d.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={documentIds.includes(d.id)}
                            onChange={(e) =>
                              setDocumentIds((ids) =>
                                e.target.checked
                                  ? [...ids, d.id]
                                  : ids.filter((x) => x !== d.id),
                              )
                            }
                          />
                          {d.originalName}
                        </label>
                      ))
                    ) : (
                      <p>No ready documents. Upload material first.</p>
                    )}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
        <VoiceControls
          key={id || "new"}
          disabled={busy}
          dictationTarget={dictationTarget}
          onTranscript={(text) =>
            setDraft((value) =>
              `${value}${value ? " " : ""}${text}`.slice(0, 8000),
            )
          }
          reply={messages.findLast((m) => m.role === "ASSISTANT")?.content}
        />
        {error && <ErrorNotice message={error} />}
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div className="chat-prompt-field">
            <textarea
              ref={input}
              rows={2}
              aria-label="Your question"
              placeholder="Ask from your study material…"
              maxLength={8000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <span className="chat-dictation-slot" ref={setDictationTarget} />
          </div>
          <Button
            type="submit"
            disabled={!draft.trim() || busy}
            aria-label="Send question"
          >
            <ArrowUp size={21} />
          </Button>
        </form>
        <p className="composer-note">
          Grounded in your notes. Always worth a second look.{" "}
          <span>Enter to send · Shift + Enter for a new line</span>
        </p>
      </div>
    </div>
  );
}
