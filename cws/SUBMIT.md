# Chrome Web Store submission — v1.1.0

End-to-end checklist for pushing v1.1.0 to the store.

Adapted from the `create-chrome-extension:cws-*` skill pack. This
extension is vanilla (no npm / WXT / validator scripts), so none of
the factory's `npm run check:cws:ship` + `npm run ship` automation
applies. The phases below mirror what those skills drive.

---

## Phase A — Code gate (done)

- [x] Manifest v1.0 → v1.1.0 bumped
- [x] Description ≤ 132 chars ("Read less. Get the gist of any article, PDF, or page in a click.")
- [x] Icons 16/48/128 present, regenerated from `icons/icon.svg`
- [x] Permissions narrow (5 API + 2 exact Gemini endpoints)
- [x] No remote code (no `<script src="https://…">`, no eval)
- [x] No remote fonts (system stack only)
- [x] No analytics / telemetry
- [x] All HTML references resolve to files in tree
- [x] README.md up to date
- [x] PRIVACY.md up to date with the plain-language data table
- [x] Welcome page wired to auto-open on first install

## Phase B — Artifacts (done)

- [x] Ship zip built: `summarizer-v1.1.0.zip` at repo root (~98KB, 23 files)
- [x] 5 CWS screenshots rendered: `cws/screens/shot{1..5}.png` (1280×800)
- [x] Listing copy drafted: `cws/LISTING.md`
- [x] Submit checklist: `cws/SUBMIT.md` (this file)

## Phase C — Dashboard upload (manual)

Go to <https://chrome.google.com/webstore/devconsole>. Pick the
existing listing for this extension (it keeps its Extension ID).

### C.1 — Upload the zip

1. **Package** tab → **Upload new package**
2. Select `summarizer-v1.1.0.zip` from this repo root
3. Confirm the dashboard picks up version **1.1.0**

### C.2 — Paste the listing copy

From `cws/LISTING.md`, fill in:

- [ ] **Store listing → Name** (keeps current — optional rename to
      "Summarizer — quick summaries of anything you read")
- [ ] **Store listing → Short description** (96 chars)
- [ ] **Store listing → Detailed description** (long-form)
- [ ] **Store listing → Category** → Productivity
- [ ] **Store listing → Language** → English (United States)

### C.3 — Replace screenshots

- [ ] **Store listing → Screenshots** → delete old screenshots
- [ ] Upload `cws/screens/shot1.png` first (it becomes the hero)
- [ ] Upload shot2–shot5 in order
- [ ] Confirm all 5 are 1280×800 (CWS re-rejects off-spec sizes)

### C.4 — Promo images

Both rendered. Drop them in the dashboard:

- [ ] **Small promo tile (440×280)** — `cws/promo/small.png`
- [ ] **Marquee promo (1400×560)** — `cws/promo/marquee.png`
      (only shown if Google features the listing, but takes one
      minute to upload)

Edit `cws/promo/{small,marquee}.html` and re-run
`cws/promo/render.sh` to regenerate after any tweaks.

### C.5 — Privacy

The CWS **Privacy practices** form is long and pedantic. Copy from
`cws/LISTING.md` → "Permissions justifications" and "Privacy
practices disclosure". Key fields:

- [ ] **Single purpose** — see LISTING.md
- [ ] **Permission justifications** — one per permission, see LISTING.md
- [ ] **Host permission justification** — only Gemini API when user opts in
- [ ] **Data usage certification** — check "I certify" after filling out:
  - user-provided content: yes, for functionality, not sold, not tracked
  - authentication info (API key): yes, for functionality, not sold,
    not tracked
- [ ] **Privacy policy URL** — see Phase D below

### C.6 — Version release notes

Paste the block from `cws/LISTING.md` → "Version notes" into the
submission's notes field.

## Phase D — Host the privacy policy

CWS requires a public URL for the privacy policy. `PRIVACY.md` in
this repo won't render nicely from GitHub raw. Three easy options:

### Option 1 — GitHub Pages (recommended)

```bash
# Enable GitHub Pages on the repo's main branch / root.
# Then the policy is served at:
#   https://codyhxyz.github.io/chrome-text-summarizer/PRIVACY
# (GitHub Pages auto-renders .md files as .html)
```

### Option 2 — Link to the raw GitHub file

```
https://github.com/codyhxyz/chrome-text-summarizer/blob/main/PRIVACY.md
```

GitHub's rendered view works in CWS. Fastest. Slightly less
professional-looking.

### Option 3 — Host on your own domain

Paste the content of `PRIVACY.md` into a route on your personal site.
Adds one more place to keep in sync.

## Phase E — Submit & poll

1. Click **Submit for review** in the dashboard
2. Expect one of:
   - **Pending review** — 1–7 days. Most v1.x submissions of an
     already-approved extension clear in <48h.
   - **Rejected** — CWS returns a "color" code (Blue Argon, Purple
     Lithium, Yellow Zinc, etc.). The most common on re-submissions
     is **Yellow Zinc** (insufficient permission justifications) —
     fix with clearer copy in the justification fields and resubmit.
   - **Live** — version flipped, public immediately

## Phase F — Post-ship

- [ ] Tag the git commit: `git tag v1.1.0 && git push --tags`
- [ ] Update the GitHub release notes (copy from LISTING.md version notes)
- [ ] Post about it (optional): Twitter/X, ProductHunt, Hacker News
- [ ] Watch for user-reported issues on the CWS listing's "Reviews" tab
- [ ] Schedule a follow-up in 2 weeks: if Chrome 139+ changes the
      Summarizer API in any way, patch and ship v1.1.1

---

## If you want full automation next time

The `create-chrome-extension` factory's `cws-ship` skill runs the
complete phase A→E flow over a **WXT + TypeScript** extension via
`npm run ship`. To move this extension to that setup later, see
`create-chrome-extension:cce-init`. Not worth it for v1.1.0.

## If you want to regenerate screenshots

```bash
cd cws/screens
./render.sh
```

Re-runs the five 1280×800 renders. Edit the `shot*.html` files to
tweak copy or composition; the script picks up the changes on the
next run.
