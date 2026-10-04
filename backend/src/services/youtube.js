import { ApiError } from "../utils/http.js";
export function youtubeReference(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError(
      400,
      "INVALID_VIDEO",
      "Use a public YouTube video link.",
    );
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    throw new ApiError(
      400,
      "INVALID_VIDEO",
      "Use a public HTTPS YouTube video link.",
    );
  let videoId;
  if (url.hostname === "youtu.be") videoId = url.pathname.slice(1);
  else if (
    ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
  )
    videoId =
      url.pathname === "/watch"
        ? url.searchParams.get("v")
        : url.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})$/)?.[1];
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId))
    throw new ApiError(
      400,
      "INVALID_VIDEO",
      "Use a YouTube watch, short or youtu.be video link.",
    );
  return { videoId, url: `https://www.youtube.com/watch?v=${videoId}` };
}
