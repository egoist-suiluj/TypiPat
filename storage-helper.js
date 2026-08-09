// TypiPat - Multi-layer Storage Helper
// Handles Sync + Local fallback, Incognito support, and Data Merging

const TypiStorage = {
  // Configuration
  SYNC_ENABLED: true,

  /**
   * Initialize storage and check environment
   */
  init() {
    this.checkIncognito();
  },

  /**
   * Check if Incognito access is allowed
   */
  checkIncognito() {
    if (
      chrome.extension &&
      typeof chrome.extension.isAllowedIncognitoAccess === "function"
    ) {
      chrome.extension.isAllowedIncognitoAccess(() => {});
    }
  },

  /**
   * Load data from both storages and merge
   * @returns {Promise<Object>} Unified data object
   */
  loadAll() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(null, (localData) => {
          if (chrome.runtime.lastError) {
            resolve({});
            return;
          }
          if (this.SYNC_ENABLED && chrome.storage.sync) {
            try {
              chrome.storage.sync.get(null, (syncData) => {
                if (chrome.runtime.lastError) {
                  resolve(localData || {});
                  return;
                }
                const merged = this.mergeData(localData, syncData);
                this.syncBack(merged, syncData, localData);
                resolve(merged);
              });
            } catch (e) {
              resolve(localData || {});
            }
          } else {
            resolve(localData || {});
          }
        });
      } catch (err) {
        resolve({});
      }
    });
  },

  /**
   * Save data to both storages
   * @param {string} key - Shortcut key
   * @param {string} value - Replacement text
   * @param {string} label - Optional label
   */
  save(key, value, label = null, section = null) {
    return new Promise((resolve) => {
      const timestamp = Date.now();
      const updates = {};

      updates[key] = value;
      updates[`__label__${key}`] = label;

      if (section !== null && section.trim() !== "") {
        updates[`__section__${key}`] = section.trim();
      } else {
        updates[`__section__${key}`] = null;
      }
      updates[`__meta__${key}`] = timestamp;

      chrome.storage.local.set(updates, () => {
        if (chrome.runtime.lastError) {
          console.error("Local save failed:", chrome.runtime.lastError.message);
          resolve({
            success: false,
            syncFailed: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }
        if (this.SYNC_ENABLED && chrome.storage.sync) {
          try {
            chrome.storage.sync.set(updates, () => {
              if (chrome.runtime.lastError) {
                console.warn(
                  "Sync save failed (naka-save pa rin locally):",
                  chrome.runtime.lastError.message,
                );
                resolve({
                  success: true,
                  syncFailed: true,
                  error: chrome.runtime.lastError.message,
                });
              } else {
                resolve({ success: true, syncFailed: false });
              }
            });
          } catch (e) {
            resolve({ success: true, syncFailed: true, error: e.message });
          }
        } else {
          resolve({ success: true, syncFailed: false });
        }
      });
    });
  },

  /**
   * Import data (batch save)
   * @param {Object} data - Key-value pairs to import
   */
  importData(data) {
    return new Promise((resolve) => {
      const timestamp = Date.now();
      const updates = {};
      const RESERVED_SETTING_KEYS = ["soundEnabled", "enabled"];

      for (let key in data) {
        if (key.startsWith("__meta__")) continue;
        if (key === "__pinned_order__") continue; // 🔥 huwag i-import — iwasan ang conflict sa pins ng end user
        if (RESERVED_SETTING_KEYS.includes(key)) continue; // 🔥 settings key lang, hindi shortcut
        if (key.startsWith("__label__") || key.startsWith("__section__")) {
          updates[key] = data[key];
          continue;
        }
        updates[key] = data[key];
        updates[`__meta__${key}`] = timestamp;
      }

      chrome.storage.local.set(updates, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Local import failed:",
            chrome.runtime.lastError.message,
          );
          resolve({
            success: false,
            syncFailed: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }
        if (this.SYNC_ENABLED && chrome.storage.sync) {
          try {
            chrome.storage.sync.set(updates, () => {
              if (chrome.runtime.lastError) {
                console.warn(
                  "Sync import failed (naka-save pa rin locally):",
                  chrome.runtime.lastError.message,
                );
                resolve({
                  success: true,
                  syncFailed: true,
                  error: chrome.runtime.lastError.message,
                });
              } else {
                resolve({ success: true, syncFailed: false });
              }
            });
          } catch (e) {
            resolve({ success: true, syncFailed: true, error: e.message });
          }
        } else {
          resolve({ success: true, syncFailed: false });
        }
      });
    });
  },

  /**
   * Remove data from both storages
   * @param {string} key - Shortcut key
   */
  remove(key) {
    return new Promise((resolve) => {
      const keysToRemove = [
        key,
        `__label__${key}`,
        `__section__${key}`,
        `__meta__${key}`,
      ];

      chrome.storage.local.remove(keysToRemove, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Local remove failed:",
            chrome.runtime.lastError.message,
          );
          resolve({ success: false, syncFailed: false });
          return;
        }
        if (this.SYNC_ENABLED && chrome.storage.sync) {
          try {
            chrome.storage.sync.remove(keysToRemove, () => {
              if (chrome.runtime.lastError) {
                console.warn(
                  "Sync remove failed:",
                  chrome.runtime.lastError.message,
                );
                resolve({ success: true, syncFailed: true });
              } else {
                resolve({ success: true, syncFailed: false });
              }
            });
          } catch (e) {
            resolve({ success: true, syncFailed: true });
          }
        } else {
          resolve({ success: true, syncFailed: false });
        }
      });
    });
  },

  /**
   * Clear all data
   */
  clear() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        if (this.SYNC_ENABLED && chrome.storage.sync) {
          chrome.storage.sync.clear(() => resolve());
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Listen for changes from EITHER storage
   */
  onChanged(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      this.loadAll().then((data) => callback(data));
    });
  },

  /**
   * Merge Local and Sync data based on timestamps
   */
  mergeData(local, sync) {
    const merged = { ...local, ...sync };
    const allKeys = new Set([
      ...Object.keys(local || {}),
      ...Object.keys(sync || {}),
    ]);

    allKeys.forEach((key) => {
      if (key.startsWith("__meta__")) return;

      const metaKey = `__meta__${key}`;
      const localTime = local?.[metaKey] || 0;
      const syncTime = sync?.[metaKey] || 0;

      if (localTime > syncTime) {
        merged[key] = local[key];
        if (local[`__label__${key}`])
          merged[`__label__${key}`] = local[`__label__${key}`];
        merged[metaKey] = localTime;
      } else if (syncTime > localTime) {
        merged[key] = sync[key];
        if (sync[`__label__${key}`])
          merged[`__label__${key}`] = sync[`__label__${key}`];
        merged[metaKey] = syncTime;
      }
    });

    return merged;
  },

  syncBack(merged, sync, local) {
    // 🔥 I-CHECK MUNA KUNG MAY PAGKAKAIBA
    const localKeys = Object.keys(local || {});
    const mergedKeys = Object.keys(merged || {});

    // Kung pareho ang laman, huwag nang mag-set (para iwasan ang infinite loop)
    if (localKeys.length === mergedKeys.length) {
      let isSame = true;
      for (let key of mergedKeys) {
        if (local[key] !== merged[key]) {
          isSame = false;
          break;
        }
      }
      if (isSame) {
        console.log("📊 No changes needed, skipping sync back");
        return; // ✅ WALANG PAGBABAGO - HUWAG MAG-SET
      }
    }

    // 🔥 MAY PAGKAKAIBA - Saka lang mag-set
    console.log("📊 Syncing back changes...");
    chrome.storage.local.set(merged, () => {
      if (chrome.runtime.lastError) {
        console.warn("Sync back failed:", chrome.runtime.lastError);
      }
    });
  },
};

TypiStorage.init();
