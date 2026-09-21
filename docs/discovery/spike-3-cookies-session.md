# Spike 3 — Cookie/session handling on iOS vs. Android

**Owner:** Track A. **Blocks:** any live fetch.

**Question:** Once logged in, does the portal set a simple session cookie
`core/http`'s fetch wrapper can just resend, or does it also key sessions to
IP/user-agent/something else that behaves differently per platform?

**How to find out:** After
[spike-1-portal-auth.md](spike-1-portal-auth.md) produces a working login,
make a second request reusing the captured cookie from a different network
condition (e.g. wifi to cellular) and see if the session survives. Test on both
a real iPhone and a real Android device — `fetch`'s cookie jar behavior has
historically differed slightly between the two RN platforms.

Run this right after Spike 1, on the same device/login.
