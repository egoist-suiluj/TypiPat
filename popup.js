// Load and display all shortcuts
async function loadNotes() {
  const data = await TypiStorage.loadAll();
  const container = document.getElementById("notesList");

  if (!container) return;

  // 🔥 I-FILTER ANG __section__ KEYS AT SETTINGS (hindi shortcuts)
  const RESERVED_SETTING_KEYS = ["soundEnabled"];
  const filteredData = {};
  for (let key in data) {
    if (!key.startsWith("__section__") && !RESERVED_SETTING_KEYS.includes(key)) {
      filteredData[key] = data[key];
    }
  }

  // Use shared utility to parse storage data
  const { shortcuts, labels } = TypiUtils.parseStorageData(filteredData);

  // Clear container safely
  container.textContent = "";

  // Check if there are shortcuts
  if (Object.keys(shortcuts).length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Silence. No notes composed yet.";
    container.appendChild(emptyState);
    return;
  }

  // Use shared utility to sort shortcuts
  const sortedShortcuts = TypiUtils.sortShortcutsByLabel(shortcuts, labels);

  // Build notes using createElement (XSS-safe)
  sortedShortcuts.forEach((shortcut) => {
    const label = labels[shortcut] || "Untitled";

    const noteItem = document.createElement("div");
    noteItem.className = "note-item";
    noteItem.setAttribute("data-shortcut", shortcut.toLowerCase());
    noteItem.setAttribute("data-label", label.toLowerCase());
    noteItem.setAttribute("data-text", shortcuts[shortcut]);

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
    noteContent.appendChild(noteLabel);

    noteHeader.appendChild(noteContent);

    const performBtn = document.createElement("button");
    performBtn.className = "perform-btn";
    performBtn.textContent = "Perform";
    noteHeader.appendChild(performBtn);

    noteItem.appendChild(noteHeader);
    container.appendChild(noteItem);
  });

  addPerformListeners();
}

// Add event listeners for perform buttons AND rows
function addPerformListeners() {
  document.querySelectorAll(".note-item").forEach((item) => {
    const btn = item.querySelector(".perform-btn");
    const text = item.getAttribute("data-text");

    // Row Click Handler
    item.addEventListener("click", (e) => {
      performAction(text, btn);
    });
  });
}

function performAction(text, btnElement) {
  // Try modern API first
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

// Open options page
const openOptionsBtn = document.getElementById("openOptions");
if (openOptionsBtn) {
  openOptionsBtn.addEventListener("click", () => {
    try {
      if (chrome.runtime?.id) {
        chrome.runtime.openOptionsPage();
        // 🎵 Sound: Orchestra Entrata
        if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
          SoundPlayer.playOrchestraEntrataSound();
        }
      }
    } catch (err) { }
  });
}

// Search functionality
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

// Load notes when popup opens
loadNotes();

// 🎵 I-resume ang audio kapag nag-click ang user (ISANG BESES LANG)
document.addEventListener('click', async function resumeAudio() {
  if (typeof SoundPlayer !== 'undefined') {
    // I-resume ang audio context
    await SoundPlayer.resumeFromGesture();
    // Pagkatapos ma-resume, i-play ang popup open sound
    if (SoundPlayer.enabled && SoundPlayer.isReady()) {
      SoundPlayer.playPopupOpenSound();
    }
    // I-remove ang listener para isang beses lang
    document.removeEventListener('click', resumeAudio);
  }
}, { once: true, capture: true });

// 🎵 Sound: Popup Close (hindi kailangan ng user gesture)
window.addEventListener('beforeunload', () => {
  if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
    SoundPlayer.playPopupCloseSound();
  }
});

// 🎵 Auto-refresh popup when shortcuts change
chrome.storage.onChanged.addListener((changes) => {
  const hasChanges = Object.keys(changes).some(key =>
    !key.startsWith('__meta__') &&
    !key.startsWith('__label__') &&
    !key.startsWith('__section__')
  );
  if (hasChanges) {
    loadNotes();
    if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
      SoundPlayer.playSearchSound();
    }
  }
});