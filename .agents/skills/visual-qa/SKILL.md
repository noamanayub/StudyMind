---
name: visual-qa
description: Verify rendered web UI after visual or interaction changes using browser automation, screenshots, and focused inspection. Use for visual QA, regression checks, responsive verification, implementation-to-reference comparison, or reports that a page looks wrong.
---

# Visual QA

- Establish the expected route, state, data, theme, and viewport before judging appearance.
- Use Playwright for repeatable navigation and interaction. Capture screenshots only after fonts, images, loading states, and animations have settled.
- Check at least one mobile and one desktop viewport when layout can respond. Inspect horizontal overflow, clipping, stacking, fixed elements, dialogs, menus, and focus states.
- Review browser console errors and failed network requests when the rendering defect may be runtime-related.
- Compare structure, alignment, spacing, typography, color, states, and content—not just overall resemblance.
- Distinguish implementation bugs from missing data, environment failures, and subjective preferences. Fix only issues within the requested scope.
- Re-run the smallest stable scenario after a fix and retain failure screenshots/traces when they help diagnosis.
