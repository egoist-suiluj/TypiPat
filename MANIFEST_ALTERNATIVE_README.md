# Alternative Manifest - Domain-Specific Version

This is an alternative manifest.json that restricts content script injection to specific popular domains instead of using `<all_urls>`.

## When to Use This Version

Use this version if you want:
- Faster Chrome Web Store approval process
- More restrictive permissions
- To avoid `<all_urls>` concerns

## Trade-offs

**Pros:**
- ✅ Faster approval from Chrome Web Store
- ✅ More explicit about which sites are supported
- ✅ May be perceived as more privacy-friendly

**Cons:**
- ❌ Text expansion only works on the listed ~20 websites
- ❌ Users cannot use shortcuts on other websites
- ❌ Poor user experience for edge cases

## Supported Domains

The alternative manifest includes these popular domains:
- **Email**: Gmail, Outlook
- **Social**: Facebook, Twitter, LinkedIn, Reddit
- **Productivity**: Google Docs/Drive, Notion, Slack, Discord, Trello, Asana
- **Development**: GitHub, GitLab, Stack Overflow
- **General**: Wikipedia, Medium

## How to Switch

1. Rename current `manifest.json` to `manifest-all-urls.json`
2. Rename `manifest-alternative.json` to `manifest.json`
3. Repackage the extension
4. Submit to Chrome Web Store

## Recommendation

We recommend using the standard `manifest.json` with `<all_urls>` for full functionality, as the privacy policy and reviewer notes clearly explain that no browsing data is collected.
