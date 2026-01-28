// TypiPat - Field & Page Detection System
// Real-time detection and safe expansion logic

// ==========================================
// 1. Field Detection Logic
// ==========================================
// ==========================================
// 1. Field Detection Logic
// ==========================================
const FieldDetector = {
  /**
   * Identifies the type of text field the user is interacting with.
   * Handles Shadow DOM and deep active elements.
   * @returns {string} - 'input', 'textarea', 'contentEditable', 'password', 'readonly', or 'unknown'.
   */
  getFieldType(originalElement) {
    // 1. Deep Active Element Detection (Shadow DOM support)
    let element = this.getDeepActiveElement();
    if (!element) element = originalElement; // Fallback

    if (!element) return "unknown";

    // Check for Read-Only / Disabled
    if (element.isContentEditable === false && element.readOnly)
      return "readonly";
    if (element.disabled) return "readonly";

    const tagName = element.tagName.toLowerCase();
    const inputType = (element.type || "").toLowerCase();

    // 2. Password Fields (Strict No-Expansion)
    if (tagName === "input" && inputType === "password") {
      return "password";
    }

    // 3. Standard Inputs
    if (tagName === "input") {
      const validTypes = ["text", "email", "url", "search", "tel", "number"];
      if (validTypes.includes(inputType) || !inputType) {
        return "input";
      }
      return "unknown";
    }

    // 4. Textarea
    if (tagName === "textarea") {
      if (element.readOnly || element.disabled) return "readonly";
      return "textarea";
    }

    // 5. ContentEditable (Rich Text Editors)
    if (element.isContentEditable) {
      if (element.getAttribute("contenteditable") === "false")
        return "readonly";
      return "contentEditable";
    }

    // 6. Iframe Handling (Optional, but good for "everything")
    if (tagName === "iframe") {
      try {
        // If we can access the iframe document
        const innerDoc =
          element.contentDocument || element.contentWindow.document;
        if (innerDoc && innerDoc.designMode === "on") return "contentEditable";
      } catch (e) {
        // Cross-origin, can't access directly.
        // The content script should ideally be injected into all frames (<all_frames>: true in manifest could help, but user didn't ask for that specifically yet).
      }
    }

    return "unknown";
  },

  /**
   * traverses Shadow DOMs to find the actual focused element
   */
  getDeepActiveElement() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  },
};

// ==========================================
// 2. Template Processing (Unchanged)
// ==========================================
const TemplateProcessor = {
  process(text) {
    const now = new Date();
    const date =
      now.getMonth() + 1 + "/" + now.getDate() + "/" + now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const time = hours + ":" + minutes + " " + ampm;
    const datetime = date + " " + time;

    return text
      .replace(/{datetime}/g, datetime)
      .replace(/{data-time}/g, datetime)
      .replace(/{date}/g, date)
      .replace(/{time}/g, time);
  },
};

