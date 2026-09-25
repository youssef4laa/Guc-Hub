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
 */
let tripped = false;

export function isNtlmCircuitTripped(): boolean {
  return tripped;
}

export function tripNtlmCircuitBreaker(): void {
  tripped = true;
}

export function resetNtlmCircuitBreaker(): void {
  tripped = false;
}
