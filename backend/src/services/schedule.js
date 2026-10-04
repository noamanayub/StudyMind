const DAY = 86400000;
export function scheduleReview(card, rating, now = new Date()) {
  let ease = card.ease,
    repetitions = card.repetitions,
    intervalDays = card.intervalDays;
  if (rating === "AGAIN")
    return {
      ease: Math.max(1.3, ease - 0.2),
      repetitions: 0,
      intervalDays: 0,
      dueAt: new Date(now.getTime() + 600000),
      status: "REVIEW",
    };
  if (rating === "HARD") {
    ease = Math.max(1.3, ease - 0.15);
    intervalDays = Math.max(1, Math.ceil(intervalDays * 1.2));
  }
  if (rating === "GOOD") {
    intervalDays =
      repetitions === 0
        ? 1
        : repetitions === 1
          ? 3
          : Math.max(1, Math.round(intervalDays * ease));
    repetitions += 1;
  }
  if (rating === "EASY") {
    ease = Math.min(3, ease + 0.15);
    intervalDays = Math.max(7, Math.ceil(intervalDays * ease * 1.3));
    repetitions += 1;
  }
  intervalDays = Math.min(3650, intervalDays);
  return {
    ease,
    repetitions,
    intervalDays,
    dueAt: new Date(now.getTime() + intervalDays * DAY),
    status: rating === "HARD" ? "LEARNING" : "KNOWN",
  };
}
export function planTasks(input, materials) {
  const start = new Date(input.startDate),
    end = new Date(input.examDate),
    days = Math.round((end - start) / DAY);
  if (days < 1 || days > 180) return null;
  const tasks = [];
  for (let day = 0; day < days; day++) {
    const date = new Date(start.getTime() + day * DAY),
      material = materials[day % materials.length];
    tasks.push({
      title: material.title,
      kind: material.kind,
      resourceId: material.id,
      date,
      minutes: input.dailyMinutes,
    });
  }
  return tasks;
}
