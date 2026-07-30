// ==========================================
// BACKGROUND SERVICE WORKER - TYPIPAT
// ==========================================

const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

// ==========================================
// 1. OFFSREEN DOCUMENT MANAGEMENT
// ==========================================
let creating;

async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ["CLIPBOARD"],
      justification: "To read and write to the clipboard for text expansion.",
    });
    try {
      await creating;
    } catch (err) {
      console.warn("Offscreen document creation failed:", err);
    }
    creating = null;
  }
}

// ==========================================
// 2. TOOLBAR CLICK LISTENER
// ==========================================
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs
      .sendMessage(tab.id, { action: "toggleOverlay" })
      .catch(() => {});
  }
});

// ==========================================
// 3. MESSAGE LISTENER (CONSOLIDATED)
// ==========================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request.action);

  // Clipboard Actions
  if (request.action === "saveClipboard" || request.action === "restoreClipboard") {
    handleClipboardAction(request)
      .then(sendResponse)
      .catch((error) => {
        console.error("Clipboard action failed:", error);
        sendResponse(null);
      });
    return true;
  }

  // 🔥 OPEN OPTIONS (pinaganda)
  if (request.action === "openOptions") {
    try {
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
    } catch (err) {
      console.error('Failed to open options:', err);
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }

  // 🔥 GET EXTENSION STATE (para sa popup)
  if (request.action === "getState") {
    chrome.storage.local.get(['enabled', 'soundEnabled'], (result) => {
      sendResponse({
        enabled: result.enabled !== false,
        soundEnabled: result.soundEnabled !== false
      });
    });
    return true;
  }

  // 🔥 TOGGLE EXTENSION
  if (request.action === "toggleExtension") {
    chrome.storage.local.get(['enabled'], (result) => {
      const newState = !result.enabled;
      chrome.storage.local.set({ enabled: newState }, () => {
        updateBadge(newState);
        sendResponse({ enabled: newState });
      });
    });
    return true;
  }

  // Unknown action
  sendResponse({ success: false, error: 'Unknown action' });
  return false;
});

async function handleClipboardAction(request) {
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
  return chrome.runtime.sendMessage({
    target: "offscreen",
    action: request.action,
    data: request.data,
  });
}

// ==========================================
// 4. BADGE UPDATE (BAGO!)
// ==========================================
function updateBadge(enabled) {
  if (enabled) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  } else {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#f44336' });
  }
}

// I-load ang initial state para sa badge
chrome.storage.local.get(['enabled'], (result) => {
  updateBadge(result.enabled !== false);
});

// Makinig sa storage changes para i-update ang badge
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

// ==========================================
// 5. KEYBOARD SHORTCUTS
// ==========================================
chrome.commands.onCommand.addListener((command) => {
  console.log('⌨️ Command received:', command);
  
  if (command === "open_options") {
    chrome.runtime.openOptionsPage();
  }
  
  // 🔥 BAGO: Toggle Extension via keyboard
  if (command === "toggle_extension") {
    chrome.storage.local.get(['enabled'], (result) => {
      const newState = !result.enabled;
      chrome.storage.local.set({ enabled: newState });
    });
  }
});

// ==========================================
// 6. CONTEXT MENU
// ==========================================
chrome.runtime.onInstalled.addListener(() => {
  console.log('🎵 TypiPat installed/updated');
  
  // I-set ang default values
  chrome.storage.local.get(['enabled', 'soundEnabled'], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.local.set({ enabled: true });
    }
    if (result.soundEnabled === undefined) {
      chrome.storage.local.set({ soundEnabled: true });
    }
  });
  
  // Context menu
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "open_orchestra",
      title: "🎵 Open Orchestra Entrata",
      contexts: ["action", "page"],
    });
    
    // 🔥 BAGO: Toggle sa context menu
    chrome.contextMenus.create({
      id: "toggle_extension",
      title: "Toggle Extension",
      contexts: ["action"],
    });
  });
});

// Context Menu Click Handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open_orchestra") {
    chrome.runtime.openOptionsPage();
  }
  
  // 🔥 BAGO: Toggle sa context menu
  if (info.menuItemId === "toggle_extension") {
    chrome.storage.local.get(['enabled'], (result) => {
      const newState = !result.enabled;
      chrome.storage.local.set({ enabled: newState });
    });
  }
});

// ==========================================
// 7. STORAGE CHANGE LOGGING (debug)
// ==========================================
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('💾 Storage changed:', Object.keys(changes));
  }
});

console.log('🎵 TypiPat background service worker loaded!');