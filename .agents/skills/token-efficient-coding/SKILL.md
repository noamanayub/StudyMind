---
name: token-efficient-coding
description: Keep repository investigation and implementation context-efficient without sacrificing correctness. Use for large codebases, broad searches, long logs, repeated tool output, or when the user explicitly asks to reduce token or context usage; do not constrain small straightforward edits.
---

# Token-Efficient Coding

- Build a narrow file map with `rg --files` and targeted `rg` queries before opening large files.
- Read the smallest relevant regions, then expand only when imports, callers, schemas, or failures require more context.
- Summarize stable findings instead of repeatedly rereading or reproducing the same output.
- Prefer precise commands, focused tests, and bounded logs. Filter generated files, lockfiles, build output, and vendored code unless they are the subject of the task.
- Make cohesive edits with existing abstractions instead of generating parallel implementations or large speculative scaffolds.
- Keep user updates outcome-focused and avoid pasting full tool output when a concise diagnosis is sufficient.
- Token efficiency never justifies skipping required instructions, validation, security checks, or accessibility work.
