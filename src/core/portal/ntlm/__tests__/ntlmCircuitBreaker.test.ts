import { isNtlmCircuitTripped, resetNtlmCircuitBreaker, tripNtlmCircuitBreaker } from "../ntlmCircuitBreaker";

describe("ntlmCircuitBreaker", () => {
  afterEach(() => {
    resetNtlmCircuitBreaker();
  });

  it("starts untripped", () => {
    expect(isNtlmCircuitTripped()).toBe(false);
  });

  it("stays tripped across repeated trips until reset", () => {
    tripNtlmCircuitBreaker();
    tripNtlmCircuitBreaker();
    expect(isNtlmCircuitTripped()).toBe(true);
    resetNtlmCircuitBreaker();
    expect(isNtlmCircuitTripped()).toBe(false);
  });
});
