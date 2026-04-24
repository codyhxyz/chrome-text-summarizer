# Summarizer

> Read less. Get the gist of any article, PDF, or page in a click.

A focused Chrome extension for summarizing selected text. Runs **on-device by
default** using Chrome's built-in Gemini Nano (Chrome 138+, no network, no
account, no cost). Falls back to the Gemini API with your own key when
on-device isn't available.

## Highlights

- **On-device first.** When Gemini Nano is available, summaries never leave
  your machine.
- **Streaming.** Tokens appear as they're produced — no spinners.
- **Stop / Regenerate / Length control.** Short, medium, or long, on demand.
- **Right-click or shortcut.** `⌘⇧S` (mac) / `Ctrl+Shift+S` (win/linux).
- **PDF support.** Selection on local or remote PDFs falls back to a tab.
- **Guided onboarding.** First-run page walks you through provider setup.
- **No telemetry. No remote fonts. No tracking.**

## Install

### From source (developer mode)

1. Clone:
   ```bash
   git clone https://github.com/codyhxyz/webpage-summarizer.git
   ```
2. Open `chrome://extensions/`, enable **Developer mode**, click
   **Load unpacked**, point at the cloned directory.
3. The first-run **Welcome** tab opens automatically and walks you through
   provider setup.

### From the Chrome Web Store

_Coming._

## Use it

1. **Select** text on any page (or in a PDF).
2. **Right-click** → _Summarize selection_, or press `⌘⇧S` / `Ctrl+Shift+S`.
3. The summary streams into the **side panel**. PDF pages get a fallback tab.
4. Pick **Short / Medium / Long** at the bottom; **Copy** when done.

## Provider modes

| Mode | When it's used | What goes over the network |
|------|----------------|----------------------------|
| **On-device · Gemini Nano** | Chrome 138+ on supported hardware | Nothing |
| **Cloud · Gemini API** | When Nano isn't installed and you've added an API key | Selected text → Google's Gemini API |

The welcome page detects your situation and guides you to the right setup.

## Custom prompt

The Gemini API path uses an editable prompt. Edit it from the toolbar popup or
from **Settings**. The on-device Summarizer API uses a fixed format controlled
by the length selector.

## Keyboard shortcut

Default: `⌘⇧S` on macOS, `Ctrl+Shift+S` elsewhere. Change it at
`chrome://extensions/shortcuts`.

## File layout

```
manifest.json           — MV3 manifest, permissions, commands
background.js           — service worker: provider dispatch, streaming, abort,
                          context menu, keyboard shortcut, install handler
tokens.css              — design tokens + base primitives (shared)
ui.js                   — shared markdown renderer + state subscription
sidepanel.{html,css,js} — primary reading surface
popup.{html,css,js}     — toolbar status + custom prompt
options.{html,css,js}   — settings (API key, prompt, provider status)
welcome.{html,css,js}   — first-run onboarding
summary_display.{html,css,js} — full-tab fallback for PDFs
icons/                  — 16/48/128 PNGs + icon.svg source
```

## Privacy

See [PRIVACY.md](./PRIVACY.md). Short version: on-device by default; cloud only
when you add a key; the only outbound request the extension can make is to
`generativelanguage.googleapis.com` (Gemini API). No analytics, no third-party
fonts, no remote scripts.

## License

MIT.
