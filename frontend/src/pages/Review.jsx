import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import { useResource } from "../hooks/useResource";
import { api, errorMessage } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import {
  Loading,
  ErrorNotice,
  EmptyState,
} from "../components/common/Feedback";
export default function Review() {
  const resource = useResource("/flashcards/due?limit=100"),
    [done, setDone] = useState([]),
    [flipped, setFlipped] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(null),
    request = useRef(null);
  const cards = resource.data?.items.filter((c) => !done.includes(c.id)) || [],
    card = cards[0];
  async function rate(rating) {
    if (!request.current) request.current = { id: crypto.randomUUID(), rating };
    setBusy(true);
    setError("");
    try {
      const res = await api.post(
        `/flashcards/${card.deck.id}/cards/${card.id}/reviews`,
        { requestId: request.current.id, rating: request.current.rating },
      );
      setSaved(res.data.data.card.dueAt);
      setDone([...done, card.id]);
      setFlipped(false);
      request.current = null;
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="REMEMBER FOR LONGER"
        title="A little review, right on time"
        description="Reveal the answer, then tell us how it felt. Your next review is scheduled from that rating."
      />
      {error && <ErrorNotice message={error} />}{" "}
      {saved && (
        <p role="status" className="muted">
          Review saved. That card returns {new Date(saved).toLocaleString()}.
        </p>
      )}
      {resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.reload} />
      ) : resource.loading ? (
        <Loading />
      ) : !card ? (
        <EmptyState
          icon={Layers}
          title={
            done.length ? "Today’s review is complete" : "Nothing due right now"
          }
        >
          New cards and scheduled reviews appear here.{" "}
          <Link to="/app/study?tab=flashcards">Open your decks</Link>
        </EmptyState>
      ) : (
        <section className="flashcard-study">
          <div className="section-title">
            <Link to={`/app/study/flashcards/${card.deck.id}`}>
              {card.deck.title}
            </Link>
            <span>
              {done.length} reviewed · {cards.length} in this batch
            </span>
          </div>
          <button
            type="button"
            className={`flashcard ${flipped ? "is-flipped" : ""}`}
            aria-label={flipped ? "Show question" : "Reveal answer"}
            disabled={busy}
            onClick={() => setFlipped(!flipped)}
          >
            <small>{flipped ? "THE ANSWER" : "THE QUESTION"}</small>
            <span key={`${card.id}-${flipped}`}>
              {flipped ? card.back : card.front}
            </span>
            <small>
              Click or press Enter to {flipped ? "show the question" : "reveal"}
            </small>
          </button>
          <div className="review-ratings">
            {[
              ["AGAIN", "Again", "10 min"],
              ["HARD", "Hard", "At least 1 day"],
              ["GOOD", "Good", "Growing interval"],
              ["EASY", "Easy", "At least 7 days"],
            ].map(([value, label, hint]) => (
              <Button
                key={value}
                variant={value === "GOOD" ? "primary" : "secondary"}
                disabled={
                  !flipped ||
                  busy ||
                  (!!request.current && request.current.rating !== value)
                }
                onClick={() => rate(value)}
              >
                {label}
                <small>{hint}</small>
              </Button>
            ))}
          </div>
          <p className="muted">
            Ratings schedule future reviews. “Again” restarts learning;
            intervals grow as recall improves.
          </p>
        </section>
      )}
      {!card && resource.data?.total > resource.data?.items.length && (
        <Button
          onClick={() => {
            resource.reload();
            setDone([]);
          }}
        >
          Load next review batch
        </Button>
      )}
    </>
  );
}
