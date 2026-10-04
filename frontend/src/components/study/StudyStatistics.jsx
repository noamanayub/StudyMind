import { useResource } from "../../hooks/useResource";
import { Loading, ErrorNotice } from "../common/Feedback";
const labels = {
  GENERATED_SUMMARY: "Created a summary",
  GENERATED_NOTES: "Created study notes",
  GENERATED_QUIZ: "Created a quiz",
  GENERATED_FLASHCARDS: "Created a flashcard deck",
  COMPLETED_QUIZ: "Completed a quiz",
  REVIEWED_FLASHCARD: "Reviewed a flashcard",
  SAVED_NOTE: "Saved a study note",
};
export default function StudyStatistics() {
  const resource = useResource("/statistics");
  if (resource.error)
    return <ErrorNotice message={resource.error} retry={resource.reload} />;
  if (resource.loading || !resource.data) return <Loading />;
  const data = resource.data;
  return (
    <section className="study-statistics">
      <h2>Your study space, in numbers</h2>
      <div className="statistics-grid">
        {[
          ["Documents", data.documents],
          ["Subjects", data.workspaces],
          ["Questions asked", data.questions],
          ["Flashcards", data.flashcards],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="muted">
        {data.knownCards} cards known · {data.summaries} summaries ·{" "}
        {data.notes} notes · {data.attempts} quiz attempts
      </p>
      <h3>Recent study activity</h3>
      {data.activities.length ? (
        <ol className="study-activity">
          {data.activities.map((a) => (
            <li key={a.id}>
              <div>
                <strong>{labels[a.action] || "Studied"}</strong>
                <span>{a.title}</span>
              </div>
              <time dateTime={a.createdAt}>
                {new Date(a.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">
          Create a study resource or complete a review to see your activity
          here.
        </p>
      )}
    </section>
  );
}
