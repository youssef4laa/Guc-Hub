import { mockGradesSource } from "../mock";
import type { GradesItem } from "../schema";
import { courseResult, semesterAverage, toneFor } from "../store";

function course(overrides: Partial<GradesItem>): GradesItem {
  return { id: "1", courseCode: "T 1", courseName: "Test", creditHours: 4, components: [], ...overrides };
}

describe("courseResult", () => {
  it("scores only the graded weight", () => {
    const result = courseResult(
      course({
        components: [
          { name: "Quiz", weight: 20, score: 10, max: 20 },
          { name: "Final", weight: 80, score: null, max: 80 },
        ],
      }),
    );
    expect(result.percent).toBeCloseTo(50);
    expect(result.gradedWeight).toBe(20);
  });

  it("returns null when nothing is graded", () => {
    const result = courseResult(
      course({ components: [{ name: "Final", weight: 100, score: null, max: 100 }] }),
    );
    expect(result.percent).toBeNull();
  });
});

describe("semesterAverage", () => {
  it("weights by credit hours and skips ungraded courses", () => {
    const graded = (score: number, creditHours: number) =>
      course({ creditHours, components: [{ name: "x", weight: 100, score, max: 100 }] });
    const average = semesterAverage([graded(90, 6), graded(60, 2), course({ creditHours: 4 })]);
    expect(average).toBeCloseTo(82.5);
  });

  it("is null with no graded courses", () => {
    expect(semesterAverage([])).toBeNull();
  });
});

describe("toneFor", () => {
  it.each([
    [90, "success"],
    [75, "primary"],
    [62, "warning"],
    [40, "danger"],
    [null, "primary"],
  ] as const)("%s -> %s", (percent, tone) => {
    expect(toneFor(percent)).toBe(tone);
  });
});

describe("mock source", () => {
  it("returns schema-valid courses", async () => {
    const courses = await mockGradesSource.fetch();
    expect(courses.length).toBeGreaterThan(3);
    for (const c of courses) {
      const total = c.components.reduce((sum, comp) => sum + comp.weight, 0);
      expect(total).toBe(100);
    }
  });
});
