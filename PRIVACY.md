# Privacy Policy for Summarizer

**Last Updated:** April 24, 2026

This Privacy Policy describes how the **Summarizer** Chrome extension ("the
Extension") handles your information.

## Short version

- **On-device by default.** When Chrome's built-in Gemini Nano is available,
  the text you select never leaves your machine.
- **Cloud only when you opt in.** If on-device isn't available, the Extension
  uses Google's Gemini API — but only after you add your own API key.
- **No analytics. No tracking. No third-party scripts. No remote fonts.**

## What the Extension processes

| Data | Where it goes | Storage |
|------|---------------|---------|
| **Selected text** (the passage you ask to summarize) | On-device Nano: stays local. Cloud Gemini: sent to `generativelanguage.googleapis.com` over HTTPS. | Not persisted by the Extension. Held briefly in `chrome.storage.local` while the side panel renders, then overwritten on the next summary. |
| **Custom prompt** | Cloud-only feature. Sent alongside selected text to Gemini API when used. | `chrome.storage.sync` — may sync across your signed-in Chrome browsers. |
| **Gemini API key** (if you add one) | Sent only to `generativelanguage.googleapis.com` to authenticate Gemini API requests. Never transmitted elsewhere. | `chrome.storage.local` on the device where you saved it. Delete it any time from the Settings page. |
| **PDF handoff payload** (selected text from a PDF, when the side panel can't open) | Held in `chrome.storage.session` (in-memory, cleared on browser close) just long enough to render in the fallback tab. | Cleared immediately after the fallback tab consumes it. |
| **Length preference** (short/medium/long) | Local only. | `chrome.storage.local`. |

## Third-party services

The Extension talks to one external service, and only when you've opted into
cloud mode by adding an API key:

- **Google Gemini API** (`generativelanguage.googleapis.com`) — receives your
  selected text, the custom prompt, and your API key. Subject to
  [Google's Privacy Policy](https://policies.google.com/privacy).

When you're using on-device Gemini Nano, **no network requests are made** for
summarization.

## Data sharing

We don't share, sell, or transmit your data to anyone other than Google's
Gemini API in the case described above. There are no analytics endpoints, no
crash reporters, no telemetry.

## Permissions, in plain language

- `contextMenus` — adds the right-click "Summarize selection" item.
- `storage` — saves your prompt, length preference, and API key locally.
- `sidePanel` — opens the summary in Chrome's side panel.
- `scripting` + `activeTab` — only on keyboard-shortcut press, reads the
  currently selected text from the active tab. No background page reading.
- `optional_host_permissions` for two exact Gemini API endpoints —
  **not granted at install**. Requested only when you save a Gemini
  API key in the welcome or options page. If you use on-device Nano,
  the Extension never asks for network access.

## Changes to this policy

We may update this Policy as the Extension evolves. The current version always
lives at the top of this file, with the "Last Updated" date.

## Contact

Questions or concerns: open an issue at
[github.com/codyhxyz/chrome-text-summarizer/issues](https://github.com/codyhxyz/chrome-text-summarizer/issues).
