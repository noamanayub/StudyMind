import { useRef, useId } from "react";
import { X } from "lucide-react";
import useDialog from "../../hooks/useDialog";
export default function Modal({
  title,
  description,
  children,
  onClose,
  busy = false,
}) {
  const ref = useRef(null),
    id = useId();
  useDialog(ref);
  return (
    <dialog
      ref={ref}
      className="modal"
      data-lenis-prevent
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !busy) {
          const rect = ref.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id={`${id}-title`}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          disabled={busy}
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {description && (
        <p className="muted" id={`${id}-description`}>
          {description}
        </p>
      )}
      {children}
    </dialog>
  );
}
