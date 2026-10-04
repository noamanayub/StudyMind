import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NavbarSearch() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function submitSearch(event) {
    event.preventDefault();
    const search = query.trim();
    if (search.length < 2) return;
    navigate(`/app/search?q=${encodeURIComponent(search)}`);
    setQuery("");
  }

  return (
    <form className="navbar-search" role="search" onSubmit={submitSearch}>
      <label className="sr-only" htmlFor="navbar-search-input">
        Search your study space
      </label>
      <input
        id="navbar-search-input"
        type="search"
        minLength={2}
        maxLength={200}
        placeholder="Search your study space"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button
        className="navbar-search-submit"
        type="submit"
        aria-label="Search"
        title="Search"
      >
        <Search size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
