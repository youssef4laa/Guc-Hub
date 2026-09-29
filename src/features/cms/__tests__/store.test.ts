import { mockCmsSource } from "../mock";
import type { CmsFile } from "../schema";
import { filterFiles, isUnseen, relativeDays, unseenCount } from "../store";

const files: CmsFile[] = [
  { id: "a", title: "A", type: "lecture", postedAt: "2024-01-01T00:00:00Z", seen: true },
  { id: "b", title: "B", type: "assignment", postedAt: "2024-01-03T00:00:00Z", seen: false },
  { id: "c", title: "C", type: "lecture", postedAt: "2024-01-02T00:00:00Z", seen: false },
];

describe("filterFiles", () => {
  it("returns everything newest-first for 'all'", () => {
    expect(filterFiles(files, "all").map((f) => f.id)).toEqual(["b", "c", "a"]);
  });

  it("filters by type", () => {
    expect(filterFiles(files, "lecture").map((f) => f.id)).toEqual(["c", "a"]);
  });
});

describe("unseen tracking", () => {
  it("counts unseen files, excluding ones opened locally", () => {
    const courses = [{ id: "1", courseCode: "X", courseName: "X", files }];
    expect(unseenCount(courses, new Set())).toBe(2);
    expect(unseenCount(courses, new Set(["b"]))).toBe(1);
    expect(isUnseen(files[0], new Set())).toBe(false);
  });
});

describe("relativeDays", () => {
  const now = new Date("2024-01-10T12:00:00Z");
  it("formats today, yesterday and older", () => {
    expect(relativeDays("2024-01-10T08:00:00Z", now)).toBe("today");
    expect(relativeDays("2024-01-09T08:00:00Z", now)).toBe("yesterday");
    expect(relativeDays("2024-01-05T12:00:00Z", now)).toBe("5 days ago");
  });
});

describe("mock source", () => {
  it("has at least one unseen file so the badge is visible", async () => {
    const courses = await mockCmsSource.fetch();
    expect(unseenCount(courses, new Set())).toBeGreaterThan(0);
  });
});
