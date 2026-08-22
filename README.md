# 🎼 TypiPat

**Orchestrate your day into harmony. Your quiet rhythm — composing peace with every keystroke.**

TypiPat is a Manifest V3 Chrome extension that transforms repetitive typing into a seamless symphony. By expanding custom text shortcuts into full motifs, it's the perfect conductor for email templates, code snippets, and professional boilerplate — right from any text field on any website.

## ✨ What's New in 3.0.0 (The Harmony Update)

- **𝄐 Fermata (Pin) System** — Pin up to 12 of your most-used shortcuts to the top of your list, each marked with its own chromatic note badge for quick recognition.
- **📂 Sections** — Group shortcuts into custom categories (Email, Support, Dev, etc.) for easier browsing.
- **🎵 Real Instrument Sounds** — A full Web Audio API–powered sound system with distinct piano, strings, flute, guitar, and bell tones for every action.
- **📊 Storage Indicator** — See your template count and Chrome Sync usage at a glance, with a detailed breakdown on click.
- **🔁 Smarter Import** — Importing a backup that shares a key with an existing shortcut no longer overwrites it. The incoming shortcut is automatically renamed with a `(Reprise)` suffix, so nothing is ever silently lost.
- **♿ Accessibility Improvements** — All Composer Studio fields now have properly associated labels for screen readers.
- **🖊️ Spell Check** — Native browser spell check (fully offline/local) is enabled on the Manuscript and Composer Studio fields.

## 📖 Key Features

- **⚡ Deep Detection Engine** — Expands shortcuts within Shadow DOM and modern frameworks (React, Vue, Angular), plus dedicated support for rich text editors like TinyMCE.
- **🎭 Floating Action Button** — A draggable, in-page overlay for instant motif access without leaving your tab.
- **📝 Composer Studio** — A full-featured manuscript editor with Find & Replace ("Transpose") and real-time statistics.
- **🔍 Smart Search** — Quickly find motifs by key, label, section, or content.
- **🏷️ Labels, Sections & Pins** — Organize your "Rhythms" however makes sense to you.
- **💾 Import/Export** — Back up and restore your shortcuts as JSON files, including labels and sections.
- **🔄 Chrome Sync** — Automatically sync your library across devices, with clear warnings if you exceed Chrome's sync storage quota (your data always stays safe locally either way).
- **📊 Statistics** — Track each motif's Beat Count (character count) and Caesura (line breaks).
- **🛡️ Security First** — Rendering uses secured DOM APIs (`textContent`, not `innerHTML`) throughout.

## 🚀 Installation

### From the Chrome Web Store

1. Visit the TypiPat Chrome Web Store page _(link coming soon)_
2. Click "Add to Chrome"
3. Start creating shortcuts!

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the folder containing this repository's files
6. The extension is now installed!

## 📖 How to Use

### Creating a Shortcut

1. Click the TypiPat icon in your Chrome toolbar, or use the in-page floating button
2. Click "Orchestra Entrata" to open the Composer / options page
3. Enter a shortcut key (e.g., `brb`)
4. Enter the replacement text (e.g., `Be right back!`)
5. Optionally add a label and/or section for organization
6. Click "Compose" to save

### Using Shortcuts

Type your shortcut key in any text field on any website, and it will automatically expand into your full text.

### Pinning a Shortcut

Click the "Fermata [OFF]" toggle next to any shortcut to pin it (up to 12 at a time). Pinned shortcuts always appear first in your list.

## 🎵 Musical Terminology

TypiPat uses musical terminology throughout the interface:

| Term                 | Meaning                           |
| -------------------- | --------------------------------- |
| Compose              | Create a new shortcut             |
| Orchestrate          | Open the advanced Composer Studio |
| Arrange              | Edit an existing shortcut         |
| Abolish              | Delete a shortcut                 |
| Perform              | Copy text to clipboard            |
| Fermata              | Pin a shortcut                    |
| Rhythm / Key         | Your shortcut key                 |
| Manuscript / Harmony | Your replacement text             |
| Cadence              | Export your shortcuts             |
| Entrata              | Import shortcuts                  |

## 🔒 Privacy

TypiPat stores only the shortcuts, labels, and sections you create. Nothing is transmitted to any external server — all processing happens locally on your device.

**Read the full privacy policy:** [PRIVACY.md](PRIVACY.md) | [Online version](https://egoist-suiluj.github.io/TypiPat/PRIVACY.html)

## 🛠️ Technical Details

- **Manifest Version:** 3 (MV3)
- **Permissions:** `storage`, `clipboardRead`, `clipboardWrite`, `offscreen`, `contextMenus`
- **Host Permissions:** `<all_urls>` (required for universal text expansion across all sites)
- **Storage:** `chrome.storage.local` (primary) + `chrome.storage.sync` (optional cross-device sync, subject to Chrome's 100KB/512-item quota)
- **Supported Fields:** Input, Textarea, ContentEditable, Shadow DOM, and TinyMCE-based rich text editors
- **Browser:** Chrome, Edge, and other Chromium-based browsers

## 📁 Project Structure

```text
TypiPat/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (badge, context menu, icon click)
├── content.js              # Text expansion detection & floating overlay
├── offscreen.html/js       # Secure clipboard bridge (MV3 requirement)
├── inject.css               # Floating overlay styles
├── popup.html/js           # In-page quick-access motif list
├── options.html/js         # Composer Studio & full shortcut index
├── storage-helper.js       # Local + Sync storage management
├── utils.js                 # Shared utilities, sound system, pin logic
└── iPat.png                  # Extension icon
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs via [GitHub Issues](https://github.com/egoist-suiluj/TypiPat/issues)
- Suggest new features
- Submit pull requests

## 📧 Contact

- **GitHub:** [egoist-suiluj/TypiPat](https://github.com/egoist-suiluj/TypiPat)
- **Issues:** [Report a bug or request a feature](https://github.com/egoist-suiluj/TypiPat/issues)

---

**"Orchestrate your day into harmony."** 🎼