// ==========================================
// 3. Expansion Logic (Direct + Clipboard Fallback)
// ==========================================
const SnippetExpander = {
  async expand(element, shortcut, replacement, fieldType) {
    const processedReplacement = TemplateProcessor.process(replacement);

    // STRATEGY: Try direct manipulation first (faster, less disruptive)
    // If that fails or is risky, use Clipboard Fallback.

    let success = false;

    // Direct Method
    try {
      if (fieldType === "input" || fieldType === "textarea") {
        success = this.insertInInput(element, shortcut, processedReplacement);
      } else if (fieldType === "contentEditable") {
        success = this.insertInContentEditable(
          element,
          shortcut,
          processedReplacement,
        );
      }
    } catch (err) {
      success = false;
    }

    // Clipboard Fallback (The "Works Everywhere" Method)
    if (!success) {
      await this.insertViaClipboard(shortcut, processedReplacement);
    }
  },

  insertInInput(element, shortcut, replacement) {
    try {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const val = element.value;

      // Basic sanity check: ensure shortcut is actually before cursor
      const textBefore = val.slice(0, start);
      if (!textBefore.endsWith(shortcut)) {
        return false;
      }

      const before = val.slice(0, start - shortcut.length);
      const after = val.slice(end);

      // React / Framework compatibility: Use native setter
      const prototype =
        element.tagName.toLowerCase() === "textarea"
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        prototype,
        "value",
      ).set;

      const newContent = before + replacement + after;

      if (nativeSetter) {
        nativeSetter.call(element, newContent);
      } else {
        element.value = newContent;
      }

      // CARET LOCKING: Calculate precise new position
      const newCursorPos = before.length + replacement.length;

      // Force focus before setting selection range (Anchor Lock)
      element.focus();

      // Strict Reset: Ensure cursor is exactly at the end of the insertion
      element.setSelectionRange(newCursorPos, newCursorPos);

      // Framework Sync: Trigger aggressive events
      this.triggerInputEvents(element);
      return true;
    } catch (e) {
      return false;
    }
  },

  insertInContentEditable(element, shortcut, replacement) {
    // ATOMIC EXPANSION: Select shortcut backwards, then replace with insertText
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    // Verify we're in a text node and shortcut exists
    const range = selection.getRangeAt(0);
    if (range.endContainer.nodeType !== Node.TEXT_NODE) return false;

    const text = range.endContainer.textContent;
    const endOffset = range.endOffset;

    if (endOffset < shortcut.length) return false;

    const startOffset = endOffset - shortcut.length;
    if (text.slice(startOffset, endOffset) !== shortcut) return false;

    // STEP 1: Use selection.modify to select the shortcut (most reliable method)
    // First collapse to ensure clean state
    selection.collapseToEnd();

    // Extend selection backwards character by character
    if (selection.modify) {
      for (let i = 0; i < shortcut.length; i++) {
        selection.modify("extend", "backward", "character");
      }
    } else {
      // Fallback: Manual range selection
      const newRange = document.createRange();
      newRange.setStart(range.endContainer, startOffset);
      newRange.setEnd(range.endContainer, endOffset);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    // STEP 2: Insert replacement text (this replaces the selection)
    const result = document.execCommand("insertText", false, replacement);

    if (result) {
      // Ensure cursor is at end of insertion
      const finalSelection = window.getSelection();
      if (finalSelection && finalSelection.rangeCount > 0) {
        finalSelection.collapseToEnd();
      }
      return true;
    }

    return false;
  },

  async insertViaClipboard(shortcut, replacement) {
    // 1. Save current clipboard
    const originalClipboard = await chrome.runtime.sendMessage({
      action: "saveClipboard",
    });

    // 2. Delete the shortcut (we need to select it using "Shift + ArrowLeft" logic or similar?)
    // Since we can't reliably "simulate" keypresses from content script without debugger API,
    // we have to rely on the fact that the USER Typed it.
    // So we can try `document.execCommand('delete')` in a loop? No.

    // Backspace simulation is impossible directly.
    // We assume the user creates a selection or we "select backwards".

    // If we are in valid input/CE, we can programmatically select the previous N chars and delete.
    const el = FieldDetector.getDeepActiveElement();
    if (el) {
      // Try to select the shortcut
      if (this.selectTextBackwards(el, shortcut.length)) {
        document.execCommand("delete"); // Or just paste over it
      } else {
        // If we can't select it, we just Paste. The shortcut remains?
        // That's bad UX. But if we can't delete, we can't replace.
        // Usually, `selectTextBackwards` works if we are in a text context.
      }
    }

    // 3. Write replacement to clipboard
    await chrome.runtime.sendMessage({
      action: "restoreClipboard",
      data: replacement,
    });

    // 4. Paste
    document.execCommand("paste");

    // 5. Restore original clipboard
    // We need a small delay to ensure paste finished?
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: "restoreClipboard",
        data: originalClipboard,
      });
    }, 100);
  },

  // Helper to select last N chars of active element
  selectTextBackwards(element, length) {
    // Input/Textarea
    if (["input", "textarea"].includes(element.tagName.toLowerCase())) {
      const start = element.selectionStart;
      if (start >= length) {
        element.setSelectionRange(start - length, start);
        return true;
      }
    }
    // ContentEditable
    else if (element.isContentEditable) {
      const sel = window.getSelection();
      if (!sel.rangeCount) return false;
      const range = sel.getRangeAt(0);

      // Collapse to end first?
      // We try to move start backwards
      // This is complex in rich text.
      // Simplified: Extend selection logic
      // `selection.modify` is non-standard but widely supported in Chrome/Webkit
      if (sel.modify) {
        // Extend selection backwards by 'length' characters?
        // modify('extend', 'backward', 'character') is one by one.
        for (let i = 0; i < length; i++) {
          sel.modify("extend", "backward", "character");
        }
        return true;
      }
    }
    return false;
  },

  triggerInputEvents(element) {
    // AGGRESSIVE FRAMEWORK SYNC (Event Dispatching)
    // Use InputEvent with insertReplacementText for proper framework detection

    // 1. InputEvent with proper inputType (official way to signal text replacement)
    try {
      const inputEvent = new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertReplacementText",
        data: null,
      });
      element.dispatchEvent(inputEvent);
    } catch (e) {
      // Fallback for older browsers
      const fallbackInput = new Event("input", {
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(fallbackInput);
    }

    // 2. Change event
    const changeEvent = new Event("change", {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(changeEvent);

    // 3. Keyup event (some frameworks listen to this)
    const keyupEvent = new Event("keyup", { bubbles: true, cancelable: true });
    element.dispatchEvent(keyupEvent);
  },
};

// ==========================================
// 4. Main Orchestrator
// ==========================================
const TypiPat = {
  shortcuts: {},
  sortedKeys: [], // Cache sorted keys for performance
  isReplacing: false,

  init() {
    this.loadShortcuts();

    // Listen for storage changes via TypiStorage helper
    TypiStorage.onChanged((data) => {
      this.updateShortcuts(data);
    });

    // Main Input Listener
    document.addEventListener("input", this.handleInput.bind(this), true);
  },

  loadShortcuts() {
    TypiStorage.loadAll().then((data) => {
      this.updateShortcuts(data);
    });
  },

  updateShortcuts(data) {
    this.shortcuts = {};
    for (let key in data) {
      if (!key.startsWith("__label__") && !key.startsWith("__meta__")) {
        this.shortcuts[key] = data[key];
      }
    }
    // PERFORMANCE: Sort once on load
    this.sortedKeys = Object.keys(this.shortcuts).sort(
      (a, b) => b.length - a.length,
    );
  },

  handleInput(e) {
    if (this.isReplacing) return;

    // Shadow DOM support: Get the actual target
    const path = e.composedPath ? e.composedPath() : [];
    const element = path.length > 0 ? path[0] : e.target;
    const fieldType = FieldDetector.getFieldType(element);

    // 1. Early Exit for unsupported fields
    if (
      fieldType === "password" ||
      fieldType === "readonly" ||
      fieldType === "unknown"
    ) {
      return;
    }

    // 2. Get Text Context
    const context = this.getTextContext(element, fieldType);
    if (!context) return;

    const { textBeforeCursor } = context;

    // 3. Check for Matches
    // Use cached sortedKeys
    for (let shortcut of this.sortedKeys) {
      if (textBeforeCursor.endsWith(shortcut)) {
        // Boundary Check
        if (!this.isWordBoundary(textBeforeCursor, shortcut)) {
          continue;
        }

        // Match Found!
        const replacement = this.shortcuts[shortcut];

        this.isReplacing = true;
        try {
          SnippetExpander.expand(element, shortcut, replacement, fieldType);
        } catch (err) {
          // Silent fail
        } finally {
          // RECOVERY DELAY: 150ms for browser rendering before next keystroke
          setTimeout(() => {
            this.isReplacing = false;
          }, 150);
        }

        break; // Stop after first match (longest due to sort)
      }
    }
  },

  getTextContext(element, fieldType) {
    try {
      if (fieldType === "input" || fieldType === "textarea") {
        return {
          textBeforeCursor: element.value.substring(0, element.selectionStart),
        };
      } else if (fieldType === "contentEditable") {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          // We need text before caret.
          // Cloning range to select everything before caret in the current block is tricky.
          // Simplest reliable method for *detection* is getting the text content of the current node
          // up to the offset.
          const node = range.endContainer;
          const offset = range.endOffset;

          if (node.nodeType === Node.TEXT_NODE) {
            return {
              textBeforeCursor: node.textContent.substring(0, offset),
            };
          }
          // If caret is not in a text node (rare during typing), we might be at element boundary.
          return null;
        }
      }
    } catch (err) {
      return null;
    }
    return null;
  },

  isWordBoundary(text, shortcut) {
    const beforeIndex = text.length - shortcut.length - 1;
    if (beforeIndex < 0) return true; // Start of line

    const charBefore = text.charAt(beforeIndex);
    // Allow expansion if preceded by whitespace or punctuation
    return !/[A-Za-z0-9_]/.test(charBefore);
  },
};

// Initialize
TypiPat.init();

// ==========================================
// 5. Floating UI Injection
// ==========================================
const FloatingUI = {
  container: null,
  iframe: null,
  icon: null, // The img element
  visible: false,

  // Drag State
  isDragging: false,
  startY: 0,
  startTop: 0,
  hasMoved: false,

  init() {
    // Anti-Ad: Only run on the top-level frame
    if (window !== window.top) return;

    this.createButton();
    this.createOverlay();

    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "toggleOverlay") {
        this.toggleOverlay();
      }
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (
        this.visible &&
        this.iframe &&
        !this.iframe.contains(e.target) &&
        this.container &&
        !this.container.contains(e.target)
      ) {
        this.closeOverlay();
      }
    });
  },

  createButton() {
    const container = document.createElement("div");
    container.id = "typipat-fab-container";

    // Icon Image
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("iPat.png");
    img.className = "typipat-fab-icon";

    container.appendChild(img);
    document.body.appendChild(container);

    // Toggle on Click (Restored)
    container.onclick = (e) => {
      e.stopPropagation();
      // Only toggle if NOT dragging
      if (!this.hasMoved) {
        this.toggleOverlay();
      }
    };

    // Open Options on Double Click (Restored)
    container.ondblclick = (e) => {
      e.stopPropagation();
      try {
        if (chrome.runtime?.id) {
          chrome.runtime.sendMessage({ action: "openOptions" });
        }
      } catch (err) {
        // Extension context invalidated
      }
    };

    // Open Options on Right Click (Orchestra Entrata)
    container.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (chrome.runtime?.id) {
          chrome.runtime.sendMessage({ action: "openOptions" });
        }
      } catch (err) {
        // Extension context invalidated
      }
    };

    this.container = container;
    this.icon = img;

    // Attach Drag Logic
    this.initDrag(container);
  },

  createOverlay() {
    const iframe = document.createElement("iframe");
    iframe.id = "typipat-overlay";
    iframe.src = chrome.runtime.getURL("popup.html"); // Correct Source
    iframe.allow = "clipboard-read; clipboard-write"; // Fix Clipboard Permissions

    document.body.appendChild(iframe);
    this.iframe = iframe;
  },

  initDrag(element) {
    const startDrag = (e) => {
      // Only left click
      if (e.button !== 0) return;

      this.isDragging = true;
      this.hasMoved = false; // Reset movement check
      this.startY = e.clientY;

      // Get current top value (computed style)
      const rect = element.getBoundingClientRect();
      this.startTop = rect.top;

      element.style.transition = "none"; // Disable transition during drag

      e.preventDefault();
    };

    const doDrag = (e) => {
      if (!this.isDragging) return;

      const deltaY = e.clientY - this.startY;

      // Threshold check: 5px movement counts as drag
      if (Math.abs(deltaY) > 5) {
        this.hasMoved = true;
      }

      const newTop = this.startTop + deltaY;

      // Update Top Position (Vertical Only) - Icon Only
      element.style.top = `${newTop}px`;

      // Decoupled: Overlay stays fixed at 15vh (handled in CSS)
    };

    const stopDrag = (e) => {
      if (!this.isDragging) return;

      this.isDragging = false;
      element.style.transition = ""; // Restore CSS transition

      // If NOT moved significantly, it's a Click.
      // We handle the actual toggle in container.onclick to avoid conflict/double-firing.
      if (!this.hasMoved) {
        // Pass to onclick
      }
    };

    element.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  },

  toggleOverlay() {
    this.visible = !this.visible;

    if (this.visible) {
      // OPEN
      this.iframe.classList.add("visible");

      // Hide Icon (Smart Toggle)
      this.container.style.display = "none";
    } else {
      // CLOSE
      this.closeOverlay();
    }
  },

  closeOverlay() {
    this.visible = false;
    this.iframe.classList.remove("visible");

    // Show Icon
    this.container.style.display = "flex";
  },
};

// Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => FloatingUI.init());
} else {
  FloatingUI.init();
}
