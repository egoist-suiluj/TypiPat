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
  save(key, value, label = null) {
    return new Promise((resolve) => {
      const timestamp = Date.now();
      const updates = {};

      updates[key] = value;
      if (label !== null) {
        updates[`__label__${key}`] = label;
      }
      updates[`__meta__${key}`] = timestamp;

      chrome.storage.local.set(updates, () => {
        if (this.SYNC_ENABLED && chrome.storage.sync) {
          try {
            chrome.storage.sync.set(updates, () => {
              resolve();
            });
          } catch (e) {
            resolve();
          }
        } else {
          resolve();
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

      for (let key in data) {
        if (key.startsWith("__meta__")) continue;
        if (key.startsWith("__label__")) {
          updates[key] = data[key];
          continue;
        }
        updates[key] = data[key];
        updates[`__meta__${key}`] = timestamp;
      }

      chrome.storage.local.set(updates, () => {
        if (this.SYNC_ENABLED && chrome.storage.sync) {
          try {
            chrome.storage.sync.set(updates, () => resolve());
          } catch (e) {
            resolve();
          }
        } else {
          resolve();
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
      const keysToRemove = [key, `__label__${key}`, `__meta__${key}`];

      chrome.storage.local.remove(keysToRemove, () => {
        if (this.SYNC_ENABLED && chrome.storage.sync) {
          try {
            chrome.storage.sync.remove(keysToRemove, () => resolve());
          } catch (e) {
            resolve();
          }
        } else {
          resolve();
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

  /**
   * Sync back to storage if one is outdated
   */
  syncBack(merged, sync, local) {
    if (chrome.storage.local) {
      chrome.storage.local.set(merged);
    }
  },
};

TypiStorage.init();
