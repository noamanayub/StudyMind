import { useId } from "react";
export default function Input({ label, error, help, id, ...props }) {
  const generated = useId();
  const fieldId = id || generated;
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error || help ? `${fieldId}-help` : undefined}
        {...props}
      />
      {(error || help) && (
        <small
          id={`${fieldId}-help`}
          className={error ? "field-error" : "muted"}
        >
          {error || help}
        </small>
      )}
    </div>
  );
}
