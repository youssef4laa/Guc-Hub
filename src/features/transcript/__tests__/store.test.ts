import { mockTranscriptSource } from "../mock";
import type { TranscriptItem } from "../schema";
import { gpa, termsForYear, totalCredits, yearsOf } from "../store";

const terms: TranscriptItem[] = [
  {
    id: "1",
    year: "2023/2024",
    term: "S1",
    courses: [
      { code: "A", name: "A", creditHours: 6, grade: "A", points: 4 },
      { code: "B", name: "B", creditHours: 2, grade: "C", points: 2 },
    ],
  },
  {
    id: "2",
    year: "2022/2023",
    term: "S1",
    courses: [{ code: "C", name: "C", creditHours: 4, grade: "B", points: 3 }],
  },
];

describe("transcript maths", () => {
  it("weights GPA by credit hours", () => {
    expect(gpa(terms)).toBeCloseTo((4 * 6 + 2 * 2 + 3 * 4) / 12);
    expect(gpa([])).toBeNull();
  });

  it("sums credits", () => {
    expect(totalCredits(terms)).toBe(12);
  });

  it("lists years sorted and filters by year", () => {
    expect(yearsOf(terms)).toEqual(["2022/2023", "2023/2024"]);
    expect(termsForYear(terms, "2022/2023").map((t) => t.id)).toEqual(["2"]);
    expect(termsForYear(terms, "all")).toHaveLength(2);
  });
});

describe("mock source", () => {
  it("spans more than one year so the filter is meaningful", async () => {
    expect(yearsOf(await mockTranscriptSource.fetch()).length).toBeGreaterThan(1);
  });
});
