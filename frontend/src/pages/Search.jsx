import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Search as SearchIcon } from "lucide-react";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import { EmptyState, ErrorNotice, Loading } from "../components/common/Feedback";

const contentTypes = [
  ["all", "All content"],
  ["workspace", "Workspaces"],
  ["document", "Documents"],
  ["conversation", "Conversations"],
  ["summary", "Summaries & notes"],
  ["quiz", "Quizzes"],
  ["deck", "Flashcard decks"],
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") || "").trim();
  const requestedType = params.get("type") || "all";
  const selectedType = contentTypes.some(([value]) => value === requestedType)
    ? requestedType
    : "all";
  const resource = useResource(
    query.length >= 2 && query.length <= 200
      ? `/search?q=${encodeURIComponent(query)}`
      : null,
  );
  const filteredGroups = (resource.data?.groups || []).filter(
    (group) =>
      group.items.length > 0 &&
      (selectedType === "all" || group.items[0].type === selectedType),
  );
  const filteredTotal =
    selectedType === "all"
      ? resource.data?.total || 0
      : filteredGroups.reduce((total, group) => total + group.total, 0);

  function updateFilter(type) {
    setParams({ q: query, ...(type !== "all" && { type }) });
  }

  return (
    <>
      <PageHeader
        eyebrow="FIND THE CONNECTION AGAIN"
        title="Search your study space"
        description="Search workspaces, documents, conversations, summaries, notes and saved tools."
      />
      <form
        className="global-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          const nextQuery = new FormData(event.currentTarget).get("q").trim();
          setParams({
            q: nextQuery,
            ...(selectedType !== "all" && { type: selectedType }),
          });
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
          Enter at least two characters to search your study material.
        </EmptyState>
      ) : resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.reload} />
      ) : resource.loading ? (
        <Loading />
      ) : resource.data?.total ? (
        <>
          <label className="search-filter">
            <span>Filter results</span>
            <select
              aria-label="Filter results by content type"
              value={selectedType}
              onChange={(event) => updateFilter(event.target.value)}
            >
              {contentTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p className="muted" role="status">
            {filteredTotal} matches for “{query}”
          </p>
          {filteredGroups.length ? (
            filteredGroups.map((group) => (
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
            ))
          ) : (
            <EmptyState icon={SearchIcon} title="No matches in this category">
              Choose another content type or switch back to all content.
            </EmptyState>
          )}
        </>
      ) : (
        <EmptyState icon={SearchIcon} title="No connections found">
          Try a different phrase or add more material to your library.
        </EmptyState>
      )}
    </>
  );
}
