# Privacy Policy for TypiPat

**Last Updated: August 22, 2026**

## Introduction

TypiPat ("we", "our", or "the extension") is a Manifest V3 Chrome extension that helps you create and use custom text shortcuts. This policy explains exactly what data TypiPat handles, why each permission is needed, and what we do — and do not do — with your information.

## Permissions & Why They're Needed

TypiPat requests the following permissions in `manifest.json`:

| Permission                         | Purpose                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                          | Save your shortcuts, labels, and sections using `chrome.storage.local` and, optionally, `chrome.storage.sync`.                                                                                                                                                                                  |
| `clipboardRead` / `clipboardWrite` | Power the "Perform" (copy) feature, and preserve your existing clipboard contents when TypiPat needs to briefly use the clipboard internally.                                                                                                                                                   |
| `offscreen`                        | Required by Manifest V3 to perform certain clipboard operations from a background context.                                                                                                                                                                                                      |
| `contextMenus`                     | Adds a right-click menu option to open TypiPat's Composer / options page.                                                                                                                                                                                                                       |
| Host permission: `<all_urls>`      | Lets the content script detect your shortcut keys as you type, on any website — including inside iframes, Shadow DOM, and rich text editors (e.g., ServiceNow, Gmail, TinyMCE-based editors). This is a **functional requirement only**; it is not used to read, log, or transmit page content. |

## What TypiPat Does NOT Do

TypiPat does **not**:

- Monitor, read, log, or collect the content of the websites you visit
- Track your browsing history
- Read or store form data other than the shortcut key you type
- Transmit any data to an external server — there is no TypiPat backend
- Use analytics, telemetry, tracking pixels, or third-party cookies
- Sell or share any data with third parties

## What TypiPat DOES Do

TypiPat only:

1. Watches for typing in text inputs, textareas, and content-editable elements (including Shadow DOM and supported rich text editors)
2. Detects when what you've typed matches one of _your own_ saved shortcut keys
3. Replaces that shortcut with the replacement text you defined
4. Stores the shortcuts, labels, sections, and pin order you create

All of this happens entirely on your device.

## Data We Store

Only user-generated content, specifically:

1. **Shortcut keys** you create (e.g., `-brb`)
2. **Replacement text** ("Manuscript") for each shortcut
3. **Labels and sections** (optional organization you add)
4. **Pin order** (which shortcuts you've marked as favorites)
5. **Timestamps** used internally to resolve sync conflicts between devices
6. **A sound preference toggle** (whether audio feedback is enabled)

We do **not** collect: names, emails, passwords, location data, payment information, browsing history, or any content from the pages you visit.

## How Data Is Stored

### Local Storage (`chrome.storage.local`)

All of the above is stored locally on your device by default. This data never leaves your computer unless Chrome Sync (below) is enabled, and we — the developers — have no access to it.

### Chrome Sync (optional, `chrome.storage.sync`)

If enabled, your shortcuts may also sync across your Chrome browsers via Google's own encrypted sync infrastructure. This is entirely managed by Chrome, not by TypiPat. Note that `chrome.storage.sync` has a small capacity (100KB / 512 items total, imposed by Chrome, not by us); if you exceed it, TypiPat will notify you and continue saving locally without any data loss.

## Your Rights & Control

You are always in control of your data:

- **View:** See all your shortcuts on the Composer / options page.
- **Edit:** Modify any shortcut, label, or section at any time.
- **Delete ("Abolish"):** Remove individual shortcuts, or uninstall the extension to remove everything.
- **Export ("Cadence"):** Download your shortcuts (including labels and sections) as a JSON backup file.
- **Import ("Entrata"):** Restore from a backup file. If an imported shortcut shares a key with one you already have, the incoming one is automatically renamed with a `(Reprise)` suffix — your existing shortcut is never silently overwritten.

## Third-Party Services

TypiPat does not integrate with any third-party analytics, advertising, or tracking service. It uses only Chrome's built-in extension APIs.

## Children's Privacy

TypiPat is a general-purpose productivity tool and is not directed at children. We do not knowingly collect data from children.

## Changes to This Policy

Any updates to this policy will be reflected in the "Last Updated" date above. Continued use of the extension after a change constitutes acceptance of the updated policy.

## Open Source

TypiPat's complete source code is publicly available for review at:
https://github.com/egoist-suiluj/TypiPat

## Contact

- **GitHub Issues:** https://github.com/egoist-suiluj/TypiPat/issues
- **Repository:** https://github.com/egoist-suiluj/TypiPat

## Summary

**In plain terms:** TypiPat only stores the shortcuts you create, keeps them on your device (optionally synced through your own Google account via Chrome Sync), and never reads, collects, or transmits anything else.
