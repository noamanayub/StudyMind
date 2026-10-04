import { normalizeAnswer } from "./studyService.js";
export const publicQuestion = ({ id, position, question, type, options }) => ({
  id,
  position,
  question,
  type,
  options,
});
export function scoreQuestions(questions, answers) {
  const entries = new Map(answers.map((a) => [a.questionId, a.answer]));
  return questions.map((q) => ({
    questionId: q.id,
    question: q.question,
    submittedAnswer: entries.get(q.id) || "",
    correct:
      !!entries.get(q.id) &&
      [
        q.correctAnswer,
        ...(q.type === "SHORT_ANSWER" ? q.acceptedAnswers : []),
      ].some((a) => normalizeAnswer(a) === normalizeAnswer(entries.get(q.id))),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }));
}
