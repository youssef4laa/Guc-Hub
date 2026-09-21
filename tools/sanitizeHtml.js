#!/usr/bin/env node
/**
 * Pure sanitization logic, split from the CLI so it's directly unit-testable
 * (see sanitizeHtml.test.js). Strips the shapes of data that must never be
 * committed from a captured GUC page: email addresses, GUC-shaped student IDs,
 * and long token/cookie-looking attribute values. This is a safety net, not a
 * substitute for a human skim before committing — names in free text can't be
 * reliably regexed out.
 */

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// GUC student IDs are commonly 6-9 digits (e.g. "48-1234"-style or plain numeric).
const STUDENT_ID_PATTERN = /\b\d{2}-\d{4,5}\b|\b\d{6,9}\b/g;

// Any input/meta tag whose attributes mention a token-ish keyword anywhere
// (name="csrf_token", id="__VIEWSTATE", etc.) — its value attribute gets redacted.
const TOKEN_TAG_PATTERN = /<(?:input|meta)\b[^>]*\b(?:token|session|viewstate|csrf|auth)[^>]*>/gi;
const VALUE_ATTR_PATTERN = /(value|content)=(["'])[^"']*\2/i;

function sanitizeHtml(html) {
  return html
    .replace(EMAIL_PATTERN, "student@example-guc.invalid")
    .replace(STUDENT_ID_PATTERN, "00-00000")
    .replace(TOKEN_TAG_PATTERN, (tag) => tag.replace(VALUE_ATTR_PATTERN, '$1="REDACTED"'));
}

function containsRealLookingEmail(html) {
  const matches = html.match(EMAIL_PATTERN) ?? [];
  return matches.some((email) => !email.endsWith("@example-guc.invalid"));
}

module.exports = { sanitizeHtml, containsRealLookingEmail };
