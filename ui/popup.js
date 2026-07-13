const ALL_RESOURCE_TYPES = [
  "main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest",
  "ping", "csp_report", "media", "websocket", "webtransport", "webbundle", "other"
];

// App State
let state = {
  profiles: [],
  activeProfileId: "",
  enabled: false
};

// Modal State tracking
let modalCallback = null;

// DOM Elements
const masterEnable = document.getElementById("master-enable");
const statusIndicator = document.getElementById("status-indicator");
const profileSelect = document.getElementById("profile-select");
const headersTbody = document.getElementById("headers-tbody");
const headersEmpty = document.getElementById("headers-empty");
const filtersList = document.getElementById("filters-list");
const filtersEmpty = document.getElementById("filters-empty");
const resourcesGrid = document.getElementById("resources-grid");

// Toolbar Buttons
const btnOpenTab = document.getElementById("btn-open-tab");
const btnRenameProfile = document.getElementById("btn-rename-profile");
const btnCloneProfile = document.getElementById("btn-clone-profile");
const btnDeleteProfile = document.getElementById("btn-delete-profile");
const btnCreateProfile = document.getElementById("btn-create-profile");
const btnExportProfiles = document.getElementById("btn-export-profiles");
const btnImportTrigger = document.getElementById("btn-import-trigger");
const importFile = document.getElementById("import-file");

// Quick Add Bar Buttons
const btnQuickAddReq = document.getElementById("btn-quick-add-req");
const btnQuickAddRes = document.getElementById("btn-quick-add-res");
const btnQuickAddRedirect = document.getElementById("btn-quick-add-redirect");
const btnQuickAddFilter = document.getElementById("btn-quick-add-filter");
const btnToggleResources = document.getElementById("btn-toggle-resources");

// Modal Elements
const modalContainer = document.getElementById("modal-container");
const modalTitle = document.getElementById("modal-title");
const modalInput = document.getElementById("modal-input");
const btnModalCancel = document.getElementById("btn-modal-cancel");
const btnModalSave = document.getElementById("btn-modal-save");

// Docs Modal Elements
const btnShowDocs = document.getElementById("btn-show-docs");
const docsModal = document.getElementById("docs-modal");
const btnCloseDocs = document.getElementById("btn-close-docs");

// Theme Toggle Elements
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const themeIcon = document.getElementById("theme-icon");

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  // Check if opened as options/dashboard page
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "dashboard" || window.innerWidth > 800) {
    document.body.classList.add("dashboard-mode");
    if (btnOpenTab) btnOpenTab.style.display = "none";
  }

  // Load from Storage
  await loadState();

  // Setup Event Listeners
  setupEventListeners();

  // Render UI
  renderUI();
});

const isExtension = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

// Load State from Chrome Storage or LocalStorage fallback
// Helper: Apply Light / Dark Theme UI
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light-theme");
    if (themeIcon) {
      themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    }
  } else {
    root.classList.remove("light-theme");
    if (themeIcon) {
      themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    }
  }
  // Store theme locally to persist
  if (isExtension) {
    chrome.storage.local.set({ theme });
  }
  localStorage.setItem("theme", theme);
}

