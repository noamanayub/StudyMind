import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, ArrowUpRight } from "lucide-react";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import {
  Loading,
  ErrorNotice,
  EmptyState,
} from "../components/common/Feedback";
export default function Search() {
  const [params, setParams] = useSearchParams(),
    query = (params.get("q") || "").trim();
  const resource = useResource(
    query.length >= 2 && query.length <= 200
      ? `/search?q=${encodeURIComponent(query)}`
      : null,
  );
  return (
    <>
      <PageHeader
        eyebrow="FIND THE CONNECTION AGAIN"
        title="Search your study space"
        description="Workspaces, document text, conversations, summaries, notes and saved tools."
      />
      <form
        className="global-search-form"
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ q: new FormData(e.currentTarget).get("q").trim() });
        }}
      >
        <label className="sr-only" htmlFor="global-search">
          Search Study Mind
        </label>
        <SearchIcon size={20} />
        <input
          key={query}
          id="global-search"
          name="q"
          minLength={2}
          maxLength={200}
          required
          defaultValue={query}
          placeholder="Search Study Mind…"
        />
        <Button type="submit">Search</Button>
      </form>
      {query.length < 2 ? (
        <EmptyState icon={SearchIcon} title="What are you looking for?">
          Enter at least two characters to search your own study material.
        </EmptyState>
      ) : resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.reload} />
      ) : resource.loading ? (
        <Loading />
      ) : resource.data?.total ? (
        <>
          <p className="muted" role="status">
            {resource.data.total} matches for “{query}”
          </p>
          {resource.data.groups
            .filter((g) => g.items.length)
            .map((group) => (
              <section className="search-results" key={group.label}>
                <div className="section-title">
                  <h2>{group.label}</h2>
                  <span className="muted">
                    {group.total} matches
                    {group.total > 8 ? " · first 8 shown" : ""}
                  </span>
                </div>
                {group.items.map((item) => (
                  <Link key={item.id} className="search-result" to={item.url}>
                    <div>
                      <h3>{item.title}</h3>
                      {item.excerpt && <p>{item.excerpt}</p>}
                    </div>
                    <ArrowUpRight size={18} />
                  </Link>
                ))}
              </section>
            ))}
        </>
      ) : (
        <EmptyState icon={SearchIcon} title="No connections found">
          Try a different phrase or add more material to your library.
        </EmptyState>
      )}
    </>
  );
}
