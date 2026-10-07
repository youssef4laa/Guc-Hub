# Screenshots

Captured on an Android emulator (Pixel-class, 1080x2400, Android 16 / API 36) from a
dev-client build in **demo mode**, so everything shown is the built-in fake data. No
real GUC account, name, ID or `guc.edu.eg` value appears in any file here. The status
bar is pinned to 9:41 with the Android demo-mode broadcast. How they were made, and
what was and wasn't tested, is in [../DEVICE_TEST_REPORT.md](../DEVICE_TEST_REPORT.md).

There are no iOS captures yet (Xcode 16.4+ is needed; see
[../DEVICE_CAPTURE.md](../DEVICE_CAPTURE.md)).

- [`demo.gif`](demo.gif): a 33 s tour (login, demo, Grades, Mail, CMS, More, Exams,
  Attendance, Transcript, Evaluations, Glide), light theme.

## Layout

`android/<light|dark>/<NN>-<name>.png`, one file per screen and theme.

| File                                   | Screen                                                           |
| -------------------------------------- | ---------------------------------------------------------------- |
| `01-login`                             | Login with the unofficial notice and **Try demo**                |
| `02-schedule`                          | Classes by day and the "Next class" card                         |
| `03-grades`                            | Colour-coded courses, semester average, one card expanded        |
| `04-cms`                               | Courses and files by type, unseen badges, **Lectures** filter on |
| `05-exams`                             | Upcoming exams with countdowns and a dimmed past exam            |
| `06-attendance`                        | On track, close to the limit, and over the limit                 |
| `07-transcript`                        | Cumulative GPA, terms by year, **2023/2024** filter on           |
| `08-staff`                             | Search box and one expanded person                               |
| `09-evaluations`                       | Ratings filled in (before **Submit all**)                        |
| `10a-glide-ready`                      | Glide ready screen                                               |
| `10b-glide-run`                        | Glide mid-run, score 1                                           |
| `10c-glide-over`                       | Glide game over with a best score of 2                           |
| `11a-more`                             | The feature list                                                 |
| `11b-settings`                         | Theme, developer tools, sign out                                 |
| `12a-ui-gallery`                       | UI gallery: text, buttons, card                                  |
| `12b-ui-gallery-states`                | UI gallery: skeleton, empty, error and `PARSE_FAILED` states     |
| `13a-mail-inbox`                       | Mail inbox with folders and sort chips                           |
| `13b-mail-reading`                     | Reading an HTML message with an attachment                       |
| `13c-mail-compose`                     | Compose with an attachment chip                                  |
| `13d-mail-multiselect`                 | Multi-select with the bulk action bar                            |
| `android/tablet/dark-13-mail-two-pane` | Mail two-pane layout on an emulated 1600x2560 display            |

## Not captured

- The Evaluations "All caught up" state after **Submit all** (the button was not
  pressed during the capture run).
- iOS, in either theme.
