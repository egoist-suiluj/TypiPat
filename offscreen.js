// Offscreen Script for Clipboard Manipulation
// Uses modern Clipboard API (navigator.clipboard)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Only handle messages targeting offscreen
  if (request.target !== "offscreen") {
    return false;
  }

  // SAVE CLIPBOARD - Read current clipboard content
  if (request.action === "saveClipboard") {
    handleSaveClipboard()
      .then(sendResponse)
      .catch((error) => {
        console.error('saveClipboard failed:', error);
        sendResponse({ success: false, error: error.message, data: '' });
      });
    return true; // Keep channel open for async response
  }

  // RESTORE CLIPBOARD - Write content to clipboard
  if (request.action === "restoreClipboard") {
    handleRestoreClipboard(request.data)
      .then(sendResponse)
      .catch((error) => {
        console.error('restoreClipboard failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  return false;
});

/**
 * Save current clipboard content
 * @returns {Promise<Object>} { success: boolean, data: string, error?: string }
 */
async function handleSaveClipboard() {
  try {
    // Use Clipboard API (requires clipboardRead permission)
    const text = await navigator.clipboard.readText();
    return {
      success: true,
      data: text || ''
    };
  } catch (err) {
    // Fallback: Try using execCommand (some browsers still support it)
    try {
      const sandbox = document.getElementById('sandbox');
      if (sandbox) {
        sandbox.value = '';
        sandbox.focus();
        sandbox.select();
        const result = document.execCommand('paste');
        if (result) {
          return {
            success: true,
            data: sandbox.value || ''
          };
        }
      }
    } catch (fallbackErr) {
      // Both methods failed
    }

    throw new Error(`Failed to read clipboard: ${err.message}`);
  }
}

/**
 * Restore content to clipboard
 * @param {string} text - Text to write to clipboard
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
async function handleRestoreClipboard(text) {
  try {
    // Use Clipboard API (requires clipboardWrite permission)
    await navigator.clipboard.writeText(text || '');
    return { success: true };
  } catch (err) {
    // Fallback: Try using execCommand (some browsers still support it)
    try {
      const sandbox = document.getElementById('sandbox');
      if (sandbox) {
        sandbox.value = text || '';
        sandbox.select();
        const result = document.execCommand('copy');
        if (result) {
          return { success: true };
        }
      }
    } catch (fallbackErr) {
      // Both methods failed
    }

    throw new Error(`Failed to write clipboard: ${err.message}`);
  }
}