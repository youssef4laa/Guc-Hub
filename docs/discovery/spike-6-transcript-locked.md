# Spike 6 — Transcript-locked detection

**Owner:** Track A. **Blocks:** `transcript`.

**Question:** What does the portal actually return when a student's transcript is
locked (registration hold, unpaid fees, etc.) — a distinct page/status, or the same
markup as a successful transcript but with an inline banner?

**Why it matters:** `TRANSCRIPT_LOCKED` must never be reported as `PARSE_FAILED` —
one is an expected, explainable state; the other means our parser broke. Getting
this wrong makes a normal "your transcript is on hold" message look like a bug.

**How to find out:** Capture the transcript page from an account known to have a
hold, alongside a normal one, and diff them.

Run once [spike-1-portal-auth.md](spike-1-portal-auth.md) unblocks any real
fetch and before `transcript` is implemented.
