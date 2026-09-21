# Spike 5 — Background refresh limits

**Owner:** Track B. **Blocks:** "next class changed" notifications.

**Question:** How infrequently does iOS actually invoke `expo-background-task` in
practice, and does that make silent schedule-change detection worth building?

**How to find out:** Ship a build with `registerBackgroundRefresh` logging a
timestamp to `AsyncStorage` every time it fires, install it on a real iPhone used
normally for a week, and read back the gaps.

Low priority — can run any time there's a build on a real device left running
for a few days.
