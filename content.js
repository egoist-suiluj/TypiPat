// TypiPat - Field & Page Detection System
// Real-time detection and safe expansion logic

// ==========================================
// 1. Field Detection Logic
// ==========================================
const FieldDetector = {
  /**
   * Identifies the type of text field the user is interacting with.
   * @param {HTMLElement} element - The target element.
   * @returns {string} - 'input', 'textarea', 'contentEditable', 'password', 'readonly', or 'unknown'.
   */
  getFieldType(element) {
    if (!element) return 'unknown';

    // Check for Read-Only / Disabled
    if (element.isContentEditable === false && element.readOnly) return 'readonly';
    if (element.disabled) return 'readonly';

    const tagName = element.tagName.toLowerCase();
    const inputType = (element.type || '').toLowerCase();

    // 1. Password Fields (Strict No-Expansion)
    if (tagName === 'input' && inputType === 'password') {
      return 'password';
    }

    // 2. Standard Inputs (Text, Email, Search, URL)
    if (tagName === 'input') {
      const validTypes = ['text', 'email', 'url', 'search', 'tel'];
      if (validTypes.includes(inputType) || !inputType) {
        return 'input';
      }
      return 'unknown'; // Date pickers, color pickers, etc.
    }

    // 3. Textarea
    if (tagName === 'textarea') {
      if (element.readOnly || element.disabled) return 'readonly';
      return 'textarea';
    }

    // 4. ContentEditable (Rich Text Editors)
    if (element.isContentEditable) {
      if (element.getAttribute('contenteditable') === 'false') return 'readonly';
      return 'contentEditable';
    }

    return 'unknown';
  },

  /**
   * Detects the current page environment (for potential future site-specific tweaks).
   * @returns {string} - e.g., 'gmail', 'facebook', 'generic'.
   */
  getPageContext() {
    const host = window.location.hostname;
    if (host.includes('mail.google.com')) return 'gmail';
    if (host.includes('facebook.com')) return 'facebook';
    if (host.includes('linkedin.com')) return 'linkedin';
    return 'generic';
  }
};

