import { useEffect } from "react";

export default function useDialog(ref, open = true) {
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    const trigger = document.activeElement;
    function containFocus(event) {
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]'
      )].filter((element) => element.tabIndex >= 0 && !element.disabled && element.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    dialog.showModal();
    dialog.addEventListener("keydown", containFocus);
    return () => {
      dialog.removeEventListener("keydown", containFocus);
      dialog.close();
      queueMicrotask(() => {
        if (trigger?.isConnected) trigger.focus();
      });
    };
  }, [ref, open]);
}
