# InterceptX — Developer & Usage Guide

InterceptX is a compact, high-performance Chrome extension (Manifest V3) designed to dynamically modify HTTP request headers, response headers, and perform URL redirects on the fly. It is optimized to support developers debugging APIs, testing CORS policies, simulating custom user environments, and testing local domains.

---

## 1. Installation Guide

### From the Chrome Web Store (Standard)
1. Open Google Chrome and navigate to the official Chrome Web Store page for **InterceptX**.
2. Click **"Add to Chrome"** in the top-right corner.
3. Approve the permissions confirmation dialog to install the extension.
   > [!NOTE]
   > **Enhanced Safe Browsing Warning:** Because InterceptX is newly published, Google Chrome might display a warning saying: *"This extension is not trusted by Enhanced Safe Browsing"*. This is a standard warning for new developer accounts that have not yet established a multi-month history on the Web Store.
   >
   > You can safely click **"Continue to install"** to proceed. InterceptX is fully open source and operates entirely locally on your device (no data is collected or transmitted).
4. Pin the **InterceptX** icon to your browser toolbar for easy access.

### Developer Installation (Load Unpacked)
For local development, testing, or running custom builds:
1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to: `chrome://extensions/`
3. Toggle the **"Developer mode"** switch in the top-right corner to **ON**.
4. Click the **"Load unpacked"** button in the top-left corner.
5. Browse to and select the root directory of the extension workspace.

---

## 2. Project Architecture

The codebase is organized as follows:
* `manifest.json`: Defines extension properties, permissions (`declarativeNetRequest`, `storage`, `tabs`), background workers, and popup mappings.
* `background/service-worker.js`: Handles backend rule compilation. Updates Chrome's declarative rules dynamically.
* `ui/`: Contains all popup and dashboard visual assets:
  * `popup.html`: The markup container for rule grids, switches, and panels.
  * `popup.css`: Sleek glassmorphic styles and responsive columns.
  * `popup.js`: Manages UI state synchronizations and triggers worker updates.
* `DASHBOARD.md`: In-depth guide detailing redirects, custom regex patterns, and filtering scopes.

---

## 3. General Usage Instructions

### A. Toggling the Extension
Use the **Master Enable** toggle switch in the top-left header of the popup or dashboard. When enabled, the status indicator glow turns green (Active); when disabled, it turns gray and clears all dynamic rules.

### B. Configuring Headers
1. Click **"+ Request Header"** or **"+ Response Header"** to insert a rule.
2. Select the **Action / Type**:
   * `Req: Set` / `Res: Set`: Sets or overrides the header value.
   * `Req: Append` / `Res: Append`: Appends a value to an existing header.
   * `Req: Remove` / `Res: Remove`: Completely strips the header.
3. Fill in the **Header Name** and **Value** inputs.
4. (Optional) Check the state checkbox to enable the rule.

### C. Redirecting URLs
1. Click **"+ Redirect Rule"** to add a row in the redirects table.
2. Enter the **Original URL Pattern** as a regular expression (e.g. `^https://example\.com/(.*)$`).
3. Enter the **Redirect Destination URL** (e.g. `https://httpbin.org/anything/\1`).

### D. Scoping Rules with Filters
By default, active rules apply to all requests (`*`). You can restrict them by adding filters:
* **Match**: Enter a wildcard pattern (e.g., `*://api.dev.local/*`) to only apply modifications to matching URLs.
* **Exclude**: Enter a pattern (e.g., `*/static/*`) to skip modifications for matching URLs.
* **Origin**: Type a hostname/domain (e.g., `mytestsite.com`) to restrict modifications to requests initiated from that origin only (maps to initiator domain).

---

## 4. Export & Import Configurations

To share or back up your setup:
* **Export**: Click the **"Export"** button in the header. It downloads your profiles, rules, filters, and redirects configuration as a single `.json` file.
* **Import**: Click the **"Import"** button, select an exported JSON config, and your active workspace will be instantly loaded and synchronized.
