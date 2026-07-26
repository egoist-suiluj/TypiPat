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
  sortShortcutsByLabel(shortcuts, labels, sections) {
    return Object.keys(shortcuts).sort((a, b) => {
      const sectionA = (sections && sections[a]) || "";
      const sectionB = (sections && sections[b]) || "";
      const labelA = (labels && labels[a]) || "";
      const labelB = (labels && labels[b]) || "";

      // 1. UNA: Section (a-z)
      if (sectionA && sectionB) {
        const sectionCompare = sectionA.localeCompare(sectionB);
        if (sectionCompare !== 0) return sectionCompare;
      }
      if (sectionA && !sectionB) return -1;
      if (!sectionA && sectionB) return 1;

      // 2. PANGALAWA: Annotation (a-z)
      if (labelA && labelB) {
        const labelCompare = labelA.localeCompare(labelB);
        if (labelCompare !== 0) return labelCompare;
      }
      if (labelA && !labelB) return -1;
      if (!labelA && labelB) return 1;

      // 3. PANGATLO: ID (a-z)
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
        message: "A Key plays without pause. Connect your melody using '-' or '_'.",
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
    // 🔥 SIGURADUHIN NA STRING ANG TEXT
    const safeText = text || "";  // Kung undefined/null, gawing empty string

    return {
      beatCount: safeText.length,
      caesura: safeText.split("\n").length,
    };
  }
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

// ==========================================
// SOUND UTILITY - Complete Interactions
// ==========================================

const SoundPlayer = {
  enabled: true,
  audioContext: null,
  isPlaying: false,

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  playInstrumentNote(freq, duration = 0.2, volume = 0.1, instrument = 'piano') {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      const settings = {
        piano: { type: 'sine', attack: 0.005, decay: 0.05, sustain: 0.6, release: 0.15 },
        strings: { type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 },
        flute: { type: 'sine', attack: 0.01, decay: 0.05, sustain: 0.7, release: 0.2 },
        guitar: { type: 'triangle', attack: 0.001, decay: 0.03, sustain: 0.4, release: 0.1 },
        bell: { type: 'sine', attack: 0.001, decay: 0.2, sustain: 0.9, release: 0.4 },
        warning: { type: 'square', attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.1 },
        rise: { type: 'sine', attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 },
        fall: { type: 'sine', attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
      };
      
      const inst = settings[instrument] || settings.piano;
      
      osc.type = inst.type;
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + inst.attack);
      gain.gain.exponentialRampToValueAtTime(volume * inst.sustain, now + inst.decay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration + inst.release);
      
      if (instrument === 'piano' || instrument === 'strings' || instrument === 'rise') {
        const harmonic = this.audioContext.createOscillator();
        const hGain = this.audioContext.createGain();
        harmonic.type = 'sine';
        harmonic.frequency.value = freq * 2;
        hGain.gain.value = volume * 0.15;
        harmonic.connect(hGain);
        hGain.connect(this.audioContext.destination);
        harmonic.start(now);
        harmonic.stop(now + duration + inst.release);
      }
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(now);
      osc.stop(now + duration + inst.release);
    } catch (err) { /* Silent fail */ }
  },

  playChord(notes, instrument = 'piano', duration = 0.3, volume = 0.08) {
    if (!this.enabled) return;
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playInstrumentNote(freq, duration, volume * (1 - i * 0.1), instrument);
      }, i * 50);
    });
  },

  playSequence(notes, instruments, delay = 80) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    let index = 0;
    const playNext = () => {
      if (index >= notes.length) {
        this.isPlaying = false;
        return;
      }
      const inst = instruments[index % instruments.length];
      this.playInstrumentNote(notes[index], 0.15, 0.08, inst);
      index++;
      setTimeout(playNext, delay);
    };
    playNext();
  },

  // ==========================================
  // 🎵 EXPANSION SOUNDS
  // ==========================================

  playOrchestralExpansion() {
    const melody = [523.25, 659.25, 783.99, 1046.50];
    const instruments = ['piano', 'piano', 'strings', 'flute'];
    this.playSequence(melody, instruments, 80);
    setTimeout(() => {
      this.playChord([523.25, 659.25, 783.99], 'strings', 0.5, 0.05);
    }, 100);
  },

  playGuitarPianoExpansion() {
    this.playSequence([392.00, 493.88, 587.33, 783.99], ['guitar', 'piano', 'guitar', 'piano'], 90);
  },

  playFluteBellExpansion() {
    this.playSequence([587.33, 783.99, 1046.50, 1318.51], ['flute', 'bell', 'flute', 'bell'], 70);
  },

  playStringQuartetExpansion() {
    this.playSequence([261.63, 329.63, 392.00, 523.25], ['strings', 'strings', 'strings', 'strings'], 100);
  },

  playRandomExpansion() {
    const expansions = [
      this.playOrchestralExpansion.bind(this),
      this.playGuitarPianoExpansion.bind(this),
      this.playFluteBellExpansion.bind(this),
      this.playStringQuartetExpansion.bind(this),
    ];
    expansions[Math.floor(Math.random() * expansions.length)]();
  },

  // ==========================================
  // 🎵 INTERACTION SOUNDS
  // ==========================================

  playAddSound() {
    this.playSequence([523.25, 659.25, 783.99, 1046.50], ['piano', 'bell', 'piano', 'bell'], 80);
  },

  playEditSound() {
    this.playChord([523.25, 659.25, 783.99], 'strings', 0.3, 0.07);
  },

  playDeleteSound() {
    this.playSequence([783.99, 659.25, 523.25, 392.00], ['flute', 'strings', 'flute', 'strings'], 120);
  },

  playSearchSound() {
    this.playInstrumentNote(880.00, 0.2, 0.1, 'bell');
  },

  playClearSound() {
    this.playInstrumentNote(440.00, 0.3, 0.06, 'flute');
  },

  playArrangeSound() {
    this.playInstrumentNote(587.33, 0.15, 0.08, 'guitar');
  },

  playVarianceSound() {
    this.playSequence([392.00, 440.00, 493.88, 523.25], ['guitar', 'piano', 'guitar', 'piano'], 60);
  },

  playPerformSound() {
    this.playSequence([1046.50, 1318.51], ['bell', 'bell'], 50);
  },

  playCadenceSound() {
    this.playChord([523.25, 659.25, 783.99, 1046.50], 'piano', 0.4, 0.09);
  },

  playEntrataSound() {
    this.playSequence([392.00, 493.88, 587.33, 783.99], ['guitar', 'piano', 'flute', 'bell'], 90);
  },

  playHoverSound() {
    this.playInstrumentNote(659.25, 0.06, 0.04, 'bell');
  },

  // ==========================================
  // 🎵 ERROR SOUND
  // ==========================================

  playErrorSound() {
    this.playInstrumentNote(440.00, 0.15, 0.08, 'warning');
  },

  // ==========================================
  // 🎵 POPUP OPEN/CLOSE
  // ==========================================

  playPopupOpenSound() {
    this.playSequence([523.25, 659.25, 783.99], ['piano', 'strings', 'bell'], 60);
  },

  playPopupCloseSound() {
    this.playSequence([783.99, 659.25, 523.25], ['bell', 'strings', 'piano'], 60);
  },

  // ==========================================
  // 🎵 ORCHESTRA ENTRATA
  // ==========================================

  playOrchestraEntrataSound() {
    this.playChord([523.25, 659.25, 783.99, 1046.50], 'piano', 0.5, 0.1);
    setTimeout(() => {
      this.playSequence([523.25, 659.25, 783.99, 1046.50], ['piano', 'strings', 'flute', 'bell'], 70);
    }, 200);
  },

  // ==========================================
  // 🎵 TOGGLE
  // ==========================================

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },

  setEnabled(state) {
    this.enabled = state;
  }
};