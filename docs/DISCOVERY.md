# Discovery spikes

Everything here is a genuine unknown — nobody on this project has instrumented the
real GUC portals yet. Each spike (its own file under `docs/discovery/`, owned by
whichever track it blocks) names the question, why it matters, and a concrete way
to find the answer on a real device with real (the spiker's own) credentials.
**Do not guess at the answer and write it into product code** — land the spike's
findings in its file first, then implement, then record the decision as a new
`docs/adr/A-00N-*.md` or `B-00N-*.md`.

## Run these in order

1. **[Spike 1 — Portal authentication](discovery/spike-1-portal-auth.md)**
   (Track A), on a real phone, with your own GUC credentials. Nothing else
   below can start until this resolves.
2. **[Spike 3 — Cookie/session handling](discovery/spike-3-cookies-session.md)**
   (Track A), right after Spike 1, on the same device/login.
3. **[Spike 2 — Mail protocol](discovery/spike-2-mail-protocol.md)** (Track B),
   in parallel with 1/3 if a second person is available.
4. **[Spike 6 — Transcript-locked detection](discovery/spike-6-transcript-locked.md)**
   (Track A), once Spike 1 unblocks any real fetch and before `transcript` is
   implemented.
5. **[Spike 5 — Background refresh limits](discovery/spike-5-background-refresh.md)**
   (Track B), low priority.
6. **[Spike — Home-screen widgets](discovery/spike-widgets.md)** (Track B),
   feasibility only, can run any time.
7. **[Spike 4 — HTML parser in Hermes](discovery/spike-4-html-parser-hermes.md)**
   (shared): already resolved, kept for the record.

## Adding a new spike

Create `docs/discovery/spike-<n-or-name>.md` (own file — never add a spike inline
into this index, and never into another track's spike file) and link it from the
list above. If it's genuinely blocking, name the blocked feature; if it's your
track's spike, use the next `A-` or `B-` number when you record the answer as an
ADR.
