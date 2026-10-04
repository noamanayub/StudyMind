---
name: responsive-design
description: Implement or diagnose responsive web layouts across mobile, tablet, desktop, zoom, and variable-content conditions. Use for breakpoint behavior, overflow, navigation adaptation, dense data, touch layouts, or cross-viewport defects.
---

# Responsive Design

- Diagnose the content constraint before adding a breakpoint. Prefer fluid sizing, wrapping, grid, flex, `minmax()`, and container-aware behavior over device-specific patches.
- Design mobile hierarchy intentionally; do not merely stack every desktop region in source order.
- Keep text readable, controls reachable, touch targets generous, and critical actions visible without horizontal scrolling.
- Adapt tables and dense dashboards by prioritizing columns, enabling intentional scrolling, or switching presentation when semantics permit.
- Test narrow mobile, wide mobile, tablet, standard desktop, and a wide viewport. Include long labels, empty data, error text, and 200% zoom where practical.
- Avoid fixed heights for dynamic content and avoid viewport units that ignore mobile browser chrome when modern dynamic viewport units are available.
- Use Playwright screenshots and overflow checks for changes that affect multiple breakpoints.
