// Load and display all shortcuts
async function loadNotes() {
  const data = await TypiStorage.loadAll();
  const container = document.getElementById("notesList");

  if (!container) return;

  const pinnedOrder = await getPinnedOrder();

  // 🔥 FILTER: I-block ang __pinned_order__, __meta__, at reserved settings
  const RESERVED_SETTING_KEYS = ["soundEnabled", "enabled"];
  const filteredData = {};
  for (let key in data) {
    if (key === "__pinned_order__" || key.startsWith("__meta__") || RESERVED_SETTING_KEYS.includes(key)) {
      continue;
    }
    filteredData[key] = data[key];
  }

  const { shortcuts, labels } = TypiUtils.parseStorageData(filteredData);

  container.textContent = "";

  if (Object.keys(shortcuts).length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Silence. No notes composed yet.";
    container.appendChild(emptyState);
    return;
  }

  // 🔥 SORT: Pinned first, then unpinned (na may "Untitled" sa dulo)
  const unpinned = [];
  const pinnedMap = {};
  for (let key in shortcuts) {
    const idx = pinnedOrder.indexOf(key);
    if (idx !== -1) {
      pinnedMap[key] = idx;
    } else {
      unpinned.push(key);
    }
  }
  const pinnedKeys = Object.keys(pinnedMap).sort((a, b) => pinnedMap[a] - pinnedMap[b]);

  // 🔥 FIX: "Untitled" goes to the end (tulad ng sa options)
  unpinned.sort((a, b) => {
    const labelA = (labels[a] || "").toLowerCase();
    const labelB = (labels[b] || "").toLowerCase();

    const isUntitledA = labelA === "" || labelA === "untitled";
    const isUntitledB = labelB === "" || labelB === "untitled";

    if (isUntitledA && isUntitledB) return a.localeCompare(b);
    if (isUntitledA) return 1;  // Untitled goes to the end
    if (isUntitledB) return -1; // Untitled goes to the end

    return labelA.localeCompare(labelB);
  });

  const sortedShortcuts = [...pinnedKeys, ...unpinned];

  sortedShortcuts.forEach((shortcut) => {
    const label = labels[shortcut] || "Untitled";
    const isPinned = pinnedOrder.includes(shortcut);
    const slot = isPinned ? pinnedOrder.indexOf(shortcut) : null;
    const chroma = slot !== null ? getChromaticDataForSlot(slot) : null;

    const noteItem = document.createElement("div");
    noteItem.className = "note-item";
    noteItem.setAttribute("data-shortcut", shortcut.toLowerCase());
    noteItem.setAttribute("data-label", label.toLowerCase());
    noteItem.setAttribute("data-text", shortcuts[shortcut]);
    if (isPinned) noteItem.classList.add("pinned");

    const noteHeader = document.createElement("div");
    noteHeader.className = "note-header";

    const noteContent = document.createElement("div");
    noteContent.className = "note-content";

    const noteRhythm = document.createElement("div");
    noteRhythm.className = "note-rhythm";
    noteRhythm.textContent = label;
    noteContent.appendChild(noteRhythm);

    const noteLabel = document.createElement("div");
    noteLabel.className = "note-label";
    noteLabel.textContent = shortcut;
    if (isPinned) {
      noteLabel.style.color = '#E65100';
      noteLabel.style.fontWeight = 'bold';
    } else {
      noteLabel.style.color = '#6a1b9a';
    }
    noteContent.appendChild(noteLabel);

    noteHeader.appendChild(noteContent);

    const performBtn = document.createElement("button");
    performBtn.className = "perform-btn";
    performBtn.textContent = "Perform";
    noteHeader.appendChild(performBtn);

    noteItem.appendChild(noteHeader);

    // 🔥 BADGE (sa ILALIM ng key)
    if (isPinned && chroma) {
      const badgeContainer = document.createElement("div");
      badgeContainer.style.cssText = "display: flex; justify-content: flex-start; margin-top: 2px; padding-left: 4px;";

      const badge = document.createElement("div");
      badge.style.cssText = `
        padding: 1px 8px;
        border-radius: 16px;
        background: ${chroma.bg};
        color: white;
        font-size: 9px;
        font-weight: bold;
        border: 1.5px solid rgba(0,0,0,0.25);
        font-family: "Georgia", serif;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        flex-shrink: 0;
        opacity: 0.85;
      `;
      const iconSpan = document.createElement("span");
      iconSpan.textContent = chroma.icon;
      iconSpan.style.fontSize = "10px";
      badge.appendChild(iconSpan);
      const noteSpan = document.createElement("span");
      noteSpan.textContent = chroma.note;
      noteSpan.style.fontSize = "8px";
      badge.appendChild(noteSpan);

      badgeContainer.appendChild(badge);
      noteItem.appendChild(badgeContainer);
    }

    container.appendChild(noteItem);
  });

  addPerformListeners();
}

