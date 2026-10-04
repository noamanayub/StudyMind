---
name: accessibility-review
description: Implement or audit web accessibility for semantic structure, keyboard use, focus, forms, dialogs, contrast, motion, and assistive technology. Use when accessibility is requested or interaction changes create meaningful accessibility risk.
---

# Accessibility Review

- Prefer native semantic elements and correct heading, landmark, list, table, and form relationships before adding ARIA.
- Ensure every control has an accessible name, every field has a programmatic label, and validation is associated with the relevant input.
- Verify keyboard order, visible focus, escape/close behavior, focus trapping for modals, and sensible focus restoration.
- Announce important asynchronous status changes without making routine updates noisy.
- Check contrast, non-color indicators, target size, reflow, text spacing, and reduced-motion behavior.
- Preserve dialog titles and descriptions even when visually hidden. Do not disable focus outlines without an equally visible replacement.
- Use automated checks as a baseline, then manually verify keyboard interaction and semantics. Report findings by impact and point to the exact component.
