---
name: design-system
description: Create, extend, or audit a web design system including tokens, themes, component variants, composition rules, and consistency across screens. Use for reusable UI foundations or repeated visual inconsistency; not for a single isolated style tweak.
---

# Design System

- Inventory existing CSS variables, Tailwind theme extensions, shadcn components, variants, and repeated patterns before adding a token or primitive.
- Prefer semantic tokens such as surface, foreground, border, accent, success, and destructive over feature-specific raw values.
- Keep token layers clear: primitive values feed semantic roles, and components consume semantic roles. Preserve light/dark and interactive-state coverage.
- Extend existing component APIs with deliberate variants and sizes rather than forking nearly identical components.
- Define composition expectations where misuse is likely: forms, cards, dialogs, navigation, tables, empty states, and feedback.
- Treat responsive, focus, disabled, loading, error, and reduced-motion behavior as part of each component contract.
- Migrate repeated usage incrementally and verify representative screens before broad replacement.