// Add event listeners for perform buttons AND rows
function addPerformListeners() {
  document.querySelectorAll(".note-item").forEach((item) => {
    const btn = item.querySelector(".perform-btn");
    const text = item.getAttribute("data-text");

    item.addEventListener("click", (e) => {
      performAction(text, btn);
    });
  });
}

function performAction(text, btnElement) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showFeedback(btnElement);
    })
    .catch((err) => {
      copyViaBackground(text, btnElement);
    });
}

function copyViaBackground(text, btnElement) {
  try {
    if (!chrome.runtime?.id) {
      fallbackCopyText(text, btnElement);
      return;
    }
    chrome.runtime.sendMessage(
      { action: "restoreClipboard", data: text },
      (response) => {
        if (chrome.runtime.lastError) {
          fallbackCopyText(text, btnElement);
        } else {
          showFeedback(btnElement);
        }
      },
    );
  } catch (err) {
    fallbackCopyText(text, btnElement);
  }
}

function fallbackCopyText(text, btnElement) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    document.execCommand("copy");
    document.body.removeChild(textArea);

    showFeedback(btnElement);
  } catch (err) {
    TypiUtils.showNotification(
      "Copy failed. Blocked by browser.",
      "error",
      "⚠️",
    );
  }
}

function showFeedback(btnElement) {
  if (btnElement) {
    const originalText = btnElement.textContent;
    btnElement.textContent = "Scored!";
    btnElement.classList.add("copied");

    setTimeout(() => {
      btnElement.textContent = originalText;
      btnElement.classList.remove("copied");
    }, TIMING_CONFIG.BUTTON_FEEDBACK_DURATION);
  }

  TypiUtils.showNotification("Note copied to clipboard!", "success", "🎵");
}

// ==========================================
// OPEN OPTIONS PAGE
// ==========================================
const openOptionsBtn = document.getElementById("openOptions");
if (openOptionsBtn) {
  openOptionsBtn.addEventListener("click", async () => {
    console.log('🎵 Orchestra Entrata clicked');
    
    try {
      if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
        await SoundPlayer.resume();
        SoundPlayer.playOrchestraEntrataSound();
      }
    } catch (err) {
      console.warn('Sound play failed:', err);
    }
    
    function openOptionsDirect() {
      return new Promise((resolve) => {
        try {
          if (!chrome.runtime?.id) {
            resolve(false);
            return;
          }
          chrome.runtime.openOptionsPage(() => {
            if (chrome.runtime.lastError) {
              console.warn('openOptionsPage error:', chrome.runtime.lastError.message);
              resolve(false);
            } else {
              console.log('✅ Options page opened directly');
              resolve(true);
            }
          });
        } catch (err) {
          console.warn('openOptionsPage exception:', err);
          resolve(false);
        }
      });
    }
    
    function openOptionsFallback() {
      try {
        const optionsUrl = chrome.runtime.getURL('options.html');
        chrome.tabs.create({ url: optionsUrl, active: true }, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('Fallback failed:', chrome.runtime.lastError);
            showReloadMessage();
          } else {
            console.log('✅ Options opened via fallback tab');
          }
        });
      } catch (err) {
        console.error('Fallback exception:', err);
        showReloadMessage();
      }
    }
    
    function showReloadMessage() {
      TypiUtils.showNotification(
        'Extension needs refresh. Please reload the page.',
        'error',
        '⚠️'
      );
    }
    
    const success = await openOptionsDirect();
    if (!success) {
      openOptionsFallback();
    }
  });
}