async function loadState() {
  try {
    let data = {};
    if (isExtension) {
      data = await chrome.storage.local.get(["profiles", "activeProfileId", "enabled", "theme"]);
    } else {
      const storedProfiles = localStorage.getItem("profiles");
      const storedActiveId = localStorage.getItem("activeProfileId");
      const storedEnabled = localStorage.getItem("enabled");
      const storedTheme = localStorage.getItem("theme");
      
      data = {
        profiles: storedProfiles ? JSON.parse(storedProfiles) : null,
        activeProfileId: storedActiveId || null,
        enabled: storedEnabled === "true",
        theme: storedTheme || "dark"
      };
    }
    
    state.profiles = data.profiles || [];
    state.profiles.forEach(p => {
      if (!p.headers) p.headers = [];
      if (!p.filters) p.filters = [];
      if (!p.redirects) p.redirects = [];
      p.filters.forEach(f => {
        if (!f.type) f.type = "url-match";
      });
    });
    state.activeProfileId = data.activeProfileId || "";
    state.enabled = !!data.enabled;
    
    const theme = data.theme || "dark";
    applyTheme(theme);
    
    // Fallback if profiles list is empty
    if (state.profiles.length === 0) {
      const defaultProfile = createNewProfileObject("Default Profile");
      state.profiles = [defaultProfile];
      state.activeProfileId = defaultProfile.id;
      await saveState();
    } else if (!state.activeProfileId || !state.profiles.some(p => p.id === state.activeProfileId)) {
      state.activeProfileId = state.profiles[0].id;
      await saveState();
    }
  } catch (err) {
    console.error("Failed to load state from storage:", err);
    showToast("Error loading configuration", "danger");
  }
}

// Save State to Chrome Storage or LocalStorage fallback
async function saveState() {
  try {
    if (isExtension) {
      await chrome.storage.local.set({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        enabled: state.enabled
      });
    } else {
      localStorage.setItem("profiles", JSON.stringify(state.profiles));
      localStorage.setItem("activeProfileId", state.activeProfileId);
      localStorage.setItem("enabled", state.enabled ? "true" : "false");
    }
  } catch (err) {
    console.error("Failed to save state to storage:", err);
    showToast("Failed to save changes", "danger");
  }
}

// Helper to create a new profile object
function createNewProfileObject(name) {
  return {
    id: "profile-" + Date.now() + Math.random().toString(36).substr(2, 5),
    name: name,
    headers: [],
    filters: [],
    redirects: [],
    resourceTypes: [...ALL_RESOURCE_TYPES]
  };
}

