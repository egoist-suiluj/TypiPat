// TypiPat - Shared Utilities
// Common functions used across popup and options pages

const TypiUtils = {
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped HTML
   */
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Show notification toast
   * @param {string} message - Message to display
   * @param {string} type - Type of notification ('info', 'success', 'error')
   * @param {string} icon - Emoji icon to display
   */
  showNotification(message, type = "info", icon = "🎵") {
    const toast = document.getElementById("notificationToast");
    const iconEl = document.getElementById("notificationIcon");
    const msgEl = document.getElementById("notificationMessage");

    if (!toast || !iconEl || !msgEl) {
      console.warn("[TypiPat] Notification elements not found");
      return;
    }

    iconEl.textContent = icon;
    msgEl.textContent = message;
    toast.className = `notification-toast ${type} show`;

    setTimeout(
      () => toast.classList.remove("show"),
      TIMING_CONFIG.NOTIFICATION_DURATION,
    );
  },

  /**
   * Parse storage data into shortcuts and labels
   * @param {Object} data - Raw storage data
   * @returns {Object} - { shortcuts, labels }
   */
  parseStorageData(data) {
    const shortcuts = {};
    const labels = {};

    for (let key in data) {
      if (key.startsWith("__label__")) {
        const shortcutKey = key.replace("__label__", "");
        labels[shortcutKey] = data[key];
      } else if (key.startsWith("__meta__")) {
        continue; // Skip metadata
      } else {
        shortcuts[key] = data[key];
      }
    }

    return { shortcuts, labels };
  },

  /**
   * Sort shortcuts by label alphabetically
   * @param {Object} shortcuts - Shortcuts object
   * @param {Object} labels - Labels object
   * @returns {Array} - Sorted array of shortcut keys
   */
  sortShortcutsByLabel(shortcuts, labels) {
    return Object.keys(shortcuts).sort((a, b) => {
      const labelA = (labels[a] || "").toLowerCase();
      const labelB = (labels[b] || "").toLowerCase();

      if (labelA && labelB) return labelA.localeCompare(labelB);
      if (labelA && !labelB) return -1;
      if (!labelA && labelB) return 1;
      return a.localeCompare(b);
    });
  },

  /**
   * Validate shortcut key
   * @param {string} shortcut - Shortcut to validate
   * @returns {Object} - { valid: boolean, message: string }
   */
  validateShortcut(shortcut) {
    if (!shortcut || shortcut.trim() === "") {
      return { valid: false, message: "Shortcut cannot be empty" };
    }
    if (shortcut.length > 50) {
      return { valid: false, message: "Shortcut too long (max 50 characters)" };
    }
    if (shortcut.startsWith("__")) {
      return {
        valid: false,
        message: "Shortcut cannot start with __ (reserved prefix)",
      };
    }
    return { valid: true, message: "" };
  },

  /**
   * Calculate text statistics
   * @param {string} text - Text to analyze
   * @returns {Object} - { beatCount, caesura }
   */
  calculateStats(text) {
    return {
      beatCount: text.length,
      caesura: text.split("\n").length,
    };
  },
};

// Timing configuration constants
const TIMING_CONFIG = {
  REPLACEMENT_DEBOUNCE: 100, // Increased from 50ms for better VM compatibility
  NOTIFICATION_DURATION: 3000,
  BUTTON_FEEDBACK_DURATION: 1500,
  FOCUS_HIGHLIGHT_DURATION: 2000,
};
