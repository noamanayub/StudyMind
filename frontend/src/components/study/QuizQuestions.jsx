export default function QuizQuestions({
  questions,
  answers,
  onAnswer,
  onBlur,
  busy = false,
  required = true,
}) {
  return questions.map((q, index) => (
    <fieldset className="quiz-question" key={q.id} disabled={busy}>
      <legend>
        {index + 1}. {q.question}
      </legend>
      {q.type === "SHORT_ANSWER" ? (
        <label>
          Your answer
          <input
            type="text"
            required={required}
            maxLength={1000}
            value={answers[q.id] || ""}
            onChange={(e) => onAnswer(q.id, e.target.value)}
            onBlur={onBlur}
          />
        </label>
      ) : (
        q.options.map((option, i) => (
          <label className="quiz-option" key={i}>
            <input
              type="radio"
              name={q.id}
              value={option}
              required={required}
              checked={answers[q.id] === option}
              onChange={() => onAnswer(q.id, option)}
            />
            <span>{option}</span>
          </label>
        ))
      )}
    </fieldset>
  ));
}
