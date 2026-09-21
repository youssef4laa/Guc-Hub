# Spike 2 — Mail protocol

**Owner:** Track B. **Blocks:** `mail`.

**Question:** IMAP/SMTP, Exchange Web Services (EWS), or Microsoft Graph
(if GUC mail is Office 365)?

**Why it matters:** IMAP/SMTP need a raw TCP socket library on React Native (none
of this is plain HTTPS). EWS is SOAP-over-HTTPS — usable through `core/http`
directly. Graph is a clean REST API over HTTPS — also usable through `core/http`,
and by far the least work if it applies.

**How to find out:** Check whether GUC webmail is Office 365 / Outlook Web Access
(look at the webmail URL and page source for `outlook.office365.com` or similar).
If so, it's almost certainly Graph or EWS. If it's a bespoke webmail, capture its
network traffic the same way as
[spike-1-portal-auth.md](spike-1-portal-auth.md).

Can run in parallel with Spikes 1/3 if a second person is available — it doesn't
depend on the portal auth answer, only on the mail login, which may or may not
be the same system.
