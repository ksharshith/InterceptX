# InterceptX — Dashboard User Guide

Welcome to the **InterceptX Dashboard**. This guide explains how to access, configure, and utilize the advanced features of the dual-column dashboard.

---

## 1. Accessing the Dashboard

InterceptX works in two responsive modes:
1. **Compact Popup Mode**: Click the extension icon in your browser toolbar to open a space-saving control grid (`740px` wide).
2. **Full Tab Dashboard Mode**: Click the **"Open Dashboard"** button (with the arrow-right icon) in the header of the popup. This opens the control panel in a new browser tab, automatically expanding into a dual-column layout optimized for wide screens.

---

## 2. Interface Layout

The dashboard is structured into two main workspace zones:

### Left Column: Rules & Modifications
* **Active Headers**: A grid containing configured request and response header changes.
  * **State**: Toggle to enable/disable specific header rules.
  * **Action / Type**: Select if the header applies to requests (`Req: Set`, `Req: Append`, `Req: Remove`) or responses (`Res: Set`, `Res: Append`, `Res: Remove`).
  * **Header Name & Value**: Enter header key-value details.
  * **Comment**: Annotate the purpose of specific rules.
* **URL Redirects**: A grid containing pattern-based redirection rules.
  * **Original URL Pattern**: A regular expression (RE2 syntax) matching incoming requests.
  * **Redirect Destination URL**: The target URL. Supports capture group substitution (e.g. using `\1`, `\2`).

### Right Column: Scopes & Filters
* **URL Filters**: Restricts modifications to specific request targets.
  * **Match**: Apply rules only if the request URL matches this pattern (supports wildcards, e.g. `*://api.example.com/*`).
  * **Exclude**: Skip rule execution if the request URL matches this pattern.
  * **Origin**: Request Origin locks. Restricts modifications only to requests initiated from the specified origin domain name (initiator domain).
* **Resource Types**: Scopes header injection to specific request formats (e.g., limit changes only to `Document/main_frame` or `xmlhttprequest/Fetch`).

---

## 3. Profiles Management

You can create isolated sets of rules using **Profiles**:
* **Switch Profile**: Use the dropdown list in the top header.
* **Add Profile**: Click the **"+ Profile"** button to create a clean template.
* **Clone Profile**: Copy all rules, redirects, and filters from the active profile.
* **Rename / Delete**: Modify profile names or remove obsolete rulesets.
* **Export / Import**: Back up and restore configurations as `.json` files.

---

## 4. Advanced Redirect Rule Examples

The redirect engine uses regular expressions to capture and replace path sections:

### Case A: Simple Redirection
* **Original Pattern**: `^https://example\.com/old-page$`
* **Redirect Destination**: `https://example.com/new-page`
* *Result*: Navigation to the old page redirects immediately.

### Case B: Capture Group Replacement
* **Original Pattern**: `https://www.google.com/(.*)`
* **Redirect Destination**: `https://httpbin.org/anything/\1`
* *Result*: Navigating to `https://www.google.com/hello/world` automatically redirects to `https://httpbin.org/anything/hello/world`.

---

## 5. Exclude & Origin Filtering Scenarios

* **Excluding Asset Paths**: If you want header overrides to run across `httpbin.org` but bypass static assets:
  * Add a filter rule: Type = `Match`, Value = `*://httpbin.org/*`
  * Add another rule: Type = `Exclude`, Value = `*://httpbin.org/static/*`
* **Scoping to a Specific Tab/Origin**: To keep overrides active *only* when you are browsing on `httpbin.org`:
  * Add a filter rule: Type = `Origin`, Value = `httpbin.org`
  * This prevents headers from leaking to other tabs open in the same browser window.
