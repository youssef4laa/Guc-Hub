import { aggregateHosts } from "../aggregateHosts";

describe("aggregateHosts", () => {
  it("flattens and dedupes every feature's declared hosts", () => {
    expect(aggregateHosts([["a.example"], ["b.example", "a.example"], []])).toEqual([
      "a.example",
      "b.example",
    ]);
  });

  it("drops empty/undefined entries", () => {
    expect(aggregateHosts([[], []])).toEqual([]);
  });
});

describe("a feature's own hosts.ts is picked up by the generated aggregate", () => {
  const ORIGINAL_ENV = process.env.EXPO_PUBLIC_GUC_PORTAL_HOST;

  afterEach(() => {
    process.env.EXPO_PUBLIC_GUC_PORTAL_HOST = ORIGINAL_ENV;
    jest.resetModules();
  });

  it("includes schedule's declared portal host once EXPO_PUBLIC_GUC_PORTAL_HOST is set", () => {
    process.env.EXPO_PUBLIC_GUC_PORTAL_HOST = "portal.test.invalid";
    jest.resetModules();

    // schedule/hosts.ts reads process.env at import time, same as hosts.generated.ts does.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- needs a fresh read of process.env
    const { hosts: scheduleHosts } = require("../../../features/schedule/hosts");
    expect(scheduleHosts).toContain("portal.test.invalid");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { featureHosts } = require("../hosts.generated");
    expect(featureHosts).toContain("portal.test.invalid");
  });
});
