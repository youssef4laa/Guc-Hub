import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- plain-JS config plugin (see app.config.ts)
const portalPlugins = require("../../../../../config/plugins.portal.js");
const { networkSecurityConfigXml, readVerifiedCert, EXPECTED_SHA256, TRUST_ANCHOR_HOST } =
  portalPlugins._internals;

describe("Android trust anchor for student.guc.edu.eg (ADR A-001)", () => {
  it("accepts the committed intermediate, whose fingerprint matches", () => {
    expect(readVerifiedCert()).toContain("BEGIN CERTIFICATE");
    expect(EXPECTED_SHA256).toBe("8C54C334B66BA4E426772AF4A3F9136C19A1AEC729FDB28C535C07A5A4EF22E0");
  });

  it("refuses any other certificate file", () => {
    const committed = readVerifiedCert();
    // Flip one base64 character inside the body: still parses as PEM, different bytes.
    const lines = committed.split("\n");
    const i = 3;
    lines[i] = (lines[i]![0] === "A" ? "B" : "A") + lines[i]!.slice(1);
    const tampered = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "guc-")), "x.pem");
    fs.writeFileSync(tampered, lines.join("\n"));
    expect(() => readVerifiedCert(tampered)).toThrow(/Refusing to trust/);
  });

  it("scopes the extra anchor to exactly one host, keeping system anchors", () => {
    const xml: string = networkSecurityConfigXml({ debug: false });
    expect(TRUST_ANCHOR_HOST).toBe("student.guc.edu.eg");
    expect(xml).toContain('<domain includeSubdomains="false">student.guc.edu.eg</domain>');
    expect(xml.match(/<domain /g)).toHaveLength(1);
    expect(xml.match(/src="system"/g)).toHaveLength(2);
    expect(xml).not.toMatch(/src="user"|debug-overrides|overridePins/);
  });

  it("keeps cleartext off in release; debug only reopens it for the base config (Metro)", () => {
    const release: string = networkSecurityConfigXml({ debug: false });
    const debug: string = networkSecurityConfigXml({ debug: true });
    expect(release).not.toContain('cleartextTrafficPermitted="true"');
    expect(debug).toContain('<base-config cleartextTrafficPermitted="true">');
    expect(debug).toContain('<domain-config cleartextTrafficPermitted="false">');
  });

  it("is registered as a Track A config plugin", () => {
    expect(Array.isArray(portalPlugins)).toBe(true);
    expect(portalPlugins.map((p: { name: string }) => p.name)).toContain("withGucTrustAnchor");
  });
});