// Setup Event Listeners
function setupEventListeners() {
  // Master Switch
  masterEnable.addEventListener("change", async (e) => {
    state.enabled = e.target.checked;
    await saveState();
    updateStatusIndicator();
  });

  // Profile Selection
  profileSelect.addEventListener("change", async (e) => {
    state.activeProfileId = e.target.value;
    await saveState();
    renderActiveProfile();
  });

  // Open Dashboard in a New Tab
  btnOpenTab.addEventListener("click", () => {
    if (isExtension) {
      chrome.tabs.create({ url: chrome.runtime.getURL("ui/popup.html?mode=dashboard") });
    } else {
      window.open("popup.html?mode=dashboard", "_blank");
    }
  });

  // Theme Toggle Button
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const isLight = document.documentElement.classList.contains("light-theme");
      applyTheme(isLight ? "dark" : "light");
    });
  }

  // Docs Modal Handlers
  if (btnShowDocs && docsModal && btnCloseDocs) {
    btnShowDocs.addEventListener("click", () => {
      docsModal.classList.add("show");
    });
    btnCloseDocs.addEventListener("click", () => {
      docsModal.classList.remove("show");
    });
    docsModal.addEventListener("click", (e) => {
      if (e.target === docsModal) {
        docsModal.classList.remove("show");
      }
    });
  }

    // Quick Add Request Header
  btnQuickAddReq.addEventListener("click", async () => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;
    
    activeProfile.headers.push({
      id: "header-" + Date.now() + Math.random().toString(36).substr(2, 5),
      type: "request",
      operation: "set",
      name: "",
      value: "",
      enabled: true,
      comment: ""
    });
    
    await saveState();
    renderActiveProfile();
    
    // Focus name input of the new row
    const rows = headersTbody.querySelectorAll("tr");
    if (rows.length > 0) {
      const lastRowNameInput = rows[rows.length - 1].querySelector('.col-name input');
      if (lastRowNameInput) lastRowNameInput.focus();
    }
  });

  // Quick Add Response Header
  btnQuickAddRes.addEventListener("click", async () => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;
    
    activeProfile.headers.push({
      id: "header-" + Date.now() + Math.random().toString(36).substr(2, 5),
      type: "response",
      operation: "set",
      name: "",
      value: "",
      enabled: true,
      comment: ""
    });
    
    await saveState();
    renderActiveProfile();
    
    // Focus name input of the new row
    const rows = headersTbody.querySelectorAll("tr");
    if (rows.length > 0) {
      const lastRowNameInput = rows[rows.length - 1].querySelector('.col-name input');
      if (lastRowNameInput) lastRowNameInput.focus();
    }
  });

  // Quick Add URL Filter
  btnQuickAddFilter.addEventListener("click", async () => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;
    
    const detectedUrl = await getCurrentTabUrl();
    const defaultUrl = detectedUrl || "*://example.com/*";
    
    activeProfile.filters.push({
      id: "filter-" + Date.now() + Math.random().toString(36).substr(2, 5),
      value: defaultUrl,
      type: "url-match",
      enabled: true
    });
    
    await saveState();
    renderActiveProfile();
    
    // Focus input of the new filter and select all text
    const items = filtersList.querySelectorAll("li");
    if (items.length > 0) {
      const lastFilterInput = items[items.length - 1].querySelector('input[type="text"]');
      if (lastFilterInput) {
        lastFilterInput.focus();
        lastFilterInput.select();
      }
    }
  });

  // Quick Add Redirect Rule
  btnQuickAddRedirect.addEventListener("click", async () => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;
    
    if (!activeProfile.redirects) activeProfile.redirects = [];
    
    activeProfile.redirects.push({
      id: "redirect-" + Date.now() + Math.random().toString(36).substr(2, 5),
      pattern: "",
      target: "",
      enabled: true,
      comment: ""
    });
    
    await saveState();
    renderActiveProfile();
    
    // Focus original pattern input of the newly added row
    const redirectsTbody = document.getElementById("redirects-tbody");
    if (redirectsTbody) {
      const rows = redirectsTbody.querySelectorAll("tr");
      if (rows.length > 0) {
        const lastRowPatternInput = rows[rows.length - 1].querySelector('.col-pattern input');
        if (lastRowPatternInput) lastRowPatternInput.focus();
      }
    }
  });

  // Toggle Resource Types Button
  btnToggleResources.addEventListener("click", async () => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;
    
    const allSelected = activeProfile.resourceTypes.length === ALL_RESOURCE_TYPES.length;
    if (allSelected) {
      activeProfile.resourceTypes = [];
    } else {
      activeProfile.resourceTypes = [...ALL_RESOURCE_TYPES];
    }
    
    await saveState();
    renderActiveProfile();
  });

  // Profile Toolbar Management Actions
  btnCreateProfile.addEventListener("click", () => {
    openModal("Create Profile", "", async (name) => {
      const cleanName = name.trim();
      if (!cleanName) return;
      const newProfile = createNewProfileObject(cleanName);
      state.profiles.push(newProfile);
      state.activeProfileId = newProfile.id;
      await saveState();
      renderUI();
    });
  });

  btnRenameProfile.addEventListener("click", () => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;
    
    openModal("Rename Profile", activeProfile.name, async (newName) => {
      const cleanName = newName.trim();
      if (!cleanName || cleanName === activeProfile.name) return;
      activeProfile.name = cleanName;
      await saveState();
      renderProfileSelect();
    });
  });

  btnCloneProfile.addEventListener("click", async () => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;
    
    const clone = JSON.parse(JSON.stringify(activeProfile));
    clone.id = "profile-" + Date.now() + Math.random().toString(36).substr(2, 5);
    clone.name = activeProfile.name + " (Copy)";
    
    state.profiles.push(clone);
    state.activeProfileId = clone.id;
    
    await saveState();
    renderUI();
  });

  btnDeleteProfile.addEventListener("click", async () => {
    if (state.profiles.length <= 1) {
      showToast("Cannot delete the only remaining profile!", "danger");
      return;
    }
    
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;
    
    if (confirm(`Are you sure you want to delete profile "${activeProfile.name}"?`)) {
      state.profiles = state.profiles.filter(p => p.id !== activeProfile.id);
      state.activeProfileId = state.profiles[0].id;
      await saveState();
      renderUI();
    }
  });

  // Import / Export JSON
  btnExportProfiles.addEventListener("click", () => {
    try {
      const exportData = {
        app: "InterceptX",
        version: "1.0.0",
        timestamp: Date.now(),
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        enabled: state.enabled
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const filename = `interceptx-export-${new Date().toISOString().split('T')[0]}.json`;
      
      if (isExtension) {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true
        }, (downloadId) => {
          URL.revokeObjectURL(url);
          if (chrome.runtime.lastError) {
            console.error("Download failed:", chrome.runtime.lastError);
            showToast("Export failed: " + chrome.runtime.lastError.message, "danger");
          } else {
            showToast("Profiles exported successfully");
          }
        });
      } else {
        // Fallback for file:// or http:// browser testing: use Data URL to ensure the download filename is respected
        const base64Json = btoa(unescape(encodeURIComponent(jsonString)));
        const dataUrl = `data:application/json;charset=utf-8;base64,${base64Json}`;
        
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Profiles exported successfully");
      }
    } catch (err) {
      console.error("Failed to export profiles:", err);
      showToast("Failed to export profiles", "danger");
    }
  });

  btnImportTrigger.addEventListener("click", () => {
    importFile.click();
  });

  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      showToast("Import failed: Please select a valid .json file", "danger");
      importFile.value = "";
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.profiles || !Array.isArray(imported.profiles)) {
          throw new Error("Invalid configuration file format. 'profiles' array is missing.");
        }
        
        // Merge or replace options
        if (confirm("Do you want to overwrite your current configuration? (Cancel will merge the profiles instead)")) {
          state.profiles = imported.profiles;
          state.activeProfileId = imported.activeProfileId || imported.profiles[0].id;
          state.enabled = imported.enabled !== undefined ? !!imported.enabled : state.enabled;
        } else {
          // Merge logic (avoid duplicating IDs by refreshing them)
          for (const profile of imported.profiles) {
            const freshProfile = JSON.parse(JSON.stringify(profile));
            freshProfile.id = "profile-" + Date.now() + Math.random().toString(36).substr(2, 5);
            freshProfile.name = profile.name + " (Imported)";
            state.profiles.push(freshProfile);
          }
        }
        
        // Sanitize imported profiles to guarantee data properties exist
        state.profiles.forEach(p => {
          if (!p.headers) p.headers = [];
          if (!p.filters) p.filters = [];
          if (!p.redirects) p.redirects = [];
          p.filters.forEach(f => {
            if (!f.type) f.type = "url-match";
          });
        });
        
        await saveState();
        renderUI();
        showToast("Configuration imported successfully");
      } catch (err) {
        console.error("Failed to import configuration:", err);
        showToast("Import failed: " + err.message, "danger");
      }
      // Reset file input
      importFile.value = "";
    };
    reader.readAsText(file);
  });

  // Modal Dialog Action Triggers
  btnModalCancel.addEventListener("click", closeModal);
  btnModalSave.addEventListener("click", submitModal);
  
  modalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitModal();
    } else if (e.key === "Escape") {
      closeModal();
    }
  });
}

