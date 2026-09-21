# Spike 4 — HTML parser in Hermes

**Owner:** Shared. **Blocks:** every `parser.ts`.

**Status: resolved.** See [ADR S-001](../adr/S-001-stack.md) — `node-html-parser`
works in Hermes without polyfills; `cheerio` needs jQuery-like DOM APIs Hermes
doesn't have.

Revisit only if a specific captured page needs a selector `node-html-parser`
can't express.
