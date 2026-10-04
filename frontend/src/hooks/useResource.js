import { useCallback, useEffect, useState } from "react";
import { get, errorMessage } from "../services/api";
export function useResource(path, { poll = false } = {}) {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    if (!path) {
      setLoading(false);
      setData(null);
      setError("");
      return;
    }
    const controller = new AbortController();
    let active = true,
      fetching = false;
    async function load(initial = false) {
      if (fetching) return;
      fetching = true;
      if (initial) setLoading(true);
      try {
        const value = await get(path, { signal: controller.signal });
        if (active) {
          setData(value);
          setError("");
        }
      } catch (e) {
        if (active && e.code !== "ERR_CANCELED") setError(errorMessage(e));
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    }
    load(true);
    const timer = poll ? setInterval(() => load(), 4000) : null;
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [path, revision, poll]);
  return { data, setData, loading, error, reload };
}
