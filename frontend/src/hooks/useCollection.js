import { useCallback, useEffect, useState } from "react";
import { get, errorMessage } from "../services/api";

// Selectors need every choice, while the underlying API remains paginated.
export function useCollection(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const items = [];
        let page = 1,
          total = 0;
        do {
          const result = await get(
            `${path}${path.includes("?") ? "&" : "?"}limit=100&page=${page}`,
            { signal: controller.signal },
          );
          items.push(...result.items);
          total = result.total;
          if (!result.items.length) break;
          page += 1;
        } while (items.length < total);
        if (active) {
          setData({ items, total });
          setError("");
        }
      } catch (err) {
        if (active && err.code !== "ERR_CANCELED") setError(errorMessage(err));
      }
    }
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [path, revision]);
  return { data, error, reload };
}
