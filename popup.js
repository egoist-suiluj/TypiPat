// Load and display all shortcuts
async function loadNotes() {
  const data = await TypiStorage.loadAll();
  const container = document.getElementById("notesList");

  if (!container) return;

  // 🔥 I-FILTER ANG __section__ KEYS
  const filteredData = {};
  for (let key in data) {
    if (!key.startsWith("__section__")) {
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
      // Suppress console spam, just try fallback
      // console.log('Standard Clipboard API failed, switching to offscreen delegate.');
      copyViaBackground(text, btnElement);
    });
}

function copyViaBackground(text, btnElement) {
  // Delegate to Background -> Offscreen (Immune to Permission Policies)
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
  // Visual feedback
  if (btnElement) {
    const originalText = btnElement.textContent;
    btnElement.textContent = "Scored!";
    btnElement.classList.add("copied");

    setTimeout(() => {
      btnElement.textContent = originalText;
      btnElement.classList.remove("copied");
    }, TIMING_CONFIG.BUTTON_FEEDBACK_DURATION);
  }

  // Also show toast
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

  // Check if search is empty
  if (!searchTerm) {
    TypiUtils.showNotification(
      "Please enter a search term to cue.",
      "error",
      "🎭",
    );
    return;
  }

  // Show/hide clear button
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

      // Highlight first match
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

  // Show result notification
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

// Search button click
if (searchBtn) {
  searchBtn.addEventListener("click", performSearch);
}

// Enter key press
if (searchBox) {
  searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });
}

// Clear search
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

// Load notes when popup opens
loadNotes();
// 🔥 MAG-REGISTER NG STORAGE CHANGE LISTENER
chrome.storage.onChanged.addListener((changes, area) => {
  // I-check kung may pagbabago sa shortcuts
  const hasShortcutChanges = Object.keys(changes).some(key =>
    !key.startsWith("__meta__") &&
    !key.startsWith("__label__") &&
    !key.startsWith("__section__")
  );

  if (hasShortcutChanges) {
    console.log('🔄 Shortcuts changed, reloading notes...');
    loadNotes();
  }
  // Load notes when popup opens
  loadNotes();

  // 🎵 Sound: Popup Open
  if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
    SoundPlayer.playPopupOpenSound();
  }

  // 🎵 Popup close detection (beforeunload)
  window.addEventListener('beforeunload', () => {
    if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
      SoundPlayer.playPopupCloseSound();
    }
  });

  // 🎵 Storage listener for real-time updates
  chrome.storage.onChanged.addListener((changes, area) => {
    const hasShortcutChanges = Object.keys(changes).some(key =>
      !key.startsWith("__meta__") &&
      !key.startsWith("__label__") &&
      !key.startsWith("__section__")
    );
    if (hasShortcutChanges) {
      loadNotes();
      // 🎵 Sound: Refresh
      if (typeof SoundPlayer !== 'undefined' && SoundPlayer.enabled) {
        SoundPlayer.playSearchSound();
      }
    }
  });
});
