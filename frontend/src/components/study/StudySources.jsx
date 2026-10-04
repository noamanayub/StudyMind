import SourceCard from "../chat/SourceCard";
export default function StudySources({ record }) {
  const coverage = record.coverage;
  return (
    <aside className="study-sources">
      {coverage?.selectedChunks && (
        <p className="form-note">
          Based on {coverage.selectedChunks} of {coverage.totalChunks} indexed
          passages from {coverage.documentCount} document
          {coverage.documentCount === 1 ? "" : "s"}.
          {coverage.selectedChunks < coverage.totalChunks
            ? " This resource uses representative passages; check the original material for complete coverage."
            : ""}
        </p>
      )}
      {!!record.sources?.length && (
        <>
          <h2>Back to the material</h2>
          <div className="study-source-grid">
            {record.sources.map((source) => (
              <SourceCard key={source.chunkId} source={source} />
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
