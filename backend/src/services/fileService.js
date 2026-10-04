import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import yauzl from "yauzl";
import { uploadDir } from "../config/env.js";
import { ApiError } from "../utils/http.js";
const invalid = () =>
  new ApiError(
    400,
    "INVALID_FILE_TYPE",
    "Upload a valid document, image, MP3, WAV or M4A file.",
  );
const types = {
  ".pdf": ["application/pdf"],
  ".txt": ["text/plain"],
  ".md": [
    "text/plain",
    "text/markdown",
    "text/x-markdown",
    "application/octet-stream",
  ],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".webp": ["image/webp"],
  ".mp3": ["audio/mpeg", "audio/mp3"],
  ".wav": ["audio/wav", "audio/x-wav", "audio/wave"],
  ".m4a": ["audio/mp4", "audio/m4a", "audio/x-m4a"],
};
async function validateDocx(buffer) {
  await new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(invalid());
      let size = 0,
        count = 0;
      const names = new Set();
      zip.on("error", () => reject(invalid()));
      zip.on("entry", (entry) => {
        size += entry.uncompressedSize;
        count++;
        if (
          size > 100 * 1024 * 1024 ||
          count > 5000 ||
          entry.generalPurposeBitFlag & 1
        ) {
          zip.close();
          return reject(invalid());
        }
        names.add(entry.fileName);
        zip.readEntry();
      });
      zip.on("end", () =>
        names.has("word/document.xml") && names.has("[Content_Types].xml")
          ? resolve()
          : reject(invalid()),
      );
      zip.readEntry();
    });
  });
}
export async function saveDocument(file) {
  if (!file || !file.size) throw invalid();
  const ext = path.extname(file.originalname).toLowerCase();
  if (!types[ext]?.includes(file.mimetype)) throw invalid();
  if (ext === ".pdf" && file.buffer.subarray(0, 5).toString() !== "%PDF-")
    throw invalid();
  if (ext === ".docx") await validateDocx(file.buffer);
  if (
    ext === ".mp3" &&
    file.buffer.subarray(0, 3).toString() !== "ID3" &&
    !(file.buffer[0] === 255 && (file.buffer[1] & 224) === 224)
  )
    throw invalid();
  if (
    ext === ".wav" &&
    (file.buffer.subarray(0, 4).toString() !== "RIFF" ||
      file.buffer.subarray(8, 12).toString() !== "WAVE")
  )
    throw invalid();
  if (ext === ".m4a" && file.buffer.subarray(4, 8).toString() !== "ftyp")
    throw invalid();
  if (
    ext === ".png" &&
    !file.buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw invalid();
  if (
    [".jpg", ".jpeg"].includes(ext) &&
    !file.buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
  )
    throw invalid();
  if (
    ext === ".webp" &&
    (file.buffer.subarray(0, 4).toString() !== "RIFF" ||
      file.buffer.subarray(8, 12).toString() !== "WEBP")
  )
    throw invalid();
  if ([".md", ".txt"].includes(ext)) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(file.buffer);
    } catch {
      throw invalid();
    }
    if (file.buffer.includes(0)) throw invalid();
  }
  await fs.mkdir(uploadDir, { recursive: true });
  const storedName = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(uploadDir, storedName), file.buffer, {
    flag: "wx",
  });
  return {
    storedName,
    originalName: path.basename(file.originalname).slice(0, 200),
    mimeType: types[ext][0],
    fileSize: file.size,
  };
}
export const filePath = (storedName) =>
  path.join(uploadDir, path.basename(storedName));
export async function saveYoutubeReference(reference, title) {
  await fs.mkdir(uploadDir, { recursive: true });
  const storedName = `${randomUUID()}.youtube`,
    buffer = Buffer.from(JSON.stringify({ videoId: reference.videoId }));
  await fs.writeFile(filePath(storedName), buffer, { flag: "wx" });
  return {
    storedName,
    originalName: title,
    mimeType: "application/json",
    fileSize: buffer.length,
    extractionMode: "YOUTUBE",
    sourceUrl: reference.url,
  };
}
export async function removeFiles(names) {
  await Promise.all(
    names.map(async (name) => {
      try {
        await fs.unlink(filePath(name));
      } catch (error) {
        if (error.code !== "ENOENT")
          console.error(
            JSON.stringify({
              event: "file_cleanup_failed",
              file: name,
              code: error.code,
            }),
          );
      }
    }),
  );
}
