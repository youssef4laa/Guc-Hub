import {
  classifyAttachment,
  fileExtension,
  isWithinSizeLimit,
  MAX_ATTACHMENT_BYTES,
  safeAttachmentFilename,
} from "../attachments";

describe("safeAttachmentFilename", () => {
  it("leaves an ordinary filename alone", () => {
    expect(safeAttachmentFilename("lecture-notes.pdf")).toBe("lecture-notes.pdf");
  });

  it("strips path separators and traversal", () => {
    expect(safeAttachmentFilename("../../etc/passwd")).toBe("etcpasswd");
    expect(safeAttachmentFilename("folder/sub\\file.pdf")).toBe("foldersubfile.pdf");
  });

  it("strips the bidi overrides used to disguise an extension", () => {
    // Renders as "invoice_exe.txt" in a naive UI, but is really an .exe.
    const RIGHT_TO_LEFT_OVERRIDE = String.fromCharCode(0x202e);
    const disguised = `invoice_${RIGHT_TO_LEFT_OVERRIDE}txt.exe`;
    const safe = safeAttachmentFilename(disguised);
    expect(safe).toBe("invoice_txt.exe");
    expect(classifyAttachment(disguised).isExecutable).toBe(true);
  });

  it("refuses to produce a hidden dot-file", () => {
    expect(safeAttachmentFilename(".bashrc")).toBe("bashrc");
    expect(safeAttachmentFilename("...hidden.txt")).toBe("hidden.txt");
  });

  it("strips control characters", () => {
    const nul = String.fromCharCode(0);
    expect(safeAttachmentFilename(`report${nul}.pdf`)).toBe("report.pdf");
  });

  it("falls back to a placeholder when nothing usable is left", () => {
    expect(safeAttachmentFilename("")).toBe("attachment");
    expect(safeAttachmentFilename("///")).toBe("attachment");
  });

  it("caps the length but keeps the extension", () => {
    const safe = safeAttachmentFilename(`${"a".repeat(300)}.pdf`);
    expect(safe.length).toBeLessThanOrEqual(120);
    expect(safe.endsWith(".pdf")).toBe(true);
  });
});

describe("classifyAttachment", () => {
  it("flags executables by extension, not by claimed type", () => {
    expect(classifyAttachment("setup.exe").isExecutable).toBe(true);
    expect(classifyAttachment("script.sh").isExecutable).toBe(true);
    expect(classifyAttachment("app.apk").isExecutable).toBe(true);
    expect(classifyAttachment("notes.pdf").isExecutable).toBe(false);
  });

  it("notices a double extension used as a disguise", () => {
    expect(classifyAttachment("report.pdf.exe")).toMatchObject({
      extension: "exe",
      isExecutable: true,
      hasDoubleExtension: true,
    });
    expect(classifyAttachment("report.pdf").hasDoubleExtension).toBe(false);
  });

  it("names what could be previewed", () => {
    expect(classifyAttachment("photo.JPG").previewKind).toBe("image");
    expect(classifyAttachment("slides.pdf").previewKind).toBe("pdf");
    expect(classifyAttachment("data.csv").previewKind).toBe("text");
    expect(classifyAttachment("archive.zip").previewKind).toBe("other");
  });
});

describe("fileExtension", () => {
  it("reads the last extension, lowercased", () => {
    expect(fileExtension("Report.PDF")).toBe("pdf");
    expect(fileExtension("no-extension")).toBe("");
  });
});

describe("isWithinSizeLimit", () => {
  it("accepts normal sizes and rejects oversized or nonsense ones", () => {
    expect(isWithinSizeLimit(1024)).toBe(true);
    expect(isWithinSizeLimit(MAX_ATTACHMENT_BYTES)).toBe(true);
    expect(isWithinSizeLimit(MAX_ATTACHMENT_BYTES + 1)).toBe(false);
    expect(isWithinSizeLimit(-1)).toBe(false);
    expect(isWithinSizeLimit(Number.NaN)).toBe(false);
  });
});