// ==========================================
// 2. Template Processing
// ==========================================
const TemplateProcessor = {
  process(text) {
    const now = new Date();

    // Date: MM/DD/YYYY
    const date = (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear();

    // Time: HH:MM AM/PM
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const time = hours + ':' + minutes + ' ' + ampm;

    // DateTime: Combined
    const datetime = date + ' ' + time;

    return text
      .replace(/{datetime}/g, datetime)
      .replace(/{data-time}/g, datetime)  // ✨ NEW: Alias for {datetime}
      .replace(/{date}/g, date)
      .replace(/{time}/g, time);
  }
};

// ==========================================
// 3. Expansion Logic (Strategies)
// ==========================================
const SnippetExpander = {
  /**
   * Main expansion method that delegates to specific strategies.
   */
  expand(element, shortcut, replacement, fieldType) {
    // Process variables first
    const processedReplacement = TemplateProcessor.process(replacement);

    switch (fieldType) {
      case 'input':
        this.expandInInput(element, shortcut, processedReplacement);
        break;
      case 'textarea':
        this.expandInTextarea(element, shortcut, processedReplacement);
        break;
      case 'contentEditable':
        this.expandInContentEditable(element, shortcut, processedReplacement);
        break;
      default:
        console.warn('[TypiPat] Unsupported field type for expansion:', fieldType);
    }
  },

  expandInInput(element, shortcut, replacement) {
    const value = element.value;
    const cursorPos = element.selectionStart;

    const before = value.substring(0, cursorPos - shortcut.length);
    const after = value.substring(cursorPos);

    element.value = before + replacement + after;

    // Restore cursor position
    const newCursorPos = before.length + replacement.length;
    element.setSelectionRange(newCursorPos, newCursorPos);

    // Trigger input event for frameworks (React, Angular, etc.)
    this.triggerInputEvent(element);
  },

  expandInTextarea(element, shortcut, replacement) {
    // Textarea handles newlines natively, logic is same as Input but we ensure
    // we don't accidentally strip newlines from the replacement if any.
    this.expandInInput(element, shortcut, replacement);
  },

  expandInContentEditable(element, shortcut, replacement) {
    // 1. Preserve trailing spaces for HTML
    // Replace trailing spaces with non-breaking spaces so they don't collapse
    const safeReplacement = replacement.replace(/(\s+)$/u, (m) => m.replace(/ /g, '\u00A0'));

    // 2. Get Selection Range
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    // 3. Calculate start position of the shortcut
    // This is tricky in ContentEditable. We assume the caret is at the end of the shortcut.
    // We need to traverse backwards to find the start node/offset.

    // Simple approach: Delete the characters backwards.
    // Note: This relies on the browser's delete capability which handles node boundaries reasonably well.
    // A more robust approach would be manual range manipulation, but `document.execCommand` 
    // or `deleteContents` on a calculated range is safer for undo history.

    // Let's try to construct a range for the shortcut to delete it.
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;

    // We need to find where the shortcut starts. 
    // Since we just matched it from `textBeforeCursor`, we know it's there.
    // We'll use a helper to find the start node/offset.
    const startPoint = this.findStartPoint(endContainer, endOffset, shortcut.length);

    if (startPoint) {
      const deleteRange = document.createRange();
      deleteRange.setStart(startPoint.node, startPoint.offset);
      deleteRange.setEnd(endContainer, endOffset);
      deleteRange.deleteContents();

      // 4. Insert Replacement
      // We insert text nodes to avoid XSS and preserve style of container
      const textNode = document.createTextNode(safeReplacement);
      deleteRange.insertNode(textNode);

      // 5. Move Cursor to End
      deleteRange.setStartAfter(textNode);
      deleteRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(deleteRange);
    } else {
      // Fallback: execCommand (deprecated but still widely supported and handles undo stack well)
      // Select the shortcut first? Hard without exact range.
      // Let's try simple deletion loop if range fails (rare).
      console.warn('[TypiPat] Could not calculate exact range for ContentEditable replacement.');
    }
  },

  /**
   * Helper to traverse backwards in text nodes to find the start of the shortcut.
   */
  findStartPoint(node, offset, length) {
    let currentLength = 0;
    let currentNode = node;
    let currentOffset = offset;

    // If we are in a text node and it has enough characters
    if (currentNode.nodeType === Node.TEXT_NODE && currentOffset >= length) {
      return { node: currentNode, offset: currentOffset - length };
    }

    // If split across nodes (complex), we'd need a full TreeWalker. 
    // For this version, we'll implement a robust text-node walker if needed.
    // But for 99% of typing cases, the shortcut is in the immediate text node.

    // TODO: Implement full multi-node traversal if users report issues with 
    // shortcuts split across bold/italic boundaries (unlikely for a typed shortcut).

    // Fallback for simple case:
    if (currentNode.nodeType === Node.TEXT_NODE) {
      // If the shortcut is longer than the current text node's content before cursor...
      // This implies the shortcut spans nodes. 
      // For now, we abort to avoid breaking complex DOMs.
      // The detection logic in `TypiPat` ensures we matched the text, 
      // so we might just be in a nested structure.
      return null;
    }

    return null;
  },

  triggerInputEvent(element) {
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
  }
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
    document.addEventListener('input', this.handleInput.bind(this), true);
  },

  loadShortcuts() {
    TypiStorage.loadAll().then((data) => {
      this.updateShortcuts(data);
    });
  },

  updateShortcuts(data) {
    this.shortcuts = {};
    for (let key in data) {
      if (!key.startsWith('__label__') && !key.startsWith('__meta__')) {
        this.shortcuts[key] = data[key];
      }
    }
    // PERFORMANCE: Sort once on load
    this.sortedKeys = Object.keys(this.shortcuts).sort((a, b) => b.length - a.length);
    console.log('[TypiPat] Shortcuts loaded & sorted:', this.sortedKeys.length);
  },

  handleInput(e) {
    if (this.isReplacing) return;

    const element = e.target;
    const fieldType = FieldDetector.getFieldType(element);

    // 1. Early Exit for unsupported fields
    if (fieldType === 'password' || fieldType === 'readonly' || fieldType === 'unknown') {
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
          console.error('[TypiPat] Expansion failed:', err);
        } finally {
          // Increased timeout for better VM compatibility and to prevent race conditions
          setTimeout(() => { this.isReplacing = false; }, 100);
        }

        break; // Stop after first match (longest due to sort)
      }
    }
  },

  getTextContext(element, fieldType) {
    try {
      if (fieldType === 'input' || fieldType === 'textarea') {
        return {
          textBeforeCursor: element.value.substring(0, element.selectionStart)
        };
      } else if (fieldType === 'contentEditable') {
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
              textBeforeCursor: node.textContent.substring(0, offset)
            };
          }
          // If caret is not in a text node (rare during typing), we might be at element boundary.
          return null;
        }
      }
    } catch (err) {
      console.error('[TypiPat] Error getting context:', err);
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
  }
};

// Initialize
TypiPat.init();