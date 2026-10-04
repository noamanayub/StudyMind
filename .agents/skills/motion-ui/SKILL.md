---
name: motion-ui
description: Design, implement, or review web UI animation with Motion for React. Use for micro-interactions, enter/exit transitions, layout animation, gestures, scroll effects, or Framer-style animation; do not activate for static layout-only work.
---

# Motion UI

- Inspect the existing component, styling, and interaction state before choosing an animation.
- Prefer CSS transitions for simple hover, focus, and single-property state changes. Use `motion/react` for coordinated states, `AnimatePresence`, layout animation, gestures, or scroll-linked behavior.
- Treat “Framer-style” as a visual direction implemented with Motion; do not add `framer-motion` alongside `motion`.
- Reuse the product's spacing, radius, color, and timing language. Motion should clarify hierarchy or feedback, not delay routine actions.
- Support `prefers-reduced-motion`; remove parallax, large transforms, and nonessential loops when reduction is requested.
- Animate transform and opacity where possible. Avoid layout-thrashing properties and unbounded perpetual effects.
- Use GSAP only for timeline-heavy choreography, Three.js/React Three Fiber only for real 3D scenes, Lottie only when a supplied animation asset is the source of truth, and Lenis only for intentionally smooth page scrolling.
- Verify initial, active, exit, interrupted, and reduced-motion states. Run targeted browser checks when behavior is user-visible.
