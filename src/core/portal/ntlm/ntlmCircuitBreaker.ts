/**
 * The single stored GUC credential covers the portal, CMS, and mail — and every
 * feature (schedule, grades, mail folders, background refresh, ...) calls
 * `ntlmRequest` independently, each reading the same stored password itself. Without
 * this, one bad password can trigger a handful of separate failed attempts against
 * GUC's AD in a single app launch, which risks locking the student's account.
 *
 * Tripped by `ntlmRequest` the first time the stored credential is rejected; every
 * further call fails fast with no network/native call until the user supplies a
 * credential the server actually accepts (`NtlmLoginStrategy.login` succeeding).
 * Deliberately in-memory only — it exists to bound one app launch, not to persist
 * a lockout across restarts.
 *
 * Two more pieces of state support that:
 *
 * - **Confirmed:** whether the stored credential has been accepted by the server
 *   at least once this session. Until it has, stored-credential attempts run one
 *   at a time (see ntlmRequest.ts), so a burst can't fire several copies of an
 *   unverified password — even when the first attempt fails for a reason that
 *   says nothing about the password, like a timeout.
 * - **Login generation:** bumped on every successful sign-in and on sign-out.
 *   Each stored-credential attempt is stamped with the generation it started
 *   under, and its outcome only counts if the generation hasn't moved since. A
 *   request still carrying the old password when the user signs in with a new one
 *   can't re-trip the breaker, or confirm a credential that's no longer stored.
 */
let tripped = false;
let confirmed = false;
let generation = 0;

export function isNtlmCircuitTripped(): boolean {
  return tripped;
}

export function isStoredCredentialConfirmed(): boolean {
  return confirmed;
}

export function currentNtlmLoginGeneration(): number {
  return generation;
}

/**
 * A stored-credential attempt stamped `stamp` was rejected. Ignored (returns
 * false) if a sign-in or sign-out has happened since it started. Defaults to the
 * current generation for callers that aren't racing a sign-in.
 */
export function tripNtlmCircuitBreaker(stamp: number = generation): boolean {
  if (stamp !== generation) return false;
  tripped = true;
  confirmed = false;
  return true;
}

/** A stored-credential attempt stamped `stamp` got a non-401 answer. */
export function confirmStoredCredential(stamp: number): void {
  if (stamp === generation && !tripped) confirmed = true;
}

/**
 * The session has committed a successful sign-in (credential already persisted).
 * The stored credential is now one the server just accepted, so it starts out
 * confirmed; anything stamped before this is stale.
 */
export function noteNtlmLoginSucceeded(): void {
  generation++;
  tripped = false;
  confirmed = true;
}

/** Signed out: no stored credential to vouch for, and in-flight attempts are stale. */
export function noteNtlmSignedOut(): void {
  generation++;
  confirmed = false;
}

/** Back to the launch state. For tests. */
export function resetNtlmCircuitBreaker(): void {
  generation++;
  tripped = false;
  confirmed = false;
}
