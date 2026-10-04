import { db } from "../config/database.js";
import { id } from "../validators/index.js";
import { ApiError } from "../utils/http.js";
export async function owned(model, resourceId, userId, include) {
  const record = await db[model].findFirst({
    where: { id: id.parse(resourceId), userId },
    ...(include ? { include } : {}),
  });
  if (!record)
    throw new ApiError(404, "NOT_FOUND", "This item is not available.");
  return record;
}
export async function validateScope(input, userId) {
  if (input.scope === "workspace") {
    if (!input.workspaceId)
      throw new ApiError(400, "WORKSPACE_REQUIRED", "Choose a workspace.");
    await owned("workspace", input.workspaceId, userId);
    return {
      scope: "workspace",
      workspaceId: input.workspaceId,
      documentIds: [],
    };
  }
  if (input.scope === "documents") {
    const ids = [...new Set(input.documentIds)];
    if (!ids.length)
      throw new ApiError(
        400,
        "DOCUMENTS_REQUIRED",
        "Choose at least one document.",
      );
    const count = await db.document.count({
      where: { id: { in: ids }, userId, status: "READY" },
    });
    if (count !== ids.length)
      throw new ApiError(
        400,
        "INVALID_DOCUMENTS",
        "Select documents that are ready and belong to you.",
      );
    return { scope: "documents", workspaceId: null, documentIds: ids };
  }
  return { scope: "all", workspaceId: null, documentIds: [] };
}
