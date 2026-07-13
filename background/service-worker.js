const ALL_RESOURCE_TYPES = [
  "main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest",
  "ping", "csp_report", "media", "websocket", "webtransport", "webbundle", "other"
];

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["profiles", "activeProfileId", "enabled"]);
  
  if (!data.profiles) {
    const defaultProfile = {
      id: "default-" + Date.now(),
      name: "Default Profile",
      headers: [
        {
          id: "header-1",
          type: "request",
          operation: "set",
          name: "X-Custom-Header",
          value: "InterceptX-Rules",
          enabled: true
        }
      ],
      filters: [],
      redirects: [],
      resourceTypes: [...ALL_RESOURCE_TYPES]
    };
    
    await chrome.storage.local.set({
      profiles: [defaultProfile],
      activeProfileId: defaultProfile.id,
      enabled: false // disabled by default
    });
  }
  
  await updateDeclarativeRules();
});

// Listen for storage changes to rebuild rules
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local" && (changes.profiles || changes.activeProfileId || changes.enabled)) {
    await updateDeclarativeRules();
  }
});

// Helper: Extract domain only for initiatorDomains matching
function getDomainOnly(str) {
  try {
    let clean = str.trim();
    if (clean.includes("://")) {
      const url = new URL(clean);
      return url.hostname;
    }
    // Remove port, path, wildcards if any
    clean = clean.split("/")[0].split(":")[0];
    clean = clean.replace(/^\*\./, ""); // remove *. prefix if user types *.example.com
    return clean;
  } catch (e) {
    return str.trim();
  }
}

// Rebuild and update chrome.declarativeNetRequest rules
async function updateDeclarativeRules() {
  try {
    // 1. Get existing dynamic rules and prepare to clear them
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(rule => rule.id);

    // 2. Fetch current settings
    const data = await chrome.storage.local.get(["profiles", "activeProfileId", "enabled"]);
    const enabled = !!data.enabled;
    const activeProfileId = data.activeProfileId;
    const profiles = data.profiles || [];
    
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    
    const addRules = [];
    let ruleId = 1;
    
    if (enabled && activeProfile) {
      const resourceTypes = activeProfile.resourceTypes && activeProfile.resourceTypes.length > 0
        ? activeProfile.resourceTypes
        : [...ALL_RESOURCE_TYPES];

      // Separate filters by their function
      const allFilters = activeProfile.filters || [];
      const urlMatches = allFilters.filter(f => f.enabled && f.value.trim() !== "" && (f.type === "url-match" || !f.type));
      const urlExcludes = allFilters.filter(f => f.enabled && f.value.trim() !== "" && f.type === "url-exclude");
      const tabDomains = allFilters.filter(f => f.enabled && f.value.trim() !== "" && f.type === "tab-domain");
      
      const tabDomainsList = tabDomains.map(d => getDomainOnly(d.value)).filter(d => d !== "");
      
      // Step A: Compile Exclude Filters (action.type = "allow", priority = 2)
      for (const filter of urlExcludes) {
        const cond = {
          urlFilter: filter.value.trim(),
          resourceTypes: resourceTypes
        };
        if (tabDomainsList.length > 0) {
          cond.initiatorDomains = tabDomainsList;
        }
        addRules.push({
          id: ruleId++,
          priority: 2, // higher priority to override modifyHeaders
          action: { type: "allow" },
          condition: cond
        });
      }

      // Step B: Compile Redirect Rules (action.type = "redirect", priority = 2)
      const redirects = activeProfile.redirects || [];
      for (const r of redirects) {
        if (r.enabled && r.pattern.trim() !== "" && r.target.trim() !== "") {
          const cond = {
            regexFilter: r.pattern.trim(),
            resourceTypes: resourceTypes
          };
          if (tabDomainsList.length > 0) {
            cond.initiatorDomains = tabDomainsList;
          }
          addRules.push({
            id: ruleId++,
            priority: 2,
            action: {
              type: "redirect",
              redirect: { regexSubstitution: r.target.trim() }
            },
            condition: cond
          });
        }
      }

      // Step C: Compile Header Modification Rules (action.type = "modifyHeaders", priority = 1)
      const enabledHeaders = (activeProfile.headers || []).filter(h => h.enabled && h.name.trim() !== "");
      const requestHeaders = [];
      const responseHeaders = [];
      
      for (const h of enabledHeaders) {
        const headerObj = {
          header: h.name.trim(),
          operation: h.operation || "set"
        };
        if (h.operation !== "remove") {
          headerObj.value = h.value || "";
        }
        
        if (h.type === "request") {
          requestHeaders.push(headerObj);
        } else {
          responseHeaders.push(headerObj);
        }
      }
      
      if (requestHeaders.length > 0 || responseHeaders.length > 0) {
        const action = {
          type: "modifyHeaders"
        };
        if (requestHeaders.length > 0) {
          action.requestHeaders = requestHeaders;
        }
        if (responseHeaders.length > 0) {
          action.responseHeaders = responseHeaders;
        }
        
        if (urlMatches.length === 0) {
          // Catch-all URL match
          const cond = {
            urlFilter: "*",
            resourceTypes: resourceTypes
          };
          if (tabDomainsList.length > 0) {
            cond.initiatorDomains = tabDomainsList;
          }
          addRules.push({
            id: ruleId++,
            priority: 1,
            action: action,
            condition: cond
          });
        } else {
          // Generate a rule for each urlMatch filter
          for (const filter of urlMatches) {
            const cond = {
              urlFilter: filter.value.trim(),
              resourceTypes: resourceTypes
            };
            if (tabDomainsList.length > 0) {
              cond.initiatorDomains = tabDomainsList;
            }
            addRules.push({
              id: ruleId++,
              priority: 1,
              action: action,
              condition: cond
            });
          }
        }
      }
    }
    
    // 3. Apply the changes atomically
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeRuleIds,
      addRules: addRules
    });
    
    console.log(`Successfully updated declarativeNetRequest rules. Removed: ${removeRuleIds.length}, Added: ${addRules.length}`);
  } catch (error) {
    console.error("Failed to update declarative rules in service-worker:", error);
  }
}
