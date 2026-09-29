import { mockAttendanceSource } from "../mock";
import type { AttendanceItem } from "../schema";
import { absences, attendancePercent, statusFor } from "../store";

const base: AttendanceItem = {
  id: "1",
  courseCode: "T 1",
  courseName: "Test",
  held: 20,
  attended: 20,
  allowedAbsences: 4,
};

describe("attendance", () => {
  it("computes absences and percent", () => {
    const item = { ...base, attended: 16 };
    expect(absences(item)).toBe(4);
    expect(attendancePercent(item)).toBe(80);
  });

  it("treats a course with no sessions as fully attended", () => {
    expect(attendancePercent({ ...base, held: 0, attended: 0 })).toBe(100);
  });

  it("is ok well under the allowance and warns one absence before it", () => {
    expect(statusFor({ ...base, attended: 20 })).toBe("ok");
    expect(statusFor({ ...base, attended: 18 })).toBe("ok"); // 2 missed
    expect(statusFor({ ...base, attended: 17 })).toBe("warning"); // 3 missed, limit 4
  });

  it("flags danger once over the allowance", () => {
    expect(statusFor({ ...base, attended: 15 })).toBe("danger");
  });
});

describe("mock source", () => {
  it("covers ok, warning and danger states for the demo", async () => {
    const statuses = new Set((await mockAttendanceSource.fetch()).map(statusFor));
    expect(statuses).toEqual(new Set(["ok", "warning", "danger"]));
  });
});
