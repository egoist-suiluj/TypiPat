# Privacy Policy for TypiPat

**Last Updated: November 28, 2024**

## Introduction

TypiPat ("we", "our", or "the extension") is a Chrome browser extension designed to help users create and manage text shortcuts for faster typing. This privacy policy explains what data is collected, how it is used, and your rights regarding your data.

## Important Clarification: Website Access and Data Collection

### Why TypiPat Uses `<all_urls>` Permission

TypiPat requests access to all websites (`<all_urls>`) **solely** to enable text expansion functionality on any website you choose to use. This is a **functional requirement**, not a data collection mechanism.

**What this means:**
- The extension needs to detect when you type in text fields across any website
- It must be able to insert your custom replacement text when you type a shortcut
- This requires the content script to run on the pages where you want to use shortcuts

### What TypiPat Does NOT Do

**TypiPat does not collect or process any data from the websites you visit.**

Specifically, TypiPat does **NOT**:
- Monitor, read, or collect website content
- Track which websites you visit
- Record your browsing history
- Access or store data from web pages
- Read or collect form data (except the shortcuts you explicitly type)
- Monitor your activity across websites
- Send any website data to external servers
- Collect any information about the pages you view

### What TypiPat DOES Do

TypiPat **only**:
1. Listens for your typing in text input fields (input, textarea, contentEditable elements)
2. Detects when you type one of your own custom shortcuts
3. Replaces that shortcut with your pre-defined replacement text
4. Processes template variables like `{date}` and `{time}` in your shortcuts

**All of this happens locally on your device. No data leaves your computer.**

### ServiceNow Integration

TypiPat includes specific support for ServiceNow instances (`*.service-now.com`) to ensure optimal text expansion functionality on ServiceNow platforms.

**What this means for ServiceNow users:**
- The extension can inject content scripts on any ServiceNow instance you access
- Text shortcuts work seamlessly in ServiceNow forms, fields, and text areas
- All shortcut expansion happens locally on your device

**Important clarifications:**
- TypiPat **only** interacts with ServiceNow pages for shortcut insertion
- No personal, browsing, or sensitive data is collected from ServiceNow
- No ServiceNow data is read, stored, or transmitted
- All stored data stays local or synced via Chrome Storage only
- No data is transmitted to external servers

The ServiceNow permission is purely functional—it allows the extension to detect your typing and expand shortcuts, nothing more.

## Data Collection and Storage

### What Data We Collect

TypiPat collects and stores only the following user-generated content:

1. **Text Shortcuts**: The shortcut keys you create (e.g., "brb", "addr")
2. **Replacement Text**: The expanded text associated with each shortcut
3. **Labels/Annotations**: Optional descriptive labels you assign to shortcuts
4. **Metadata**: Timestamps used for synchronization conflict resolution

### What We DO NOT Collect

TypiPat does **NOT** collect, store, or transmit:

- Personal information (name, email, phone number, address)
- Browsing history or website visits
- Passwords or credentials
- Location data
- Payment information
- Any data from websites you visit
- Analytics or usage statistics
- Cookies or tracking data

## How Data is Stored

### Local Storage

All your shortcuts and data are stored locally on your device using Chrome's built-in storage API (`chrome.storage.local`). This data:

- Remains on your device
- Is not transmitted to any external servers
- Is not accessible to the extension developers
- Is controlled entirely by you

### Chrome Sync (Optional)

If you have Chrome Sync enabled in your browser, your shortcuts may be synchronized across your Chrome browsers using `chrome.storage.sync`. This synchronization:

- Is handled entirely by Google Chrome
- Uses Google's secure infrastructure
- Follows Google's privacy policies
- Can be disabled in your Chrome settings
- Is optional and controlled by your Chrome sync preferences

**Important**: We do not have access to your synced data. All synchronization is managed by Chrome itself.

## Data Usage

Your data is used exclusively for:

1. **Text Expansion**: Replacing shortcuts with their corresponding text as you type
2. **Storage and Retrieval**: Saving and loading your shortcuts
3. **Synchronization**: Syncing shortcuts across your devices (if Chrome Sync is enabled)

We do not:

- Share your data with third parties
- Use your data for advertising
- Analyze your data for any purpose
- Transmit your data to external servers

## Data Control and Rights

### Your Rights

You have complete control over your data:

- **Access**: View all your shortcuts in the extension's options page
- **Modify**: Edit or update any shortcut at any time
- **Delete**: Remove individual shortcuts or clear all data
- **Export**: Download your shortcuts as a JSON file
- **Import**: Upload previously exported shortcuts

### Data Deletion

To delete your data:

1. **Individual Shortcuts**: Click the "Abolish" button next to any shortcut in the options page
2. **All Data**: Uninstall the extension from Chrome, which will remove all stored data
3. **Export First**: Use the "Export" feature to backup your data before deletion

## Third-Party Services

TypiPat does not use any third-party services, analytics, or tracking tools. The extension operates entirely within your browser using only Chrome's built-in APIs.

## Children's Privacy

TypiPat does not knowingly collect any information from children. The extension is designed for general use and does not target children specifically.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Open Source

TypiPat is open source. You can review the complete source code at:
https://github.com/egoist-suiluj/TypiPat

## Contact Information

If you have questions or concerns about this privacy policy or your data, please contact us:

- **GitHub Issues**: https://github.com/egoist-suiluj/TypiPat/issues
- **Repository**: https://github.com/egoist-suiluj/TypiPat

## Compliance

This privacy policy complies with:

- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles

## Summary

**In simple terms**: TypiPat only stores the text shortcuts you create, keeps them on your device, and doesn't collect any personal information or share your data with anyone.
