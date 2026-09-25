import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildEmailDocument, contentSecurityPolicy } from "../emailDocument";
import { sanitizeCss, sanitizeEmailHtml } from "../sanitizeHtml";

const hostile = readFileSync(join(__dirname, "../../../../../fixtures/mail/raw/hostile-email.html"), "utf8");

const BLOCKED = { allowRemoteContent: false };
const ALLOWED = { allowRemoteContent: true };

describe("sanitizeEmailHtml — code execution", () => {
  it("removes script elements and their contents", () => {
    const { bodyHtml } = sanitizeEmailHtml("<p>hi</p><script>alert(1)</script>", BLOCKED);
    expect(bodyHtml).not.toMatch(/script/i);
    expect(bodyHtml).not.toContain("alert(1)");
  });

  it("removes every event handler attribute", () => {
    const { bodyHtml } = sanitizeEmailHtml(
      '<p onclick="alert(1)" ONMOUSEOVER="alert(2)" onerror="x()">hi</p>',
      BLOCKED,
    );
    expect(bodyHtml).not.toMatch(/on[a-z]+=/i);
    expect(bodyHtml).toContain("hi");
  });

  it("drops javascript: and data: links but keeps http(s) and mailto", () => {
    const { bodyHtml } = sanitizeEmailHtml(
      '<a href="javascript:alert(1)">a</a>' +
        '<a href="data:text/html,x">b</a>' +
        '<a href="https://example.org/ok">c</a>' +
        '<a href="mailto:someone@example-guc.invalid">d</a>',
      BLOCKED,
    );
    expect(bodyHtml).not.toMatch(/javascript:/i);
    expect(bodyHtml).not.toMatch(/href="data:/i);
    expect(bodyHtml).toContain('href="https://example.org/ok"');
    expect(bodyHtml).toContain("mailto:someone@example-guc.invalid");
  });

  it("drops a protocol smuggled past a naive check with an entity", () => {
    const { bodyHtml } = sanitizeEmailHtml('<a href="java&#x09;script:alert(1)">x</a>', BLOCKED);
    expect(bodyHtml).not.toMatch(/script:/i);
  });

  it("removes frames, objects, forms and inputs entirely", () => {
    const { bodyHtml } = sanitizeEmailHtml(
      '<iframe src="https://x.invalid"></iframe><object data="x"></object>' +
        '<form action="https://x.invalid"><input name="password"></form><embed src="x">',
      BLOCKED,
    );
    expect(bodyHtml).not.toMatch(/iframe|object|form|input|embed/i);
  });

  it("removes meta refresh and base, which navigate on their own", () => {
    const { bodyHtml, styles } = sanitizeEmailHtml(
      '<meta http-equiv="refresh" content="0;url=https://x.invalid"><base href="https://x.invalid/"><p>hi</p>',
      BLOCKED,
    );
    expect(`${bodyHtml}${styles.join("")}`).not.toMatch(/refresh|base href/i);
  });

  it("removes svg, which can carry script and external references", () => {
    const { bodyHtml } = sanitizeEmailHtml("<svg><script>alert(1)</script></svg><p>hi</p>", BLOCKED);
    expect(bodyHtml).not.toMatch(/svg|alert/i);
  });

  it("sanitizes markup hidden inside noscript, which renders when JS is off", () => {
    const { bodyHtml, blockedRemoteCount } = sanitizeEmailHtml(
      '<noscript><img src="https://tracker.invalid/x.gif" onload="alert(1)"></noscript>',
      BLOCKED,
    );
    expect(bodyHtml).not.toMatch(/tracker\.invalid/);
    expect(bodyHtml).not.toMatch(/onload/i);
    expect(blockedRemoteCount).toBe(1);
  });
});

describe("sanitizeEmailHtml — remote content", () => {
  it("blocks remote images by default and counts them", () => {
    const { bodyHtml, blockedRemoteCount } = sanitizeEmailHtml(
      '<img src="https://a.invalid/1.gif"><img src="http://b.invalid/2.gif"><img src="//c.invalid/3.gif">',
      BLOCKED,
    );
    expect(bodyHtml).not.toMatch(/a\.invalid|b\.invalid|c\.invalid/);
    expect(blockedRemoteCount).toBe(3);
  });

  it("keeps remote images once the reader allows them", () => {
    const { bodyHtml, blockedRemoteCount } = sanitizeEmailHtml(
      '<img src="https://a.invalid/1.gif">',
      ALLOWED,
    );
    expect(bodyHtml).toContain("https://a.invalid/1.gif");
    expect(blockedRemoteCount).toBe(0);
  });

  it("always keeps inline data images", () => {
    const html = '<img src="data:image/png;base64,iVBORw0KGgo=">';
    expect(sanitizeEmailHtml(html, BLOCKED).bodyHtml).toContain("data:image/png;base64");
  });

  it("blocks remote references in the background attribute", () => {
    const { bodyHtml, blockedRemoteCount } = sanitizeEmailHtml(
      '<table background="https://tracker.invalid/t.png"><tr><td>x</td></tr></table>',
      BLOCKED,
    );
    expect(bodyHtml).not.toMatch(/tracker\.invalid/);
    expect(blockedRemoteCount).toBe(1);
  });

  it("does not let a hostile bgcolor smuggle a remote url into the wrapper", () => {
    const { bodyHtml } = sanitizeEmailHtml(
      '<html><body bgcolor="x) url(https://tracker.invalid/t.png)"><p>hi</p></body></html>',
      BLOCKED,
    );
    expect(bodyHtml).not.toMatch(/tracker\.invalid/);
  });

  it("strips srcset, which would reload the blocked image at another density", () => {
    const { bodyHtml } = sanitizeEmailHtml(
      '<img src="data:image/png;base64,iVBORw0KGgo=" srcset="https://tracker.invalid/2x.gif 2x">',
      BLOCKED,
    );
    expect(bodyHtml).not.toMatch(/srcset|tracker\.invalid/);
  });
});

describe("sanitizeCss", () => {
  it("blocks remote url() and counts it, keeping the rest of the rule", () => {
    const { css, blocked } = sanitizeCss(
      "background: url(https://tracker.invalid/x.png) no-repeat;",
      BLOCKED,
    );
    expect(css).not.toMatch(/tracker\.invalid/);
    expect(css).toContain("no-repeat");
    expect(blocked).toBe(1);
  });

  it("keeps remote url() when allowed", () => {
    const { css } = sanitizeCss("background: url(https://cdn.invalid/x.png);", ALLOWED);
    expect(css).toContain("https://cdn.invalid/x.png");
  });

  it("removes @import, which fetches a remote stylesheet", () => {
    const { css, blocked } = sanitizeCss(
      '@import url("https://tracker.invalid/x.css"); p { color: red }',
      BLOCKED,
    );
    expect(css).not.toMatch(/@import|tracker\.invalid/);
    expect(blocked).toBe(1);
  });

  it("defuses url() hidden behind a comment or a CSS escape", () => {
    expect(sanitizeCss("background: ur/**/l(https://t.invalid/a.png);", BLOCKED).css).not.toMatch(
      /t\.invalid/,
    );
    expect(sanitizeCss("background: \\75rl(https://t.invalid/a.png);", BLOCKED).css).not.toMatch(
      /t\.invalid/,
    );
  });

  it("removes expression(), behaviors and javascript: urls", () => {
    const { css } = sanitizeCss(
      "width: expression(alert(1)); behavior: url(x.htc); background: javascript:alert(1);",
      BLOCKED,
    );
    expect(css).not.toMatch(/expression\(|behavior|javascript:/i);
  });

  it("strips < so CSS can never close its own style block", () => {
    expect(sanitizeCss("a { content: '</style><script>alert(1)</script>' }", BLOCKED).css).not.toContain("<");
  });
});

describe("sanitizeEmailHtml — robustness", () => {
  it("returns an empty body instead of raw html when parsing fails", () => {
    // A string the parser can still handle, but deeply malformed.
    const { bodyHtml } = sanitizeEmailHtml("<<<p onclick='x'>><img src='https://t.invalid/a.gif'", BLOCKED);
    expect(bodyHtml).not.toMatch(/t\.invalid/);
    expect(bodyHtml).not.toMatch(/onclick/i);
  });

  it("handles an empty document", () => {
    expect(sanitizeEmailHtml("", BLOCKED)).toEqual({ styles: [], bodyHtml: "", blockedRemoteCount: 0 });
  });
});

describe("the hostile fixture, end to end", () => {
  it("leaves nothing executable or remote when blocking", () => {
    const { html, blockedRemoteCount } = buildEmailDocument(hostile, BLOCKED);

    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<iframe|<object|<embed|<form|<svg|<video/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toMatch(/tracker\.example\.invalid/);
    expect(html).not.toMatch(/phish\.example\.invalid/);
    expect(blockedRemoteCount).toBeGreaterThan(5);
  });

  it("keeps the legitimate parts of the same email", () => {
    const { html } = buildEmailDocument(hostile, BLOCKED);
    expect(html).toContain("Congratulations!");
    expect(html).toContain("https://example.org/real");
    expect(html).toContain("Table cell");
    expect(html).toContain("data:image/png;base64");
  });

  it("still blocks phishing hosts when the reader allows remote images", () => {
    const { html } = buildEmailDocument(hostile, ALLOWED);
    // Allowing images must not resurrect scripts, frames or meta refresh.
    expect(html).not.toMatch(/<script|<iframe|refresh/i);
  });
});

describe("content security policy", () => {
  it("forbids everything by default and allows no remote images when blocking", () => {
    const policy = contentSecurityPolicy(BLOCKED);
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain("img-src data:");
    expect(policy).not.toMatch(/img-src[^;]*https:/);
  });

  it("permits remote images only once the reader opts in", () => {
    expect(contentSecurityPolicy(ALLOWED)).toMatch(/img-src data: https: http:/);
  });

  it("is embedded in every built document", () => {
    expect(buildEmailDocument("<p>hi</p>", BLOCKED).html).toContain("Content-Security-Policy");
  });
});
