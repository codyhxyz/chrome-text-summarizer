# Chrome Web Store listing — v1.1.0

All copy below is ready to paste into the CWS dashboard at
<https://chrome.google.com/webstore/devconsole>.

---

## Name

```
Summarizer — quick summaries of anything you read
```

> Keep the CWS store name under 75 chars. The manifest-level name
> (`AI Text Summarizer`) does not need to match — the store name is
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
https://github.com/codyhxyz/chrome-text-summarizer
```

## Permissions justifications (for CWS review form)

| Permission | Justification |
|---|---|
| `contextMenus` | Adds the right-click "Summarize selection" menu item. |
| `storage` | Persists your API key (local), your custom prompt (synced), and your length preference (local). Also used for a short-lived PDF handoff via `storage.session`. |
| `sidePanel` | Opens the summary in Chrome's side panel so the article stays visible next to it. |
| `scripting` | Used only when the keyboard shortcut fires, to read the active tab's current text selection via `window.getSelection()`. No other scripts injected. |
| `activeTab` | Pairs with `scripting` on shortcut press — grants temporary access to the currently active tab so the selection can be read. Revoked after each use. |
| Host: `generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:*` | Only target when the user has opted into cloud Gemini by saving an API key. No other hosts. |

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
