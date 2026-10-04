import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useResource } from "../hooks/useResource";
import { api, errorMessage } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import { ErrorNotice, Loading } from "../components/common/Feedback";
import ResourceActions from "../components/study/ResourceActions";
import StudySources from "../components/study/StudySources";
export default function Flashcards() {
  const { id } = useParams(),
    resource = useResource(`/flashcards/${id}`);
  const [index, setIndex] = useState(0),
    [flipped, setFlipped] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function move(step) {
    setIndex((i) => i + step);
    setFlipped(false);
    setError("");
  }
  async function status(value) {
    setBusy(true);
    setError("");
    const card = resource.data.cards[index];
    try {
      const response = await api.patch(`/flashcards/${id}/cards/${card.id}`, {
        status: value,
      });
      resource.setData({
        ...resource.data,
        cards: resource.data.cards.map((c) =>
          c.id === card.id ? response.data.data : c,
        ),
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (resource.error)
    return <ErrorNotice message={resource.error} retry={resource.reload} />;
  if (resource.loading || !resource.data) return <Loading />;
  const deck = resource.data,
    card = deck.cards[index];
  return (
    <>
      <Link className="back-link" to="/app/study?tab=flashcards">
        ← Your decks
      </Link>
      <PageHeader
        eyebrow="ONE IDEA AT A TIME"
        title={deck.title}
        action={
          <ResourceActions
            record={deck}
            endpoint="/flashcards"
            tab="flashcards"
            onChange={resource.reload}
          />
        }
      />
      {error && <ErrorNotice message={error} />}
      <Link className="text-link" to="/app/review">
        Review due cards with spaced repetition →
      </Link>
      {card && (
        <section className="flashcard-study">
          <div className="section-title">
            <p>
              Card {index + 1} of {deck.cards.length}
            </p>
            <span className="study-status">
              {card.status.toLowerCase()} ·{" "}
              {deck.cards.filter((c) => c.status === "KNOWN").length} known
            </span>
          </div>
          <button
            type="button"
            className={`flashcard ${flipped ? "is-flipped" : ""}`}
            aria-label={flipped ? "Show question" : "Reveal answer"}
            onClick={() => setFlipped(!flipped)}
          >
            <small>{flipped ? "THE CONNECTION" : "THE QUESTION"}</small>
            <span key={`${card.id}-${flipped}`}>
              {flipped ? card.back : card.front}
            </span>
            <small>
              {flipped
                ? "Click or press Enter to return to the question"
                : "Click or press Enter to reveal"}
            </small>
          </button>
          <div className="flashcard-controls">
            <Button
              variant="secondary"
              disabled={index === 0 || busy}
              onClick={() => move(-1)}
            >
              <ChevronLeft size={17} />
              Previous
            </Button>
            <Button disabled={!flipped || busy} onClick={() => status("KNOWN")}>
              <Check size={17} />
              Known
            </Button>
            <Button
              variant="secondary"
              disabled={!flipped || busy}
              onClick={() => status("REVIEW")}
            >
              <RotateCcw size={17} />
              Review again
            </Button>
            <Button
              variant="secondary"
              disabled={index === deck.cards.length - 1 || busy}
              onClick={() => move(1)}
            >
              Next
              <ChevronRight size={17} />
            </Button>
          </div>
          <p className="muted" role="status">
            {busy
              ? "Saving review status…"
              : `This card is ${card.status.toLowerCase()}. Review progress is saved to your account.`}
          </p>
        </section>
      )}
      <StudySources record={deck} />
    </>
  );
}
