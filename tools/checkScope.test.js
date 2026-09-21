const { globToRegExp, determineTrack, checkScope } = require("./checkScope");

const scope = {
  tracks: {
    portal: {
      branchPrefixes: ["portal/"],
      allow: ["src/features/schedule/**", "docs/adr/A-*", "app/(tabs)/schedule.tsx"],
    },
    mail: {
      branchPrefixes: ["mail/", "exp/"],
      allow: ["src/features/mail/**"],
    },
  },
};

describe("globToRegExp", () => {
  it("matches ** across any path depth", () => {
    const re = globToRegExp("src/features/schedule/**");
    expect(re.test("src/features/schedule/live.ts")).toBe(true);
    expect(re.test("src/features/schedule/screens/ScheduleScreen.tsx")).toBe(true);
    expect(re.test("src/features/grades/live.ts")).toBe(false);
  });

  it("matches * within a single path segment only", () => {
    const re = globToRegExp("docs/adr/A-*");
    expect(re.test("docs/adr/A-001-foo.md")).toBe(true);
    expect(re.test("docs/adr/S-001-foo.md")).toBe(false);
    expect(re.test("docs/adr/A-001/nested.md")).toBe(false);
  });

  it("escapes regex-special characters in a literal path", () => {
    const re = globToRegExp("app/(tabs)/schedule.tsx");
    expect(re.test("app/(tabs)/schedule.tsx")).toBe(true);
    expect(re.test("app/Xtabs)/scheduleXtsx")).toBe(false);
  });
});

describe("determineTrack", () => {
  it("matches a branch prefix to its track", () => {
    expect(determineTrack("portal/schedule-live-fetch", scope)).toBe("portal");
    expect(determineTrack("mail/compose-ui", scope)).toBe("mail");
    expect(determineTrack("exp/flappy-sprites", scope)).toBe("mail");
  });

  it("returns null for branches with no configured track (e.g. shared/, main)", () => {
    expect(determineTrack("shared/conflict-proofing", scope)).toBeNull();
    expect(determineTrack("main", scope)).toBeNull();
  });
});

describe("checkScope", () => {
  it("passes a portal branch touching only its own scope", () => {
    const result = checkScope({
      branch: "portal/next-class-card",
      files: ["src/features/schedule/live.ts", "app/(tabs)/schedule.tsx"],
      crossTrack: false,
      scope,
    });
    expect(result).toEqual({ ok: true, track: "portal", violations: [] });
  });

  it("fails a portal branch touching a mail file", () => {
    const result = checkScope({
      branch: "portal/oops",
      files: ["src/features/schedule/live.ts", "src/features/mail/live.ts"],
      crossTrack: false,
      scope,
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual(["src/features/mail/live.ts"]);
  });

  it("is exempt entirely on a shared/ branch", () => {
    const result = checkScope({
      branch: "shared/conflict-proofing",
      files: ["src/features/mail/live.ts", "src/features/schedule/live.ts", "package.json"],
      crossTrack: false,
      scope,
    });
    expect(result).toEqual({ ok: true, track: null, violations: [] });
  });

  it("bypasses violations when crossTrack is set", () => {
    const result = checkScope({
      branch: "portal/needs-mail-change",
      files: ["src/features/mail/live.ts"],
      crossTrack: true,
      scope,
    });
    expect(result.ok).toBe(true);
  });
});
