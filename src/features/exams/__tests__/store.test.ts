import { mockExamsSource } from "../mock";
import type { ExamsItem } from "../schema";
import { countdown, sortExams } from "../store";

function exam(id: string, startsAt: string, durationMinutes = 60): ExamsItem {
  return { id, courseCode: "T 1", courseName: "Test", kind: "quiz", startsAt, durationMinutes, room: "R" };
}

const now = new Date("2024-03-10T12:00:00Z");

describe("sortExams", () => {
  it("splits upcoming (soonest first) from past (latest first)", () => {
    const { upcoming, past } = sortExams(
      [
        exam("late", "2024-03-20T09:00:00Z"),
        exam("soon", "2024-03-11T09:00:00Z"),
        exam("old", "2024-03-01T09:00:00Z"),
        exam("older", "2024-02-01T09:00:00Z"),
      ],
      now,
    );
    expect(upcoming.map((e) => e.id)).toEqual(["soon", "late"]);
    expect(past.map((e) => e.id)).toEqual(["old", "older"]);
  });

  it("keeps an exam that is running right now as upcoming", () => {
    const { upcoming } = sortExams([exam("now", "2024-03-10T11:30:00Z", 90)], now);
    expect(upcoming).toHaveLength(1);
  });
});

describe("countdown", () => {
  it("formats days, tomorrow, hours, and in-progress", () => {
    expect(countdown("2024-03-15T12:00:00Z", now)).toBe("in 5 days");
    expect(countdown("2024-03-11T13:00:00Z", now)).toBe("tomorrow");
    expect(countdown("2024-03-10T15:00:00Z", now)).toBe("in 3h");
    expect(countdown("2024-03-10T11:00:00Z", now)).toBe("in progress");
  });
});

describe("mock source", () => {
  it("has both upcoming and past exams", async () => {
    const { upcoming, past } = sortExams(await mockExamsSource.fetch());
    expect(upcoming.length).toBeGreaterThan(2);
    expect(past.length).toBeGreaterThan(0);
  });
});
