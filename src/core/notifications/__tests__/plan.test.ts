import {
  DEFAULT_REMINDER_BUDGET,
  limitReminders,
  nextWeeklyOccurrence,
  planDatedReminders,
  planWeeklyReminders,
  zonedWallClockToInstant,
  type ReminderInput,
} from "../plan";

const CAIRO = "Africa/Cairo";

/** What a fire time reads as on a clock in Cairo — the only thing the student sees. */
function cairoClock(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: CAIRO,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

describe("zonedWallClockToInstant", () => {
  it("resolves a Cairo wall-clock time during summer time (UTC+3)", () => {
    const instant = zonedWallClockToInstant({ year: 2026, month: 9, day: 21, minutes: 9 * 60 }, CAIRO);
    expect(instant.toISOString()).toBe("2026-09-21T06:00:00.000Z");
  });

  it("resolves the same wall-clock time in winter (UTC+2)", () => {
    const instant = zonedWallClockToInstant({ year: 2026, month: 12, day: 21, minutes: 9 * 60 }, CAIRO);
    expect(instant.toISOString()).toBe("2026-12-21T07:00:00.000Z");
  });
});

describe("nextWeeklyOccurrence", () => {
  // Sunday 27 September 2026, 08:00 in Cairo.
  const sundayMorning = new Date("2026-09-27T05:00:00Z");

  it("finds a slot later the same day", () => {
    const next = nextWeeklyOccurrence(0, 9 * 60, { now: sundayMorning, timeZone: CAIRO });
    expect(cairoClock(next)).toBe("Sun 27/09, 09:00");
  });

  it("rolls to next week once today's slot has passed", () => {
    const afterClass = new Date("2026-09-27T07:00:00Z"); // 10:00 Cairo
    const next = nextWeeklyOccurrence(0, 9 * 60, { now: afterClass, timeZone: CAIRO });
    expect(cairoClock(next)).toBe("Sun 04/10, 09:00");
  });

  it("finds the next matching weekday", () => {
    const next = nextWeeklyOccurrence(3, 13 * 60, { now: sundayMorning, timeZone: CAIRO });
    expect(cairoClock(next)).toBe("Wed 30/09, 13:00");
  });

  it("keeps the class at the same Cairo clock time across the end of summer time", () => {
    // Egypt ends summer time in late October; a 09:00 class stays 09:00.
    const beforeChange = new Date("2026-10-25T06:00:00Z");
    const next = nextWeeklyOccurrence(0, 9 * 60, { now: beforeChange, timeZone: CAIRO });
    expect(cairoClock(next)).toBe("Sun 01/11, 09:00");
    // 09:00 Cairo is 07:00 UTC once the clocks have gone back — an hour later in
    // absolute terms than the same wall-clock slot a week earlier.
    expect(next.toISOString()).toBe("2026-11-01T07:00:00.000Z");
  });
});

describe("planWeeklyReminders", () => {
  const now = new Date("2026-09-27T05:00:00Z"); // Sunday 08:00 Cairo
  const spec = {
    id: "class:CSEN401:0",
    title: "CSEN 401 starts in 10 minutes",
    body: "Computer Networks — C7.201",
    dayOfWeek: 0,
    startMinutes: 9 * 60,
  };

  it("fires the configured number of minutes before the class", () => {
    const [reminder] = planWeeklyReminders([spec], { now, minutesBefore: 10, timeZone: CAIRO });
    expect(cairoClock(reminder.fireAt)).toBe("Sun 27/09, 08:50");
    expect(reminder.id).toBe("class:CSEN401:0");
  });

  it("can schedule several weeks ahead, with one id per occurrence", () => {
    const reminders = planWeeklyReminders([spec], { now, weeksAhead: 3, timeZone: CAIRO });
    expect(reminders.map((r) => cairoClock(r.fireAt))).toEqual([
      "Sun 27/09, 08:50",
      "Sun 04/10, 08:50",
      "Sun 11/10, 08:50",
    ]);
    expect(new Set(reminders.map((r) => r.id)).size).toBe(3);
  });

  it("skips an occurrence whose reminder time has already passed", () => {
    // 08:55 Cairo — five minutes after the 08:50 reminder would have fired.
    const late = new Date("2026-09-27T05:55:00Z");
    const [reminder] = planWeeklyReminders([spec], { now: late, minutesBefore: 10, timeZone: CAIRO });
    expect(cairoClock(reminder.fireAt)).toBe("Sun 04/10, 08:50");
  });
});

describe("planDatedReminders", () => {
  const now = new Date("2026-09-27T05:00:00Z");

  it("fires before a one-off event such as an exam", () => {
    const [reminder] = planDatedReminders(
      [{ id: "exam:1", title: "CSEN 401 midterm", body: "Check the room", at: "2026-10-18T09:00:00+03:00" }],
      { now, minutesBefore: 60 },
    );
    expect(cairoClock(reminder.fireAt)).toBe("Sun 18/10, 08:00");
  });

  it("drops events in the past and unparseable dates", () => {
    const reminders = planDatedReminders(
      [
        { id: "old", title: "t", body: "b", at: "2026-09-01T09:00:00+03:00" },
        { id: "bad", title: "t", body: "b", at: "not a date" },
      ],
      { now },
    );
    expect(reminders).toEqual([]);
  });
});

describe("limitReminders", () => {
  function reminder(minutesFromNow: number): ReminderInput {
    return {
      id: `r${minutesFromNow}`,
      title: "t",
      body: "b",
      fireAt: new Date(Date.now() + minutesFromNow * 60_000),
    };
  }

  it("keeps the soonest reminders, because iOS discards the rest", () => {
    const kept = limitReminders([reminder(30), reminder(10), reminder(20)], 2);
    expect(kept.map((r) => r.id)).toEqual(["r10", "r20"]);
  });

  it("defaults to a budget well under the platform limit of 64", () => {
    const many = Array.from({ length: 100 }, (_, i) => reminder(i + 1));
    expect(limitReminders(many)).toHaveLength(DEFAULT_REMINDER_BUDGET);
  });

  it("does not mutate its input", () => {
    const input = [reminder(30), reminder(10)];
    limitReminders(input, 1);
    expect(input.map((r) => r.id)).toEqual(["r30", "r10"]);
  });
});
