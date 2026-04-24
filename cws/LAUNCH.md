# Launch copy — Summarizer v1.1.0

Drafts for Twitter / X, ProductHunt, LinkedIn, HN Show, and a blog
post. Pick the ones you'll actually post, trash the rest.

Assets to attach:
- `cws/promo/marquee.png` — Twitter/LinkedIn header image
- `cws/promo/small.png` — ProductHunt tile fallback
- `cws/screens/shot1.png` — hero product shot
- `cws/screens/shot4.png` — onboarding shot (use for "privacy" angle)

---

## Twitter / X — launch thread (5 posts)

**1/**
```
Read less.

I shipped Summarizer — a Chrome extension that turns any selection,
PDF, or article into a streaming summary. Runs on your device by
default via Gemini Nano. No API key needed.

https://chrome.google.com/webstore/detail/<id>
```
_(attach marquee.png)_

**2/**
```
On-device by default means: when Chrome's built-in Nano is available,
the text you select never leaves your machine.

No network request. No API key. No cost. No account.

If Nano isn't there, falls back to the Gemini API with your own key.
```
_(attach shot4.png)_

**3/**
```
Three ways in:

→ Right-click any selection
→ Press ⌘⇧S
→ Toolbar icon

Summaries stream into Chrome's side panel as the tokens arrive.
Short, medium, or long — switch any time.
```
_(attach shot1.png)_

**4/**
```
Works on PDFs too — local or remote. When the side panel can't open
(Chrome restriction on chrome-extension:// URLs), it falls back to a
full-tab view with the same UI.
```
_(optional: shot5.png)_

**5/**
```
Open source (MIT). No analytics, no remote fonts, no tracking.

The whole thing is ~500 lines of vanilla JS + a shared tokens.css.
No build step.

github.com/codyhxyz/webpage-summarizer
```

---

## Twitter / X — single-shot version

```
Shipped Summarizer for Chrome.

Select any text → right-click → streaming summary in the side panel.

Runs on-device via Gemini Nano when available (no network, no key).
Falls back to the Gemini API with your own key when it isn't.

~500 LOC vanilla JS. MIT.

https://chrome.google.com/webstore/detail/<id>
```
_(attach marquee.png)_

---

## ProductHunt

**Tagline (60 chars max):**
```
Chrome-native summarizer that runs on your device
```

**Short description:**
```
Read less. Get the gist of any article, PDF, or page in a click.
Runs on-device via Gemini Nano when available — no API key, no
network. Falls back to the Gemini API with your own key otherwise.
Streaming, stop, regenerate, three length settings. Works in PDFs.
Keyboard shortcut (⌘⇧S / Ctrl+Shift+S). No analytics. Open source.
```

**Maker comment (for the launch post):**
```
Hey PH 👋

Built this because I got tired of copy-pasting articles into ChatGPT
to get the gist. I wanted: select → right-click → done, without a
round-trip to a foreign UI.

What Summarizer is:
• A Chrome extension that summarizes any text selection
• On-device by default via Chrome 138+'s built-in Gemini Nano
• Falls back to the Gemini API with your own key
• Streaming, stop, regenerate, Short/Medium/Long
• Works in PDFs (local + remote)
• ⌘⇧S / Ctrl+Shift+S

What Summarizer isn't:
• A "chat" interface — one action, one output, get back to reading
• A data-hungry SaaS — no analytics, no account, no subscription
• Proprietary — MIT on GitHub

What's next: better on-device length control, optional translate,
export to Notion / Obsidian if enough people ask.

Happy to answer questions or take feedback here. Enjoy!
```

**Gallery order:**
1. `cws/screens/shot1.png` — hero
2. `cws/screens/shot4.png` — onboarding (privacy angle)
3. `cws/screens/shot3.png` — length control
4. `cws/screens/shot2.png` — right-click
5. `cws/screens/shot5.png` — PDF support

---

## LinkedIn

```
Shipped a small thing today: Summarizer, a Chrome extension that
turns any text selection into a streaming summary in Chrome's side
panel.

The interesting bit is that it runs on-device by default, using
Chrome 138+'s built-in Gemini Nano model. No API key, no network, no
account. Falls back to the Gemini API with your own key on older
Chrome builds.

Why build it:
• Copy-pasting articles into ChatGPT is friction I hit ten times a day
• On-device AI is good enough for summaries in 2026
• Side panel is the right UX — the source stays visible

Tech:
• Vanilla JS + MV3 (~500 LOC)
• No build step, no npm
• Shared tokens.css + ui.js for DRY
• MIT, open source

Chrome Web Store: <link>
GitHub: github.com/codyhxyz/webpage-summarizer

Would love feedback from anyone who reads a lot online.
```

---

## Hacker News — Show HN

**Title:**
```
Show HN: Summarizer – Chrome extension, on-device by default (MV3, no build)
```

**Text post:**
```
Hi HN. I shipped a small Chrome extension I'd been meaning to build
for months.

It summarizes any text selection using Chrome 138+'s built-in
Summarizer API (which is backed by Gemini Nano and runs entirely
on-device). Falls back to the Gemini API with a user-provided key on
older Chromes or hardware where Nano isn't available.

Things I tried to get right:
- On-device by default. No network request for summaries when Nano
  is available. No API key required for that path.
- Optional host permissions — the Gemini API host is not granted at
  install. It's requested only when the user saves a cloud key.
- Streaming. Both paths stream tokens. Stop button wired to an
  AbortController.
- Right-click or ⌘⇧S / Ctrl+Shift+S. Keyboard shortcut uses
  activeTab + scripting so it doesn't need broad host permissions
  to read the selection.
- PDF fallback via chrome.storage.session, not URL-encoded text.
- Zero dependencies. No build step. MV3 vanilla JS, ~500 LOC,
  one shared tokens.css + ui.js.

It's MIT on GitHub. Happy to answer questions about the Summarizer
API, MV3 streaming with SSE, or the on-device vs cloud UX trade-offs.

Store: <link>
Code: github.com/codyhxyz/webpage-summarizer
```

---

## Blog post outline (if you're so inclined)

Working title: **Shipping an on-device Chrome extension in 2026**

Sections:
1. Why the side panel won (vs. overlay, vs. popup, vs. new tab)
2. The Summarizer API in one screen — what it gives you, what it
   doesn't
3. Streaming SSE from Gemini's REST endpoint (gotchas)
4. Optional host permissions — the UX difference from users
5. Not using a build step: when MV3 vanilla is still the right call
6. What on-device can't do yet, and how I fell back without drama

Target: ~1200 words, 3–4 screenshots, one diagram of the dispatch
flow. Publish on the day the CWS listing goes live.

---

## Metrics to watch in the first week

| Metric | Where | Red-line |
|---|---|---|
| CWS installs | dashboard | <10 after PH launch = copy problem |
| CWS reviews | dashboard | any 1-star with "doesn't work" → bug |
| GH stars | github.com | nice-to-have, not a signal |
| GH issues | github.com | any filed in week 1 → triage same-day |
| Crash/error reports | chrome://extensions user reports | zero expected |

Week-two decision: if reviews show confusion about on-device vs
cloud, the onboarding copy needs a rewrite. If everyone goes cloud
because their Chrome is too old, add a minimum-Chrome prompt.
