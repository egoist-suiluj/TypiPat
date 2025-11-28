# Chrome Web Store Reviewer Notes

## Extension: TypiPat v1.0

### Purpose
TypiPat is a text expansion utility that helps users type faster by automatically expanding custom shortcuts into full text. For example, typing "brb" can expand to "Be right back!"

---

## Important: `<all_urls>` Permission Justification

### Why We Use `<all_urls>`

TypiPat requests the `<all_urls>` permission **solely as a functional requirement** to enable text expansion on any website the user chooses to use.

**Functional Necessity:**
- Users need text expansion to work on ANY website they visit (email, social media, work tools, etc.)
- The content script must detect typing in text fields across all websites
- The extension must insert replacement text when users type their shortcuts
- Restricting to specific domains would severely limit functionality and user experience

### What TypiPat Does NOT Do

**TypiPat does not collect or process any data from the websites users visit.**

The extension does **NOT**:
- ❌ Monitor, read, or collect website content
- ❌ Track which websites users visit
- ❌ Record browsing history
- ❌ Access or store data from web pages
- ❌ Read or collect form data (except user's own shortcuts)
- ❌ Monitor user activity across websites
- ❌ Send any website data to external servers
- ❌ Collect any information about pages viewed
- ❌ Use analytics, tracking, or telemetry
- ❌ Make network requests to external servers

### What TypiPat DOES Do

The content script **only**:
1. ✅ Listens for user typing in text input fields (input, textarea, contentEditable)
2. ✅ Detects when user types one of their own custom shortcuts
3. ✅ Replaces that shortcut with user-defined replacement text
4. ✅ Processes template variables like `{date}` and `{time}` in shortcuts

**All processing happens locally on the user's device. No data leaves the computer.**

---

## Permissions Breakdown

### Requested Permissions

```json
"permissions": ["storage"]
```

**Purpose:** Store user-created shortcuts locally using `chrome.storage.local` and optionally sync via `chrome.storage.sync`.

### Permissions We DO NOT Request

We explicitly **DO NOT** request any of these sensitive permissions:
- ❌ `tabs` - Not needed, not requested
- ❌ `history` - Not needed, not requested
- ❌ `cookies` - Not needed, not requested
- ❌ `webRequest` - Not needed, not requested
- ❌ `downloads` - Not needed, not requested
- ❌ `bookmarks` - Not needed, not requested
- ❌ `clipboardWrite` - Not needed, not requested
- ❌ `geolocation` - Not needed, not requested
- ❌ `camera/microphone` - Not needed, not requested

---

## Data Collection Summary

| Data Type | Collected? | Purpose | Storage Location |
|-----------|------------|---------|------------------|
| User shortcuts (text) | ✅ Yes | Core functionality | `chrome.storage.local/sync` |
| Labels/annotations | ✅ Yes | Organization | `chrome.storage.local/sync` |
| Timestamps | ✅ Yes | Sync conflict resolution | `chrome.storage.local/sync` |
| Website URLs | ❌ No | N/A | N/A |
| Browsing history | ❌ No | N/A | N/A |
| Website content | ❌ No | N/A | N/A |
| Personal information | ❌ No | N/A | N/A |
| Analytics/telemetry | ❌ No | N/A | N/A |

---

## Code Verification

### Open Source
The complete source code is publicly available at:
**https://github.com/egoist-suiluj/TypiPat**

Reviewers can verify:
- No network requests to external servers
- No data collection beyond user shortcuts
- No tracking or analytics code
- No access to sensitive browser APIs

### Key Files to Review

1. **content.js** (lines 236-312)
   - Main text expansion logic
   - Only monitors text input events
   - No website data collection

2. **storage-helper.js** (lines 1-256)
   - Only uses `chrome.storage.local` and `chrome.storage.sync`
   - No external API calls

3. **manifest.json**
   - Only requests `storage` permission
   - Content script runs at `document_idle` to minimize impact

---

## Privacy Policy

**Public URL:** https://egoist-suiluj.github.io/TypiPat/PRIVACY.html

The privacy policy explicitly states:
- What data is collected (only user shortcuts)
- How data is stored (locally on device)
- What is NOT collected (browsing data, personal info, website content)
- User rights and data control

---

## Alternative: Domain-Specific Version

We have prepared an alternative manifest (`manifest-alternative.json`) that restricts content script injection to specific popular domains (Gmail, Google Docs, Facebook, LinkedIn, etc.).

**Trade-off:**
- ✅ Faster approval process
- ❌ Severely limited functionality (only works on ~20 websites)
- ❌ Poor user experience

We prefer the `<all_urls>` version for full functionality, but can switch if required.

---

## Compliance Checklist

- ✅ Privacy policy publicly accessible
- ✅ Clear explanation of `<all_urls>` usage
- ✅ No sensitive permissions requested
- ✅ No data collection from websites
- ✅ No external network requests
- ✅ Open source code available
- ✅ Minimal permission footprint
- ✅ User data stored locally only
- ✅ No analytics or tracking

---

## Contact

- **Developer:** egoist-suiluj
- **Repository:** https://github.com/egoist-suiluj/TypiPat
- **Issues:** https://github.com/egoist-suiluj/TypiPat/issues

---

**Summary:** TypiPat uses `<all_urls>` purely for functional text expansion across all websites. It does not collect, monitor, or transmit any browsing data or website content. All user data stays on their device.
