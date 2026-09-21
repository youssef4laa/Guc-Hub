import type { LoginStrategy } from "./LoginStrategy";
import { FormLoginStrategy } from "./strategies/FormLoginStrategy";
import { MockLoginStrategy } from "./strategies/MockLoginStrategy";
import { NtlmLoginStrategy } from "./strategies/NtlmLoginStrategy";

/**
 * Which real strategy wins depends on docs/DISCOVERY.md Spike 1, which hasn't run
 * yet. `EXPO_PUBLIC_PORTAL_AUTH_STRATEGY` lets a developer switch once a candidate
 * is implemented, without touching this file again.
 */
export function selectLoginStrategy(): LoginStrategy {
  switch (process.env.EXPO_PUBLIC_PORTAL_AUTH_STRATEGY) {
    case "ntlm":
      return new NtlmLoginStrategy();
    case "form":
      return new FormLoginStrategy();
    case "mock":
    default:
      return new MockLoginStrategy();
  }
}
