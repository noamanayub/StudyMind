import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  function notify(text) {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 5000);
  }
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" aria-live="polite">
        {message && (
          <div className="toast">
            <Check size={18} />
            <span>{message}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setMessage("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
