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
     * Note: In Manifest V3, this API may not be available.
     * We rely on storage.local which works in incognito by default.
     */
    checkIncognito() {
        // Try the old API first for backward compatibility
        if (chrome.extension && typeof chrome.extension.isAllowedIncognitoAccess === 'function') {
            chrome.extension.isAllowedIncognitoAccess((isAllowed) => {
                if (!isAllowed) {
                    console.log('[TypiPat] Incognito access not allowed. Some features may be limited in private windows.');
                } else {
                    console.log('[TypiPat] Incognito access allowed.');
                }
            });
        } else {
            // Manifest V3: storage.local works in incognito by default
            console.log('[TypiPat] Running in Manifest V3 mode. Storage will work in incognito.');
        }
    },

    /**
     * Load data from both storages and merge
     * @returns {Promise<Object>} Unified data object
     */
    loadAll() {
        return new Promise((resolve) => {
            // 1. Try Local First (Fastest / Offline)
            chrome.storage.local.get(null, (localData) => {
                // 2. Try Sync (if available)
                if (this.SYNC_ENABLED && chrome.storage.sync) {
                    try {
                        chrome.storage.sync.get(null, (syncData) => {
                            if (chrome.runtime.lastError) {
                                console.warn('[TypiPat] Sync storage unavailable (offline?), using local.', chrome.runtime.lastError);
                                resolve(localData || {});
                                return;
                            }

                            // 3. Merge Data
                            const merged = this.mergeData(localData, syncData);

                            // 4. Auto-sync (if local has newer data than sync)
                            this.syncBack(merged, syncData, localData);

                            resolve(merged);
                        });
                    } catch (e) {
                        console.warn('[TypiPat] Sync access failed, using local.', e);
                        resolve(localData || {});
                    }
                } else {
                    resolve(localData || {});
                }
            });
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

            // Data
            updates[key] = value;
            if (label !== null) {
                updates[`__label__${key}`] = label;
            }

            // Metadata (Timestamp for conflict resolution)
            updates[`__meta__${key}`] = timestamp;

            // 1. Save to Local (Guaranteed)
            chrome.storage.local.set(updates, () => {
                // 2. Save to Sync (Best Effort)
                if (this.SYNC_ENABLED && chrome.storage.sync) {
                    try {
                        chrome.storage.sync.set(updates, () => {
                            if (chrome.runtime.lastError) {
                                console.warn('[TypiPat] Failed to sync save (offline?). Saved locally.');
                            }
                            resolve();
                        });
                    } catch (e) {
                        console.warn('[TypiPat] Sync save failed.', e);
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
                // Skip if key is metadata (shouldn't happen in export, but safety check)
                if (key.startsWith('__meta__')) continue;

                // Handle label keys separately if they exist in import (legacy or new format)
                if (key.startsWith('__label__')) {
                    updates[key] = data[key];
                    continue;
                }

                // Regular shortcut
                updates[key] = data[key];
                updates[`__meta__${key}`] = timestamp;
            }

            // 1. Save to Local
            chrome.storage.local.set(updates, () => {
                // 2. Save to Sync
                if (this.SYNC_ENABLED && chrome.storage.sync) {
                    try {
                        chrome.storage.sync.set(updates, () => resolve());
                    } catch (e) {
                        console.warn('[TypiPat] Sync import failed.', e);
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
            // We re-load everything to ensure consistency, 
            // rather than trying to patch the state incrementally 
            // which is error-prone with multi-layer storage.
            this.loadAll().then(data => callback(data));
        });
    },

    /**
     * Merge Local and Sync data based on timestamps
     */
    mergeData(local, sync) {
        const merged = { ...local, ...sync }; // Base merge
        const allKeys = new Set([...Object.keys(local || {}), ...Object.keys(sync || {})]);

        // Iterate keys to resolve conflicts via timestamps
        allKeys.forEach(key => {
            // Skip internal keys if iterating raw
            if (key.startsWith('__meta__')) return;

            const metaKey = `__meta__${key}`;
            const localTime = local?.[metaKey] || 0;
            const syncTime = sync?.[metaKey] || 0;

            if (localTime > syncTime) {
                // Local is newer
                merged[key] = local[key];
                if (local[`__label__${key}`]) merged[`__label__${key}`] = local[`__label__${key}`];
                merged[metaKey] = localTime;
            } else if (syncTime > localTime) {
                // Sync is newer
                merged[key] = sync[key];
                if (sync[`__label__${key}`]) merged[`__label__${key}`] = sync[`__label__${key}`];
                merged[metaKey] = syncTime;
            }
        });

        return merged;
    },

    /**
     * Sync back to storage if one is outdated
     */
    syncBack(merged, sync, local) {
        // If we found that local had newer data than sync, push to sync
        // If sync had newer data than local, push to local
        // This ensures consistency across devices/modes

        // Simple check: if merged state differs from source, update source
        // Note: This is a heavy operation, so we do it carefully or just rely on 'save' logic.
        // For now, we'll just ensure Local is always up to date with Sync (for offline fallback).

        if (chrome.storage.local) {
            chrome.storage.local.set(merged);
        }
    }
};

TypiStorage.init();
