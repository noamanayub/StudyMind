const escapeText = (value) =>
  String(value)
    .replaceAll("\\", "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
function fold(line) {
  let result = "",
    length = 0;
  for (const character of line) {
    const bytes = Buffer.byteLength(character);
    if (length + bytes > 75) {
      result += "\r\n ";
      length = 1;
    }
    result += character;
    length += bytes;
  }
  return result;
}
const date = (value) =>
  new Date(value).toISOString().slice(0, 10).replaceAll("-", "");
export function calendarForPlan(plan, now = new Date()) {
  const stamp = now
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Study Mind//Study Plans//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const task of plan.tasks) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${task.id}@studymind`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${date(task.date)}`,
      `DTEND;VALUE=DATE:${date(new Date(task.date).getTime() + 86400000)}`,
      `SUMMARY:${escapeText(task.title)}`,
      `DESCRIPTION:${escapeText(`${plan.title} — ${task.minutes} minutes of revision. ${task.completedAt ? "Completed." : "Planned."}`)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push(
    "BEGIN:VEVENT",
    `UID:${plan.id}-exam@studymind`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${date(plan.examDate)}`,
    `DTEND;VALUE=DATE:${date(new Date(plan.examDate).getTime() + 86400000)}`,
    `SUMMARY:${escapeText(`Exam: ${plan.title}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return lines.map(fold).join("\r\n") + "\r\n";
}
