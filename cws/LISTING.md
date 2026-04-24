# Chrome Web Store listing — v1.1.0

All copy below is ready to paste into the CWS dashboard at
<https://chrome.google.com/webstore/devconsole>.

---

## Name

```
Webpage Summarizer — on-device summaries of any article or PDF
```

> Keep the CWS store name under 75 chars. The manifest-level name
> (`Webpage Summarizer`) does not need to match — the store name is
> what users see in the tile.

## Short description (max 132 chars)

```
Read less. Get the gist of any article, PDF, or page in a click — runs on-device when available.
```

_(96 chars)_

## Category

Productivity

## Language

English (United States)

## Detailed description

```
Select any passage. Right-click. Read the gist.

Summarizer is a focused Chrome extension for summarizing text on any
page — articles, long emails, docs, PDFs. Pick text, right-click, and
the summary streams into Chrome's side panel. No tabs, no copy-paste.

→ Runs on your machine by default
When Chrome 138+ is installed on supported hardware, every summary is
produced by the built-in Gemini Nano model. Nothing leaves your
device. No network request. No cost. No account.

→ Falls back to the cloud when needed
On older Chromes or hardware without on-device AI, Summarizer uses
Google's Gemini API with your own key. The extension asks for your
key only when it needs to; on-device users never see an API key field.

→ Three summary lengths, on demand
Short for a one-line TL;DR. Medium for a paragraph. Long for a
detailed recap or bulleted recap. Switch any time — the summary
regenerates in place.

→ Streaming + stop + regenerate
Summaries stream token-by-token so you start reading in under a
second. Stop any time. Regenerate at a different length or with a
different prompt.

→ PDF support
Selections on local and remote PDFs open a full-tab summary. The same
layout as the side panel, just sized for reading.

→ Keyboard shortcut
Ctrl+Shift+S (Windows / Linux) or ⌘⇧S (macOS). Customize it at
chrome://extensions/shortcuts.

→ Guided first-run
A three-step welcome page walks you through setup: detects whether
your browser has on-device AI, installs it with one click if not, or
links you to Google AI Studio to get a free API key.

→ No telemetry. No remote fonts. No tracking.
The extension talks to exactly one external service — Google's Gemini
API — and only when you have opted into cloud mode by saving a key.

Open source. MIT-licensed.
https://github.com/codyhxyz/webpage-summarizer
```

## Permissions justifications (for CWS review form)

| Permission | Justification |
|---|---|
| `contextMenus` | Adds the right-click "Summarize selection" menu item so users can invoke the extension from any selection on any page. This is the primary entry point. |
| `storage` | Persists the user's Gemini API key in `chrome.storage.local` (device-only), their custom prompt in `chrome.storage.sync`, and their short/medium/long length preference in `chrome.storage.local`. Also used for a short-lived PDF handoff payload via `chrome.storage.session`, which is cleared as soon as the fallback tab reads it. |
| `sidePanel` | Opens the summary in Chrome's side panel so the source article stays visible next to the summary. Required for the extension's core reading UX. |
| `scripting` | Used **only** when the user presses the keyboard shortcut (`Ctrl+Shift+S` / `⌘⇧S`). At that moment the extension runs a single, inline function via `chrome.scripting.executeScript` that returns `window.getSelection().toString()` from the active tab so the selection can be summarized. No scripts are injected at any other time and no DOM is modified. |
| `activeTab` | Pairs with `scripting` on that same shortcut press. Chrome's `activeTab` grants the extension temporary host access to the currently active tab for the duration of that single user gesture, then revokes it. This is how we avoid asking for broad host access just to read the user's current text selection via the keyboard. |
| **Optional** host: `generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:{generateContent,streamGenerateContent}` | Declared as `optional_host_permissions`, not granted at install. The extension requests it only when the user chooses the cloud-Gemini path by pasting and saving an API key in the welcome page or options page. Users who rely on the on-device Gemini Nano backend never need to grant this permission. Two exact URL patterns — the extension cannot reach any other host, including other Google endpoints. |

## Single-purpose description (for CWS review form)

```
Summarize the user's current text selection. That is the only thing
the extension does — every surface (side panel, popup, shortcut, PDF
fallback tab) is a variant of displaying that summary.
```

## Privacy practices disclosure

Collected data types: none that leave the device, except as follows.

- **User-provided content** — when the user has enabled cloud mode by
  saving a Gemini API key, the text they select is sent to
  `generativelanguage.googleapis.com` for the purpose of producing
  the summary. Required to provide functionality. Not sold or
  transferred. Not used for tracking.
- **Authentication information** — the Gemini API key the user pastes
  is stored in `chrome.storage.local` on their device and sent only
  to `generativelanguage.googleapis.com` to authenticate their
  requests. Required to provide functionality. Not sold or
  transferred. Not used for tracking.

Privacy policy URL: _(host `PRIVACY.md` on GitHub Pages, or link to
the raw GitHub URL — see `cws/SUBMIT.md` for the exact steps)_

## Search tags (suggestions)

`summarize`, `ai`, `gemini`, `nano`, `read`, `tldr`, `on-device`, `pdf`, `side panel`

## Version notes (for the submission itself)

```
v1.1.0 — On-device by default.

• On-device Gemini Nano (Chrome 138+) becomes the primary summarizer.
  Every summary runs locally. No network, no account, no cost.
• Streaming — summaries appear token-by-token as they're produced.
• Stop / regenerate / Short-Medium-Long length control.
• Keyboard shortcut: Ctrl+Shift+S (Windows/Linux) or ⌘⇧S (macOS).
• PDF fallback now uses chrome.storage.session instead of URL params.
• Guided first-run onboarding.
• Fully redesigned UI — lightweight, no-frills, black-and-white.
• Privacy policy rewritten in plain language.
```
