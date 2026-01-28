// Background Service Worker for TypiPat
// Handles Offscreen Document for Clipboard access

const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

// Enable side panel behavior
// Side panel behavior removed to prevent layout shift
// chrome.sidePanel usage removed

// 1. Maintain Offscreen Document
// We need to ensure the offscreen document is open when we need it.
let creating; // A promise that resolves when the offscreen document is created

// 2. Toolbar Click Listener ("Antenna")
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs
      .sendMessage(tab.id, { action: "toggleOverlay" })
      .catch(() => {});
  }
});

async function setupOffscreenDocument(path) {
  // Check if an offscreen document is already open.
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // Create the offscreen document.
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

// 2. Message Listener (Consolidated)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle Clipboard Actions
  if (
    request.action === "saveClipboard" ||
    request.action === "restoreClipboard"
  ) {
    handleClipboardAction(request)
      .then(sendResponse)
      .catch((error) => {
        console.error("Clipboard action failed:", error);
        sendResponse(null);
      });
    return true; // Keep channel open for async response
  }

  // Handle Open Options (from FAB double-click/right-click)
  if (request.action === "openOptions") {
    chrome.runtime.openOptionsPage();
    return false;
  }
});

async function handleClipboardAction(request) {
  // Ensure offscreen document exists
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

  // Forward message to offscreen document
  return chrome.runtime.sendMessage({
    target: "offscreen",
    action: request.action,
    data: request.data,
  });
}

// 3. Command Listener (Keyboard Shortcut)
chrome.commands.onCommand.addListener((command) => {
  if (command === "open_options") {
    chrome.runtime.openOptionsPage();
  }
});

// 4. Context Menu Setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "open_orchestra",
      title: "🎵 Open Orchestra Entrata",
      contexts: ["action", "page"],
    });
  });
});

// 5. Context Menu Click Handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open_orchestra") {
    chrome.runtime.openOptionsPage();
  }
});
