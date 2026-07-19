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
    let toast = document.getElementById("notificationToast");
    let iconEl = document.getElementById("notificationIcon");
    let msgEl = document.getElementById("notificationMessage");

    if (!toast || !iconEl || !msgEl) {
      this._createNotificationElements();
      toast = document.getElementById("notificationToast");
      iconEl = document.getElementById("notificationIcon");
      msgEl = document.getElementById("notificationMessage");
    }

    if (!toast || !iconEl || !msgEl) {
      console.warn("[TypiPat] Notification elements not found");
      return;
    }

    iconEl.textContent = icon;
    msgEl.textContent = message;
    toast.className = `notification-toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  },

  /**
   * Create notification elements if they don't exist
   * @private
   */
  _createNotificationElements() {
    const container = document.createElement("div");
    container.id = "notificationToast";
    container.className = "notification-toast";
    
    const icon = document.createElement("span");
    icon.id = "notificationIcon";
    icon.className = "toast-icon";
    
    const message = document.createElement("span");
    message.id = "notificationMessage";
    message.className = "toast-message";
    
    container.appendChild(icon);
    container.appendChild(message);
    document.body.appendChild(container);
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
        continue;
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
    const shortcutKeys = Object.keys(shortcuts);
    const labelCache = {};
    
    shortcutKeys.forEach(key => {
      labelCache[key] = (labels[key] || "").toLowerCase();
    });
    
    return shortcutKeys.sort((a, b) => {
      const labelA = labelCache[a];
      const labelB = labelCache[b];
      
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
    if (/\s/.test(shortcut)) {
      return {
        valid: false,
        message: "Shortcut cannot contain spaces (use - or _ instead)",
      };
    }
    if (/[{}[\]\\|]/.test(shortcut)) {
      return {
        valid: false,
        message: "Shortcut contains invalid characters: {}[]\\|",
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

// ==========================================
// TIMING CONFIGURATION - GLOBAL
// ==========================================
const TIMING_CONFIG = {
  REPLACEMENT_DEBOUNCE: 100,
  NOTIFICATION_DURATION: 3000,
  BUTTON_FEEDBACK_DURATION: 1500,
  FOCUS_HIGHLIGHT_DURATION: 2000,
};