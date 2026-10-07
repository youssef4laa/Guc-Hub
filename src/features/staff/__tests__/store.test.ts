import { mockStaffSource } from "../mock";
import { searchStaff } from "../store";

describe("searchStaff", () => {
  it("matches by name, department and course code, ignoring case", async () => {
    const staff = await mockStaffSource.fetch();
    expect(searchStaff(staff, "mona").map((s) => s.id)).toEqual(["1"]);
    expect(searchStaff(staff, "MATHEMATICS").map((s) => s.id)).toEqual(["2"]);
    expect(searchStaff(staff, "csen 403").map((s) => s.id)).toEqual(["3", "4"]);
  });

  it("returns everyone for an empty query and no one for a miss", async () => {
    const staff = await mockStaffSource.fetch();
    expect(searchStaff(staff, "  ")).toHaveLength(staff.length);
    expect(searchStaff(staff, "zzz")).toEqual([]);
  });
});

describe("mock source", () => {
  it("only uses reserved .invalid addresses", async () => {
    for (const person of await mockStaffSource.fetch()) {
      expect(person.email.endsWith(".invalid")).toBe(true);
    }
  });
});