// Get Currently Active Profile
function getActiveProfile() {
  return state.profiles.find(p => p.id === state.activeProfileId);
}

// Render Entire UI
function renderUI() {
  masterEnable.checked = state.enabled;
  updateStatusIndicator();
  renderProfileSelect();
  renderActiveProfile();
}

// Render Profile Selection Dropdown
function renderProfileSelect() {
  profileSelect.innerHTML = "";
  for (const profile of state.profiles) {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    option.selected = profile.id === state.activeProfileId;
    profileSelect.appendChild(option);
  }
}

// Render the Active Profile Configurations (Headers, Filters, Resource Types)
function renderActiveProfile() {
  const activeProfile = getActiveProfile();
  if (!activeProfile) {
    headersTbody.innerHTML = "";
    headersEmpty.style.display = "flex";
    filtersList.innerHTML = "";
    filtersEmpty.style.display = "flex";
    return;
  }

  // 1. Render Headers
  headersTbody.innerHTML = "";
  if (!activeProfile.headers || activeProfile.headers.length === 0) {
    headersEmpty.style.display = "flex";
  } else {
    headersEmpty.style.display = "none";
    activeProfile.headers.forEach((header, index) => {
      const row = document.createElement("tr");
      row.dataset.id = header.id;
      
      const currentActionType = `${header.type}-${header.operation}`;
      
      row.innerHTML = `
        <td class="col-active">
          <label class="checkbox-container">
            <input type="checkbox" class="header-enable-toggle" ${header.enabled ? "checked" : ""}>
            <span class="checkmark"></span>
          </label>
        </td>
        <td class="col-type">
          <select class="header-action-select">
            <option value="request-set" ${currentActionType === "request-set" ? "selected" : ""}>Req: Set</option>
            <option value="request-append" ${currentActionType === "request-append" ? "selected" : ""}>Req: Append</option>
            <option value="request-remove" ${currentActionType === "request-remove" ? "selected" : ""}>Req: Remove</option>
            <option value="response-set" ${currentActionType === "response-set" ? "selected" : ""}>Res: Set</option>
            <option value="response-append" ${currentActionType === "response-append" ? "selected" : ""}>Res: Append</option>
            <option value="response-remove" ${currentActionType === "response-remove" ? "selected" : ""}>Res: Remove</option>
          </select>
        </td>
        <td class="col-name">
          <input type="text" class="header-name-input" value="${escapeHtml(header.name)}" placeholder="e.g. User-Agent">
        </td>
        <td class="col-value">
          <input type="text" class="header-value-input" value="${escapeHtml(header.value)}" placeholder="e.g. MyCustomUA" ${header.operation === "remove" ? "disabled" : ""}>
        </td>
        <td class="col-comment">
          <input type="text" class="header-comment-input" value="${escapeHtml(header.comment || "")}" placeholder="Comment...">
        </td>
        <td class="col-delete">
          <button class="btn btn-icon btn-danger btn-delete-row" title="Delete Rule">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      `;
      
      // Inline Row Change Listeners
      const rowEnableToggle = row.querySelector(".header-enable-toggle");
      const rowActionSelect = row.querySelector(".header-action-select");
      const rowNameInput = row.querySelector(".header-name-input");
      const rowValueInput = row.querySelector(".header-value-input");
      const rowCommentInput = row.querySelector(".header-comment-input");
      const rowDeleteBtn = row.querySelector(".btn-delete-row");
      
      rowEnableToggle.addEventListener("change", async (e) => {
        header.enabled = e.target.checked;
        await saveState();
      });
      
      rowActionSelect.addEventListener("change", async (e) => {
        const [type, op] = e.target.value.split("-");
        header.type = type;
        header.operation = op;
        if (header.operation === "remove") {
          rowValueInput.disabled = true;
          rowValueInput.value = "";
          header.value = "";
        } else {
          rowValueInput.disabled = false;
        }
        await saveState();
      });
      
      rowNameInput.addEventListener("blur", async (e) => {
        const val = e.target.value.trim();
        // Validation check for spaces in header name
        if (val.includes(" ")) {
          rowNameInput.classList.add("invalid");
          showToast("Header names should not contain spaces", "danger");
        } else {
          rowNameInput.classList.remove("invalid");
        }
        header.name = val;
        await saveState();
      });
      
      rowValueInput.addEventListener("blur", async (e) => {
        header.value = e.target.value;
        await saveState();
      });
      
      rowCommentInput.addEventListener("blur", async (e) => {
        header.comment = e.target.value;
        await saveState();
      });
      
      rowDeleteBtn.addEventListener("click", async () => {
        activeProfile.headers.splice(index, 1);
        await saveState();
        renderActiveProfile();
      });
      
      headersTbody.appendChild(row);
    });
  }

  // 1.5. Render Redirects
  const redirectsTbody = document.getElementById("redirects-tbody");
  const redirectsEmpty = document.getElementById("redirects-empty");
  
  if (redirectsTbody) {
    redirectsTbody.innerHTML = "";
    const redirects = activeProfile.redirects || [];
    
    if (redirects.length === 0) {
      redirectsEmpty.style.display = "flex";
    } else {
      redirectsEmpty.style.display = "none";
      redirects.forEach((r, index) => {
        const row = document.createElement("tr");
        row.dataset.id = r.id;
        
        row.innerHTML = `
          <td class="col-active">
            <label class="checkbox-container">
              <input type="checkbox" class="redirect-enable-toggle" ${r.enabled ? "checked" : ""}>
              <span class="checkmark"></span>
            </label>
          </td>
          <td class="col-pattern">
            <input type="text" class="redirect-pattern-input" value="${escapeHtml(r.pattern)}" placeholder="e.g. .*google.com/(.*)">
          </td>
          <td class="col-target">
            <input type="text" class="redirect-target-input" value="${escapeHtml(r.target)}" placeholder="e.g. https://httpbin.org/anything/$1">
          </td>
          <td class="col-comment">
            <input type="text" class="redirect-comment-input" value="${escapeHtml(r.comment || "")}" placeholder="Comment...">
          </td>
          <td class="col-delete">
            <button class="btn btn-icon btn-danger btn-delete-redirect" title="Delete Redirect Rule">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>
        `;
        
        const rowEnable = row.querySelector(".redirect-enable-toggle");
        const rowPattern = row.querySelector(".redirect-pattern-input");
        const rowTarget = row.querySelector(".redirect-target-input");
        const rowComment = row.querySelector(".redirect-comment-input");
        const rowDelete = row.querySelector(".btn-delete-redirect");
        
        rowEnable.addEventListener("change", async (e) => {
          r.enabled = e.target.checked;
          await saveState();
        });
        
        rowPattern.addEventListener("blur", async (e) => {
          r.pattern = e.target.value.trim();
          await saveState();
        });
        
        rowTarget.addEventListener("blur", async (e) => {
          r.target = e.target.value.trim();
          await saveState();
        });
        
        rowComment.addEventListener("blur", async (e) => {
          r.comment = e.target.value;
          await saveState();
        });
        
        rowDelete.addEventListener("click", async () => {
          activeProfile.redirects.splice(index, 1);
          await saveState();
          renderActiveProfile();
        });
        
        redirectsTbody.appendChild(row);
      });
    }
  }

  // 2. Render URL Filters
  filtersList.innerHTML = "";
  if (!activeProfile.filters || activeProfile.filters.length === 0) {
    filtersEmpty.style.display = "flex";
  } else {
    filtersEmpty.style.display = "none";
    activeProfile.filters.forEach((filter, index) => {
      const li = document.createElement("li");
      li.className = "filter-item";
      li.dataset.id = filter.id;
      
      const filterType = filter.type || "url-match";
      
      li.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" class="filter-enable-toggle" ${filter.enabled ? "checked" : ""}>
          <span class="checkmark"></span>
        </label>
        <select class="filter-type-select">
          <option value="url-match" ${filterType === "url-match" ? "selected" : ""}>Match</option>
          <option value="url-exclude" ${filterType === "url-exclude" ? "selected" : ""}>Exclude</option>
          <option value="tab-domain" ${filterType === "tab-domain" ? "selected" : ""}>Domain</option>
        </select>
        <input type="text" class="filter-url-input" value="${escapeHtml(filter.value)}" placeholder="Pattern / Domain...">
        <button class="btn btn-icon btn-danger btn-sm btn-delete-filter" title="Delete Filter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;
      
      const filterEnableToggle = li.querySelector(".filter-enable-toggle");
      const filterTypeSelect = li.querySelector(".filter-type-select");
      const filterUrlInput = li.querySelector(".filter-url-input");
      const filterDeleteBtn = li.querySelector(".btn-delete-filter");
      
      filterEnableToggle.addEventListener("change", async (e) => {
        filter.enabled = e.target.checked;
        await saveState();
      });
      
      filterTypeSelect.addEventListener("change", async (e) => {
        filter.type = e.target.value;
        await saveState();
      });
      
      filterUrlInput.addEventListener("blur", async (e) => {
        filter.value = e.target.value.trim();
        await saveState();
      });
      
      filterDeleteBtn.addEventListener("click", async () => {
        activeProfile.filters.splice(index, 1);
        await saveState();
        renderActiveProfile();
      });
      
      filtersList.appendChild(li);
    });
  }

  // 3. Render Resource Types Grid
  resourcesGrid.innerHTML = "";
  const profileResources = activeProfile.resourceTypes || [...ALL_RESOURCE_TYPES];
  
  ALL_RESOURCE_TYPES.forEach(type => {
    const isChecked = profileResources.includes(type);
    const label = document.createElement("label");
    label.className = "resource-label";
    
    label.innerHTML = `
      <label class="checkbox-container">
        <input type="checkbox" class="resource-type-checkbox" value="${type}" ${isChecked ? "checked" : ""}>
        <span class="checkmark"></span>
      </label>
      <span>${formatResourceType(type)}</span>
    `;
    
    const checkbox = label.querySelector(".resource-type-checkbox");
    checkbox.addEventListener("change", async (e) => {
      const activeProfile = getActiveProfile();
      if (!activeProfile) return;
      
      if (e.target.checked) {
        if (!activeProfile.resourceTypes.includes(type)) {
          activeProfile.resourceTypes.push(type);
        }
      } else {
        activeProfile.resourceTypes = activeProfile.resourceTypes.filter(t => t !== type);
      }
      await saveState();
    });
    
    resourcesGrid.appendChild(label);
  });
}

