import { useEffect, useMemo, useState } from "react";
import { ReactLenis } from "lenis/react";

export default function SmoothScroll({ children }) {
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const options = useMemo(
    () => ({
      lerp: 0.1,
      smoothWheel: !reducedMotion,
      syncTouch: false,
      wheelMultiplier: 0.9,
    }),
    [reducedMotion],
  );

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}
