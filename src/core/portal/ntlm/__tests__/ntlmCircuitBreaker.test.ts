import {
  confirmStoredCredential,
  currentNtlmLoginGeneration,
  isNtlmCircuitTripped,
  isStoredCredentialConfirmed,
  noteNtlmLoginSucceeded,
  noteNtlmSignedOut,
  resetNtlmCircuitBreaker,
  tripNtlmCircuitBreaker,
} from "../ntlmCircuitBreaker";

describe("ntlmCircuitBreaker", () => {
  afterEach(() => {
    resetNtlmCircuitBreaker();
  });

  it("starts untripped and unconfirmed", () => {
    expect(isNtlmCircuitTripped()).toBe(false);
    expect(isStoredCredentialConfirmed()).toBe(false);
  });

  it("stays tripped across repeated trips until reset", () => {
    tripNtlmCircuitBreaker();
    tripNtlmCircuitBreaker();
    expect(isNtlmCircuitTripped()).toBe(true);
    resetNtlmCircuitBreaker();
    expect(isNtlmCircuitTripped()).toBe(false);
  });

  it("confirms only for the current generation, and a trip clears the confirmation", () => {
    const stamp = currentNtlmLoginGeneration();
    confirmStoredCredential(stamp);
    expect(isStoredCredentialConfirmed()).toBe(true);
    tripNtlmCircuitBreaker(stamp);
    expect(isStoredCredentialConfirmed()).toBe(false);
  });

  it("ignores a trip or confirmation stamped before a sign-in", () => {
    const stale = currentNtlmLoginGeneration();
    noteNtlmLoginSucceeded();
    expect(tripNtlmCircuitBreaker(stale)).toBe(false);
    expect(isNtlmCircuitTripped()).toBe(false);

    noteNtlmSignedOut();
    confirmStoredCredential(stale);
    expect(isStoredCredentialConfirmed()).toBe(false);
  });

  it("a successful sign-in clears the trip and confirms; signing out unconfirms", () => {
    tripNtlmCircuitBreaker();
    noteNtlmLoginSucceeded();
    expect(isNtlmCircuitTripped()).toBe(false);
    expect(isStoredCredentialConfirmed()).toBe(true);
    noteNtlmSignedOut();
    expect(isStoredCredentialConfirmed()).toBe(false);
  });
});
