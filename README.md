# 🎼 TypiPat

**Orchestrate your day into harmony. Your quiet rhythm — composing peace with every keystroke.**

TypiPat is a powerful Manifest V3 Chrome extension that transforms repetitive typing into a seamless symphony. By expanding custom text shortcuts into full motifs, it's the perfect conductor for email templates, code snippets, and professional boilerplate.

## ✨ New in Version 2.0 (The Harmony Update)

* **⚡ Deep Detection Engine:** Now expands shortcuts within **Shadow DOM** and modern frameworks (React, Vue, Angular). Works where others fail.
* **🎭 Side Stage UI:** A draggable, "ghost-mode" Floating Action Button (FAB) for instant motif access without leaving your tab.
* **📝 Composer Studio:** A full-featured manuscript editor with **Find & Replace (Transpose)** and real-time statistics.
* **📊 Statistics:** Track your writing's **Beat Count** (Character count) and **Caesura** (Line breaks).
* **🛡️ Security First:** 100% XSS-compliant rendering using secured DOM APIs.

## 📖 Key Features
* **🔍 Smart Search:** Quickly find motifs by key, label, or content.
* **🏷️ Labels & Organization:** Categorize your "Rhythms" for better orchestration.
* **💾 Import/Export:** Backup and restore your shortcuts as JSON files.
* **🔄 Chrome Sync:** Automatically sync your library across all your devices.
* **🎯 Template Variables:** Dynamic placeholders like `{date}`, `{time}`, and `{datetime}`.

## 🛠️ Technical Details
* **Manifest Version:** 3 (MV3)
* **Permissions:** `storage`, `offscreen`, `clipboardWrite`, `clipboardRead`, `contextMenus`.
* **Host Permissions:** `<all_urls>` (Strictly for universal text expansion functionality).
* **Privacy:** All data is processed locally. No external servers, no tracking.

## 📁 Project Structure
```text
TypiPat/
├── manifest.json          # Extension Conductor
├── background.js          # Service Worker (Orchestrator)
├── content.js             # Deep Detection Script
├── offscreen.html/js      # Secure Clipboard Bridge
├── inject.css             # Side Stage Visuals
├── popup.html/js          # Quick Motif View
├── options.html/js        # Composer Studio & Index
├── storage-helper.js      # Data Management
└── utils.js               # Shared Rhythmic Utilities

==========================================================================================================================================


# 🎼 TypiPat

**Orchestrate your day into harmony. Your quiet rhythm — composing peace with every keystroke.**

TypiPat is a powerful Chrome extension that helps you type faster by expanding custom text shortcuts into full phrases, sentences, or paragraphs. Perfect for repetitive typing tasks, email templates, code snippets, and more.

## ✨ Features

- **⚡ Instant Text Expansion**: Type shortcuts and watch them expand automatically
- **🎨 Beautiful UI**: Elegant, music-themed interface with smooth animations
- **🔍 Smart Search**: Quickly find shortcuts by key, label, or content
- **📝 Rich Composer**: Full-featured modal editor with find & replace
- **🏷️ Labels & Organization**: Organize shortcuts with custom labels
- **📊 Statistics**: Track character count and line count for each snippet
- **💾 Import/Export**: Backup and restore your shortcuts as JSON
- **🔄 Chrome Sync**: Automatically sync shortcuts across your devices
- **🎯 Template Variables**: Dynamic placeholders like `{date}`, `{time}`, `{datetime}`
- **🔒 Privacy-First**: All data stored locally, no external servers

## 🚀 Installation

### From Chrome Web Store
1. Visit the [TypiPat Chrome Web Store page](#) *(coming soon)*
2. Click "Add to Chrome"
3. Start creating shortcuts!

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `TypiPat-1` directory
6. The extension is now installed!

## 📖 How to Use

### Creating a Shortcut
1. Click the TypiPat icon in your Chrome toolbar
2. Click "Orchestra Entrata" to open the options page
3. Enter a shortcut key (e.g., `brb`)
4. Enter the replacement text (e.g., `Be right back!`)
5. Optionally add a label for organization
6. Click "Compose" to save

### Using Shortcuts
Simply type your shortcut key in any text field on any website, and it will automatically expand to your full text!

### Template Variables
Use these special placeholders in your replacement text:
- `{date}` - Current date (MM/DD/YYYY)
- `{time}` - Current time (HH:MM AM/PM)
- `{datetime}` or `{data-time}` - Full date and time

## 🎵 Musical Terminology

TypiPat uses musical terminology throughout the interface:
- **Compose** - Create a new shortcut
- **Orchestrate** - Use the advanced composer modal
- **Arrange** - Edit an existing shortcut
- **Abolish** - Delete a shortcut
- **Perform** - Copy text to clipboard
- **Rhythm** - Your shortcut key
- **Harmony** - Your replacement text

## 🔒 Privacy Policy

TypiPat respects your privacy. We only store the shortcuts you create locally on your device. No personal information is collected or transmitted.

**Read our full privacy policy**: [PRIVACY.md](PRIVACY.md) | [Online Version](https://egoist-suiluj.github.io/TypiPat/PRIVACY.html)

## 🛠️ Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: `storage` only (for saving your shortcuts)
- **Storage**: Local + Chrome Sync (optional)
- **Supported Fields**: Input, Textarea, ContentEditable
- **Browser**: Chrome, Edge, and other Chromium-based browsers

## 📁 Project Structure

```
TypiPat-1/
├── manifest.json          # Extension configuration
├── content.js            # Main content script (text expansion logic)
├── popup.html/js         # Extension popup interface
├── options.html/js       # Options/settings page
├── storage-helper.js     # Storage management with sync support
├── utils.js              # Shared utility functions
├── iPat.png              # Extension icon
├── PRIVACY.md            # Privacy policy (Markdown)
├── PRIVACY.html          # Privacy policy (HTML for web)
└── README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via [GitHub Issues](https://github.com/egoist-suiluj/TypiPat/issues)
- Suggest new features
- Submit pull requests

## 📜 License

This project is open source. See the repository for license details.

## 📧 Contact

- **GitHub**: [egoist-suiluj/TypiPat](https://github.com/egoist-suiluj/TypiPat)
- **Issues**: [Report a bug or request a feature](https://github.com/egoist-suiluj/TypiPat/issues)

## 🙏 Acknowledgments

Built with ❤️ for productivity enthusiasts who value efficiency and elegance.

---

**"Orchestrate your day into harmony."** 🎼