// Update Master Enable/Disable status badge & theme class
function updateStatusIndicator() {
  if (state.enabled) {
    statusIndicator.textContent = "Active";
    statusIndicator.className = "status-badge active";
  } else {
    statusIndicator.textContent = "Inactive";
    statusIndicator.className = "status-badge inactive";
  }
}

// Modal dialog display functions
function openModal(title, defaultValue, callback) {
  modalTitle.textContent = title;
  modalInput.value = defaultValue;
  modalCallback = callback;
  modalContainer.classList.add("show");
  setTimeout(() => modalInput.focus(), 50);
}

function closeModal() {
  modalContainer.classList.remove("show");
  modalCallback = null;
  modalInput.value = "";
}

function submitModal() {
  const value = modalInput.value.trim();
  if (value && modalCallback) {
    modalCallback(value);
  }
  closeModal();
}

// Toast Notifications Helper
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const textSpan = document.createElement("span");
  textSpan.textContent = message;
  toast.appendChild(textSpan);
  container.appendChild(toast);
  
  // Animate Entrance
  setTimeout(() => toast.classList.add("show"), 10);
  
  // Automatic Exit
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 300);
  }, 2500);
}

// Helper: Escape HTML strings for safety
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper: Format resource types for friendly UI display
function formatResourceType(type) {
  if (type === "main_frame") return "Document (main)";
  if (type === "sub_frame") return "Iframe (sub)";
  if (type === "xmlhttprequest") return "XHR/Fetch";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Helper: Query the currently active tab URL to auto-populate filters
async function getCurrentTabUrl() {
  if (isExtension) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const urlObj = new URL(tab.url);
        // Exclude system pages and file pages, only apply to http/https
        if (urlObj.protocol.startsWith("http")) {
          return `*://${urlObj.host}/*`;
        }
      }
    } catch (err) {
      console.error("Failed to query active tab URL:", err);
    }
  }
  return "";
}
