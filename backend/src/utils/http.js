export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });
export function pagination(query) {
  const page = Math.max(1, Math.min(10000, parseInt(query.page, 10) || 1));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}
export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  answerStyle: user.answerStyle,
  explanationLevel: user.explanationLevel,
  readingSize: user.readingSize,
  density: user.density,
  reduceMotion: user.reduceMotion,
});
