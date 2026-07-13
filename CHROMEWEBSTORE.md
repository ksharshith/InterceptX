# Chrome Web Store Listing — InterceptX

> Last Updated: 2026-07-13

## Store Listing

**Extension Name**
InterceptX

**Short Description**
Easily add, modify, and delete HTTP request and response headers on the fly.

**Detailed Description**
InterceptX is a lightweight, high-performance developer tool that gives you complete control over HTTP headers in your browser. Perfect for testing APIs, debugging web applications, simulating client states, and auditing web security.

Key Features:
- Create and switch between multiple custom profiles for different environments.
- Add, modify, or remove both incoming request headers and outgoing response headers.
- Filter rules using specific URL wildcard patterns (e.g., *://api.example.com/*).
- Restrict header modifications to specific Resource Types (XHR/Fetch, Documents, Stylesheets, Scripts, and more).
- Secure, lightning-fast execution built on Manifest V3 declarativeNetRequest.
- Responsive, glassmorphic dark mode editor that acts as both a popup and a full-tab workspace.
- Export and import profiles as JSON for easy sharing and backup.

How to use it:
1. Open the extension popup or click "Dashboard" to open the full-screen editor.
2. Select or create a profile from the dropdown toolbar.
3. Click "Add Header" and enter the name, value, operation (Set, Append, Remove), and request/response direction.
4. Optionally, add specific URL filters to limit modifications to certain websites.
5. Toggle the global master switch to "Active" to start modifying headers.

Privacy/permissions note:
All configurations and headers are stored locally on your device via Chrome storage. The extension does not collect, log, or transmit any user data off-device.

**Category**
Developer Tools

**Single Purpose**
Modifies HTTP request and response headers on target web pages.

**Primary Language**
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Created | `icons/store_icon.png` |

### Screenshot Notes
- Screenshot 1: Main dashboard view showing the glassmorphic dark mode editor with sample request and response header configurations.
- Screenshot 2: URL Filters and Resource Type selectors panel highlighted showing scoped site-specific modifications.

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `declarativeNetRequest` | permissions | Used to register dynamic rule structures that modify, add, or delete HTTP headers on network requests and responses matching user-configured patterns. |
| `storage` | permissions | Used to save user-defined header profiles, rule options, and the global activation state locally on the user's browser device. |
| `<all_urls>` | host_permissions | Necessary to allow the declarative rules to apply modifications to requests/responses across any domain the user specifies in their filter configurations. |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy

**Privacy Policy URL**
https://github.com/ksharshith/InterceptX/blob/main/PRIVACY.md

---

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

---

## Developer Info

**Publisher Name**
Harshith K S

**Contact Email**
mailtoharshithks@gmail.com

**Support URL / Email**
https://github.com/ksharshith/InterceptX/issues

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-07-13 | Initial release of InterceptX. | Published |

---

## Review Notes

### Known Issues / Limitations
- Header modifications apply globally or per-URL filter, but tab-level overrides are not supported in dynamic rules (requires session rules).
