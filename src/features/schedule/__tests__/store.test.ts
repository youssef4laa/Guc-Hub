import { findNextClass, groupByDay } from "../store";
import type { ClassSession } from "../schema";

function session(overrides: Partial<ClassSession>): ClassSession {
  return {
    id: "1",
    courseCode: "TEST 101",
    courseName: "Test Course",
    instructor: "Dr. Test",
    location: "Room 1",
    dayOfWeek: 0,
    startMinutes: 9 * 60,
    endMinutes: 10 * 60,
    type: "lecture",
    ...overrides,
  };
}

describe("findNextClass", () => {
  it("finds the next class later the same day", () => {
    const now = new Date(2024, 0, 7, 8, 0); // Sunday 08:00
    const sessions = [session({ id: "a", dayOfWeek: 0, startMinutes: 9 * 60, endMinutes: 10 * 60 })];
    expect(findNextClass(sessions, now)?.id).toBe("a");
  });

  it("skips to the next day once today's classes have ended", () => {
    const now = new Date(2024, 0, 7, 12, 0); // Sunday 12:00, after the 9-10 class
    const sessions = [
      session({ id: "a", dayOfWeek: 0, startMinutes: 9 * 60, endMinutes: 10 * 60 }),
      session({ id: "b", dayOfWeek: 1, startMinutes: 9 * 60, endMinutes: 10 * 60 }),
    ];
    expect(findNextClass(sessions, now)?.id).toBe("b");
  });

  it("returns null when there are no sessions", () => {
    expect(findNextClass([], new Date())).toBeNull();
  });
});

describe("groupByDay", () => {
  it("groups and sorts sessions within each day by start time", () => {
    const sessions = [
      session({ id: "late", dayOfWeek: 0, startMinutes: 11 * 60 }),
      session({ id: "early", dayOfWeek: 0, startMinutes: 9 * 60 }),
    ];
    const grouped = groupByDay(sessions);
    expect(grouped.get(0)?.map((s) => s.id)).toEqual(["early", "late"]);
  });
});
