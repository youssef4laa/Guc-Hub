import { mockEvaluationsSource } from "../mock";
import type { EvaluationsItem } from "../schema";
import { canSubmit, pending, rateAll } from "../store";

const items: EvaluationsItem[] = [
  { id: "a", courseCode: "A", courseName: "A", instructor: "X", submitted: false },
  { id: "b", courseCode: "B", courseName: "B", instructor: "Y", submitted: true },
  { id: "c", courseCode: "C", courseName: "C", instructor: "Z", submitted: false },
];

describe("evaluations", () => {
  it("only lists unsubmitted evaluations as pending", () => {
    expect(pending(items).map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("rateAll fills every pending item and clamps the rating", () => {
    expect(rateAll(items, 4)).toEqual({ a: 4, c: 4 });
    expect(rateAll(items, 9)).toEqual({ a: 5, c: 5 });
    expect(rateAll(items, 0)).toEqual({ a: 1, c: 1 });
  });

  it("can submit only when all pending items are rated", () => {
    expect(canSubmit(items, { a: 5 })).toBe(false);
    expect(canSubmit(items, { a: 5, c: 3 })).toBe(true);
  });

  it("cannot submit when nothing is pending", () => {
    expect(canSubmit([items[1]], {})).toBe(false);
  });
});

describe("mock source", () => {
  it("has pending and already-submitted evaluations", async () => {
    const all = await mockEvaluationsSource.fetch();
    expect(pending(all).length).toBeGreaterThan(0);
    expect(pending(all).length).toBeLessThan(all.length);
  });
});
