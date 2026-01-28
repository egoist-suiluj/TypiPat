// Offscreen Script for Clipboard Manipulation

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Only handle messages targeting offscreen
  if (request.target !== "offscreen") return;

  const sandbox = document.getElementById("sandbox");

  if (request.action === "saveClipboard") {
    // 1. Paste current clipboard into sandbox to read it
    sandbox.value = "";
    sandbox.select();

    // We use execCommand('paste') if available, but in MV3 offscreen 'clipboardRead' permission
    // usually requires the standard Clipboard API or focused document.
    // However, the prompt specifically requested the "saveClipboard + restoreClipboard" pattern.
    // Standard `execCommand('paste')` might be blocked even in offscreen without user gesture
    // depending on browser version, but let's try the standard approach for extensions.

    // Actually, for "saving" clipboard content effectively without user gesture,
    // we often use navigator.clipboard in offscreen if we have permission.
    // But let's try the robust way.

    // METHOD: Using execCommand('paste') which is more reliable in offscreen
    sandbox.value = "";
    sandbox.focus();
    sandbox.select();

    const result = document.execCommand("paste");
    if (result) {
      sendResponse(sandbox.value);
    } else {
      console.warn('execCommand("paste") failed');
      sendResponse("");
    }

    return true; // Async
  }

  if (request.action === "restoreClipboard") {
    // Write data back to clipboard
    const textToRestore = request.data || "";

    // METHOD: Using textarea + execCommand ('copy') - Classic reliable method
    sandbox.value = textToRestore;
    sandbox.select();
    document.execCommand("copy");

    sendResponse(true);
  }
});
