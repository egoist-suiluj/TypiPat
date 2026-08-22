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

  // Kunin ang sections mula sa original data
  const sections = {};
  for (let key in data) {
    if (key.startsWith("__section__")) {
      const shortcutKey = key.replace("__section__", "");
      sections[shortcutKey] = data[key];
    }
  }

  container.textContent = "";

  if (Object.keys(shortcuts).length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Silence. No notes composed yet.";
    container.appendChild(emptyState);
    return;
  }

  // ==========================================
  // SORTING: Pinned first, then by section, then no section
  // ==========================================

  // 1. Paghiwalayin ang pinned at unpinned
  const pinned = [];
  const unpinned = [];

  for (let key in shortcuts) {
    if (pinnedOrder.includes(key)) {
      pinned.push(key);
    } else {
      unpinned.push(key);
    }
  }

  // 2. I-sort ang pinned base sa pinnedOrder
  pinned.sort((a, b) => pinnedOrder.indexOf(a) - pinnedOrder.indexOf(b));

  // 3. I-sort ang unpinned: may section muna, then walang section
  const withSection = [];
  const withoutSection = [];

  for (let key of unpinned) {
    const section = sections[key] || "";
    if (section.trim() !== "") {
      withSection.push(key);
    } else {
      withoutSection.push(key);
    }
  }

  // 4. I-sort ang may section: by section name, then by label
  withSection.sort((a, b) => {
    const sectionA = (sections[a] || "").toLowerCase();
    const sectionB = (sections[b] || "").toLowerCase();

    if (sectionA !== sectionB) {
      return sectionA.localeCompare(sectionB);
    }

    const labelA = (labels[a] || "").toLowerCase();
    const labelB = (labels[b] || "").toLowerCase();

    const isUntitledA = labelA === "" || labelA === "untitled";
    const isUntitledB = labelB === "" || labelB === "untitled";

    if (isUntitledA && isUntitledB) return a.localeCompare(b);
    if (isUntitledA) return 1;  // Untitled sa dulo ng section group
    if (isUntitledB) return -1;

    return labelA.localeCompare(labelB);
  });

  // 5. I-sort ang walang section: by label, "Untitled" sa pinakadulo
  withoutSection.sort((a, b) => {
    const labelA = (labels[a] || "").toLowerCase();
    const labelB = (labels[b] || "").toLowerCase();

    const isUntitledA = labelA === "" || labelA === "untitled";
    const isUntitledB = labelB === "" || labelB === "untitled";

    if (isUntitledA && isUntitledB) return a.localeCompare(b);
    if (isUntitledA) return 1;  // Untitled sa pinakadulo
    if (isUntitledB) return -1;

    return labelA.localeCompare(labelB);
  });

  // 6. Pagsamahin: pinned + withSection + withoutSection
  const sortedShortcuts = [...pinned, ...withSection, ...withoutSection];

  // ==========================================
  // RENDER
  // ==========================================

  sortedShortcuts.forEach((shortcut) => {
    const label = labels[shortcut] || "Untitled";
    const section = sections[shortcut] || "";
    const isPinned = pinnedOrder.includes(shortcut);
    const slot = isPinned ? pinnedOrder.indexOf(shortcut) : null;
    const chroma = slot !== null ? getChromaticDataForSlot(slot) : null;

    const noteItem = document.createElement("div");
    noteItem.className = "note-item";
    noteItem.setAttribute("data-shortcut", shortcut.toLowerCase());
    noteItem.setAttribute("data-label", label.toLowerCase());
    noteItem.setAttribute("data-section", section.toLowerCase());
    noteItem.setAttribute("data-text", shortcuts[shortcut]);
    if (isPinned) noteItem.classList.add("pinned");

    const noteHeader = document.createElement("div");
    noteHeader.className = "note-header";

    const noteContent = document.createElement("div");
    noteContent.className = "note-content";

    // 🔥 LABEL (Annotation) - same position
    const noteRhythm = document.createElement("div");
    noteRhythm.className = "note-rhythm";
    noteRhythm.textContent = label;
    noteContent.appendChild(noteRhythm);

    // 🔥 KEY - may kulay depende sa pin status
    const noteLabel = document.createElement("div");
    noteLabel.className = "note-label";
    noteLabel.textContent = shortcut;
    if (isPinned) {
      noteLabel.style.color = '#E65100';
      noteLabel.style.fontWeight = 'bold';
    } else {
      noteLabel.style.color = '#555555';
      noteLabel.style.fontWeight = 'bold';
    }
    noteContent.appendChild(noteLabel);

    noteHeader.appendChild(noteContent);

    // Perform button (same position)
    const performBtn = document.createElement("button");
    performBtn.className = "perform-btn";
    performBtn.textContent = "Perform";
    noteHeader.appendChild(performBtn);

    noteItem.appendChild(noteHeader);

    // 🔥 SECTION BADGE - Soft Lavender Tint (Theme Match)
    if (section.trim() !== "") {
      const badgeContainer = document.createElement("div");
      badgeContainer.style.cssText = `
    position: absolute;
    bottom: 6px;
    right: 16px;
    display: flex;
    justify-content: flex-end;
  `;

      const badge = document.createElement("div");
      badge.style.cssText = `
    padding: 3px 12px;
    border-radius: 20px;
    background: #F0EBFC; /* ← Soft Lavender Tint */
    color: #6B5B95;
    font-size: 9px;
    font-weight: 600;
    font-family: "Georgia", serif;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    opacity: 0.9;
    letter-spacing: 0.5px;
    box-shadow: 0 1px 3px rgba(107, 91, 149, 0.08); /* ← Subtle purple shadow */
    border: 1px solid rgba(126, 105, 171, 0.2);     /* ← Matching border */
    transition: all 0.2s ease;
  `;

      // 📁 Folder icon
      const iconSpan = document.createElement("span");
      iconSpan.textContent = "📁";
      iconSpan.style.cssText = `
    font-size: 10px;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.05));
  `;
      badge.appendChild(iconSpan);

      // Section name
      const textSpan = document.createElement("span");
      textSpan.textContent = section;
      textSpan.style.cssText = `
    font-size: 9px;
    font-weight: 600;
    color: #6B5B95; /* ← Muted Purple para malinis basahin */
    letter-spacing: 0.3px;
  `;
      badge.appendChild(textSpan);

      badgeContainer.appendChild(badge);
      noteItem.appendChild(badgeContainer);
    }

    // 🔥 BADGE (sa ilalim ng key - maliit)
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

    // 🔥 CHECK EXTENSION CONTEXT MUNA (IDAGDAG ITO)
    if (!chrome.runtime?.id) {
      TypiUtils.showNotification('Extension is refreshing. Please reopen popup.', 'error', '⚠️');
      return;
    }

    try {
      if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
        await SoundPlayer.resume();
        SoundPlayer.playOrchestraEntrataSound();
      }
    } catch (err) {
    }

    function openOptionsDirect() {
      return new Promise((resolve) => {
        try {
          // 🔥 DOUBLE CHECK BAGO TUMAWAG NG API (IDAGDAG ITO)
          if (!chrome.runtime?.id) {
            resolve(false);
            return;
          }
          chrome.runtime.openOptionsPage(() => {
            if (chrome.runtime.lastError) {
              resolve(false);
            } else {
              resolve(true);
            }
          });
        } catch (err) {
          resolve(false);
        }
      });
    }

    function openOptionsFallback() {
      try {
        // 🔥 CHECK CONTEXT BAGO GUMAWA NG TAB (IDAGDAG ITO)
        if (!chrome.runtime?.id) {
          showReloadMessage();
          return;
        }

        const optionsUrl = chrome.runtime.getURL('options.html');
        chrome.tabs.create({ url: optionsUrl, active: true }, (tab) => {
          if (chrome.runtime.lastError) {
            showReloadMessage();
          } else {
          }
        });
      } catch (err) {
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
      TypiUtils.showNotification('Refreshing extension connection...', 'info', '🔄');
      setTimeout(() => window.location.reload(), 1000);
      return false;
    }
    return true;
  } catch (err) {
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
    !key.startsWith('__meta__')
  );
  if (hasChanges) {
    loadNotes();
    if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
      SoundPlayer.playSearchSound();
    }
  }
});

// ==========================================
// BANNER SCROLL BEHAVIOR
// ==========================================

const notesList = document.getElementById('notesList');
const bannerSection = document.getElementById('bannerSection');
const scrollIndicator = document.getElementById('scrollIndicator');

if (notesList && bannerSection) {
  notesList.addEventListener('scroll', function() {
    const scrollY = this.scrollTop;
    
    // Kapag nag-scroll pababa > 30px, i-hide ang banner
    if (scrollY > 30) {
      bannerSection.classList.add('hidden');
      if (scrollIndicator) scrollIndicator.classList.add('hidden');
    } else {
      // Kapag nasa itaas, i-show ang banner
      bannerSection.classList.remove('hidden');
      if (scrollIndicator) scrollIndicator.classList.remove('hidden');
    }
  });
}