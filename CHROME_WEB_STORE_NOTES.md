# Chrome Web Store Reviewer Notes

## Extension: TypiPat v1.0
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

## Compliance Checklist

- ✅ Privacy policy publicly accessible
- ✅ Specific host permissions justified
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

**Summary:** TypiPat uses specific host permissions purely for functional text expansion on supported websites. It does not collect, monitor, or transmit any browsing data or website content. All user data stays on their device.
