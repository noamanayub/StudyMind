import { useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Globe, ArrowUpRight } from "lucide-react";
import { useResource } from "../hooks/useResource";
import { api, errorMessage } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  Loading,
  ErrorNotice,
  EmptyState,
  Pagination,
} from "../components/common/Feedback";
export default function Research() {
  const [params, setParams] = useSearchParams(),
    id = params.get("id"),
    [page, setPage] = useState(1),
    list = useResource(`/research?limit=12&page=${page}`),
    report = useResource(id ? `/research/${id}` : null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [remove, setRemove] = useState(false),
    request = useRef(null);
  async function search(e) {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get("query").trim();
    if (request.current?.query !== query)
      request.current = { query, id: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/research", {
        query,
        requestId: request.current.id,
      });
      setParams({ id: res.data.data.id });
      list.reload();
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
        eyebrow="LOOK BEYOND YOUR BOOKSHELF"
        title="Research with a source to follow"
        description="Search the public web with Gemini and Google Search. Web findings are separate from answers grounded in your uploaded material."
      />
      {error && <ErrorNotice message={error} />}
      <form className="research-form" onSubmit={search}>
        <label htmlFor="research-question">
          What would you like to research?
        </label>
        <textarea
          id="research-question"
          name="query"
          required
          minLength={5}
          maxLength={2000}
          rows={3}
          disabled={busy}
          placeholder="Ask a focused study question…"
        />
        <p className="form-note">
          Your question is sent to Gemini and Google Search. Your uploaded
          documents are not included. Read linked sources to check claims and
          context.
        </p>
        <Button type="submit" loading={busy}>
          <Globe size={17} />
          Research and save
        </Button>
      </form>
      {id &&
        (report.error ? (
          <ErrorNotice message={report.error} retry={report.reload} />
        ) : report.loading ? (
          <Loading />
        ) : (
          report.data && (
            <section className="research-report">
              <div className="section-title">
                <h2>{report.data.query}</h2>
                <Button variant="secondary" onClick={() => setRemove(true)}>
                  Delete report
                </Button>
              </div>
              <p className="eyebrow">
                WEB RESEARCH ·{" "}
                {new Date(report.data.createdAt).toLocaleDateString()}
              </p>
              <div className="study-content">{report.data.content}</div>
              <h3>Statements with source evidence</h3>
              {report.data.supports.map((support, index) => (
                <blockquote key={index}>
                  <p>{support.text}</p>
                  <div className="research-links">
                    {support.sourceIndices.map((i) => (
                      <a
                        key={i}
                        href={report.data.sources[i].url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        [{i + 1}] {report.data.sources[i].title}
                        <ArrowUpRight size={14} />
                      </a>
                    ))}
                  </div>
                </blockquote>
              ))}
              <h3>Google Search suggestions</h3>
              <iframe
                title="Google Search suggestions"
                srcDoc={report.data.suggestionsHtml}
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                className="search-suggestions"
              />
            </section>
          )
        ))}
      <section className="study-sources">
        <h2>Your saved research</h2>
        {list.error ? (
          <ErrorNotice message={list.error} retry={list.reload} />
        ) : list.loading ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <EmptyState icon={Globe} title="Follow your next question">
            A source-backed report will be saved here after research succeeds.
          </EmptyState>
        ) : (
          <>
            <div className="research-history">
              {list.data.items.map((item) => (
                <Link key={item.id} to={`/app/research?id=${item.id}`}>
                  {item.query}
                  <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                </Link>
              ))}
            </div>
              <Pagination data={list.data} page={page} setPage={setPage} />
          </>
        )}
      </section>
      {remove && (
        <ConfirmDialog
          title="Delete research report?"
          description="This removes the saved report from your account."
          onClose={() => setRemove(false)}
          onConfirm={async () => {
            await api.delete(`/research/${id}`);
            setParams({});
            list.reload();
          }}
        />
      )}
    </>
  );
}
