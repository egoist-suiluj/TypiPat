# Chrome Web Store Reviewer Notes

## Extension: TypiPat v3.0.0 (Harmony Update)

## Permissions Breakdown

### Requested Permissions

```json
"permissions": [
  "storage",
  "clipboardRead",
  "clipboardWrite",
  "offscreen",
  "contextMenus"
],
"host_permissions": ["<all_urls>"]
```

_(Host access is declared via `content_scripts.matches` in this manifest, not a separate `host_permissions` key.)_

| Permission                          | Why It's Needed                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                           | Save user-created shortcuts, labels, sections, and pin order locally (`chrome.storage.local`) and, optionally, via `chrome.storage.sync`.                                                                                                                                                                                                                                                                        |
| `clipboardRead`                     | Read the user's existing clipboard contents so it can be restored after TypiPat's internal clipboard operations complete.                                                                                                                                                                                                                                                                                        |
| `clipboardWrite`                    | Copy the expanded shortcut text to the clipboard for the "Perform" feature.                                                                                                                                                                                                                                                                                                                                      |
| `offscreen`                         | Manifest V3 requires an offscreen document to perform certain clipboard operations from a service worker context, since service workers cannot access the clipboard directly.                                                                                                                                                                                                                                    |
| `contextMenus`                      | Adds a single right-click menu item ("Open Orchestra Entrata") to open the extension's options page.                                                                                                                                                                                                                                                                                                             |
| `<all_urls>` (content script match) | The core text-expansion feature must detect typing on any website the user chooses, including inside iframes and Shadow DOM (e.g., ServiceNow instances, Gmail, and TinyMCE-based rich text editors). This is a functional requirement — the content script only listens for keystrokes and matches them against the user's own locally-stored shortcut keys; it does not read, store, or transmit page content. |

### Permissions We Do NOT Request

TypiPat explicitly does **not** request:

- ❌ `tabs` — not needed for core functionality (a minimal `chrome.tabs.query` call is used only to notify already-open tabs of a sound-setting change; no tab content or URLs are read)
- ❌ `history`
- ❌ `cookies`
- ❌ `webRequest`
- ❌ `downloads`
- ❌ `bookmarks`
- ❌ `geolocation`
- ❌ `camera` / `microphone`

---

## Data Collection Summary

| Data Type                       | Collected? | Purpose                  | Storage Location                |
| ------------------------------- | ---------- | ------------------------ | ------------------------------- |
| User-created shortcut keys      | ✅ Yes     | Core functionality       | `chrome.storage.local` / `sync` |
| Replacement text ("Manuscript") | ✅ Yes     | Core functionality       | `chrome.storage.local` / `sync` |
| Labels / sections               | ✅ Yes     | User organization        | `chrome.storage.local` / `sync` |
| Pin order                       | ✅ Yes     | User organization        | `chrome.storage.local` only     |
| Timestamps                      | ✅ Yes     | Sync conflict resolution | `chrome.storage.local` / `sync` |
| Sound preference (on/off)       | ✅ Yes     | UI preference            | `chrome.storage.local` only     |
| Website URLs / browsing history | ❌ No      | N/A                      | N/A                             |
| Website content / form data     | ❌ No      | N/A                      | N/A                             |
| Personal information            | ❌ No      | N/A                      | N/A                             |
| Analytics / telemetry           | ❌ No      | N/A                      | N/A                             |

---

## Code Verification

### Open Source

The complete source code is publicly available at:
**https://github.com/egoist-suiluj/TypiPat**

Reviewers can verify:

- No network requests to any external server (no `fetch`/`XMLHttpRequest` calls anywhere in the codebase)
- No data collection beyond user-created shortcuts
- No tracking, analytics, or telemetry code
- No access to sensitive browser APIs beyond those listed above

### Key Files to Review

1. **`content.js`** — Text expansion detection logic. Listens for keystrokes in input/textarea/contentEditable elements (including Shadow DOM and TinyMCE) and matches them against locally-stored shortcut keys only.
2. **`storage-helper.js`** — All persistence logic. Uses only `chrome.storage.local` and `chrome.storage.sync`; no external API calls.
3. **`background.js`** — Service worker. Handles the extension icon badge, context menu, and keyboard shortcut command; no network activity.
4. **`offscreen.js`** — Handles clipboard read/write via the MV3-required offscreen document; no network activity.
5. **`manifest.json`** — Declares the permissions listed above. Content script runs at `document_idle` with `all_frames: true` and `match_about_blank: true` to support embedded/modal editors (e.g., ServiceNow).

---

## Privacy Policy

**Public URL:** https://egoist-suiluj.github.io/TypiPat/PRIVACY.html

The privacy policy explicitly documents:

- Every permission requested and why
- What data is collected (only user-created shortcuts and related metadata)
- How and where data is stored
- What is explicitly NOT collected (browsing data, personal info, website content)
- User rights and full data control (view, edit, delete, export, import)

---

## Compliance Checklist

- ✅ Privacy policy publicly accessible and permission list matches `manifest.json` exactly
- ✅ Host permission (`<all_urls>`) justified with a specific functional explanation
- ✅ No sensitive/unnecessary permissions requested
- ✅ No data collection from visited websites
- ✅ No external network requests anywhere in the code
- ✅ Open source code available for full audit
- ✅ User data stored locally by default; sync is optional and Chrome-managed
- ✅ No analytics, tracking, or third-party scripts

---

## Contact

- **Developer:** egoist-suiluj
- **Repository:** https://github.com/egoist-suiluj/TypiPat
- **Issues:** https://github.com/egoist-suiluj/TypiPat/issues

---

**Summary:** TypiPat requests `storage`, `clipboardRead`, `clipboardWrite`, `offscreen`, and `contextMenus`, plus `<all_urls>` content-script access purely to enable universal text expansion. It does not collect, monitor, or transmit any browsing data or website content — all user data stays on the user's device unless they opt into Chrome's own Sync feature.