// ==========================================
// CHECK EXTENSION CONTEXT
// ==========================================
function checkExtensionContext() {
  try {
    if (!chrome.runtime?.id) {
      console.warn('Extension context invalid, reloading...');
      TypiUtils.showNotification('Refreshing extension connection...', 'info', '🔄');
      setTimeout(() => window.location.reload(), 1000);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Context check failed:', err);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkExtensionContext();
});

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearSearch");

function performSearch() {
  if (!searchBox) return;

  const searchTerm = searchBox.value.toLowerCase().trim();
  const notes = document.querySelectorAll(".note-item");

  if (!searchTerm) {
    TypiUtils.showNotification(
      "Please enter a search term to cue.",
      "error",
      "🎭",
    );
    return;
  }

  if (clearBtn) {
    clearBtn.classList.add("visible");
  }

  let foundMatch = false;
  let matchCount = 0;

  notes.forEach((note) => {
    const shortcut = note.getAttribute("data-shortcut");
    const label = note.getAttribute("data-label");

    if (shortcut.includes(searchTerm) || label.includes(searchTerm)) {
      note.classList.remove("hidden");
      matchCount++;

      if (!foundMatch) {
        note.classList.add("highlight");
        note.scrollIntoView({ behavior: "smooth", block: "nearest" });
        foundMatch = true;

        setTimeout(() => {
          note.classList.remove("highlight");
        }, TIMING_CONFIG.BUTTON_FEEDBACK_DURATION);
      }
    } else {
      note.classList.add("hidden");
      note.classList.remove("highlight");
    }
  });

  if (matchCount === 0) {
    TypiUtils.showNotification(
      "No matching notes found. Try a different rhythm.",
      "error",
      "🎭",
    );
  } else if (matchCount === 1) {
    TypiUtils.showNotification("Found 1 matching note!", "success", "🎵");
  } else {
    TypiUtils.showNotification(
      `Found ${matchCount} matching notes!`,
      "success",
      "🎵",
    );
  }
}

if (searchBtn) {
  searchBtn.addEventListener("click", performSearch);
}

if (searchBox) {
  searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (searchBox) {
      searchBox.value = "";
    }
    clearBtn.classList.remove("visible");

    const notes = document.querySelectorAll(".note-item");
    notes.forEach((note) => {
      note.classList.remove("hidden");
      note.classList.remove("highlight");
    });
  });
}

// ==========================================
// LOAD NOTES & SOUNDS
// ==========================================

loadNotes();

document.addEventListener('click', async function resumeAudio() {
  if (typeof SoundPlayer !== 'undefined') {
    await SoundPlayer.resumeFromGesture();
    if (SoundPlayer.enabled && SoundPlayer.isReady()) {
      SoundPlayer.playPopupOpenSound();
    }
    document.removeEventListener('click', resumeAudio);
  }
}, { once: true, capture: true });

window.addEventListener('beforeunload', () => {
  if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
    SoundPlayer.playPopupCloseSound();
  }
});

// Auto-refresh popup when shortcuts change
chrome.storage.onChanged.addListener((changes) => {
  const hasChanges = Object.keys(changes).some(key =>
    !key.startsWith('__meta__') &&
    !key.startsWith('__label__') &&
    !key.startsWith('__section__') &&
    key !== '__pinned_order__'
  );
  if (hasChanges) {
    loadNotes();
    if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
      SoundPlayer.playSearchSound();
    }
  }
});