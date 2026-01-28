// Initialize
let confirmCallback = null;
let isEditMode = false;
let currentEditingShortcut = null;
let postSaveFocusShortcut = null;

// UI configuration
const UI_CONFIG = {
  focusHighlightClass: "flash-focus",
  focusHighlightDuration: TIMING_CONFIG.FOCUS_HIGHLIGHT_DURATION,
};

// DOM Elements - with null checks
const composerAnnotation = document.getElementById("composerAnnotation");
const composerKey = document.getElementById("composerKey");
const composerKeyField = document.getElementById("composerKeyField");
const composerKeyFieldContainer = document.getElementById(
  "composerKeyFieldContainer",
);
const findReplaceSection = document.getElementById("findReplaceSection");
const composerBeatCount = document.getElementById("composerBeatCount");
const composerCaesura = document.getElementById("composerCaesura");
const composerSave = document.getElementById("composerSave");
const composerFinalize = document.getElementById("composerFinalize");
const composerCancel = document.getElementById("composerCancel");
const composerClose = document.getElementById("composerClose");
const orchestrateBtn = document.getElementById("orchestrateBtn");
const composerModal = document.getElementById("composerModal");
const composerTextarea = document.getElementById("composerTextarea");
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearSearch");
const confirmModal = document.getElementById("confirmModal");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");

// Update counters
function updateCounters(textarea, beatElement, caesuraElement) {
  if (!textarea || !beatElement || !caesuraElement) return;

  const stats = TypiUtils.calculateStats(textarea.value);
  beatElement.textContent = stats.beatCount;
  caesuraElement.textContent = stats.caesura;
}

// Open Composer Modal
function openComposerModal(
  content = "",
  annotation = "",
  key = "",
  forEdit = false,
) {
  if (!composerTextarea || !composerAnnotation || !composerModal) return;

  composerTextarea.value = content;
  composerAnnotation.value = annotation;

  if (composerKey) {
    composerKey.value = key;
  }

  if (forEdit) {
    // EDIT MODE
    if (composerKeyFieldContainer)
      composerKeyFieldContainer.style.display = "none";
    if (findReplaceSection) findReplaceSection.style.display = "flex";
    if (composerSave) composerSave.style.display = "block";
    if (composerFinalize) composerFinalize.style.display = "none";
    if (composerCancel) composerCancel.textContent = "Variance";

    const arrangeAnnotationBox = document.getElementById(
      "arrangeAnnotationBox",
    );
    if (arrangeAnnotationBox) {
      arrangeAnnotationBox.style.display = "block";
      const arrangeInput = document.getElementById("composerAnnotationArrange");
      if (arrangeInput) arrangeInput.value = annotation || "";
    }
  } else {
    // COMPOSE MODE
    if (composerKeyFieldContainer)
      composerKeyFieldContainer.style.display = "flex";
    if (findReplaceSection) findReplaceSection.style.display = "none";
    if (composerSave) composerSave.style.display = "none";
    if (composerFinalize) composerFinalize.style.display = "block";
    if (composerCancel) composerCancel.textContent = "Variance";

    const arrangeAnnotationBox = document.getElementById(
      "arrangeAnnotationBox",
    );
    if (arrangeAnnotationBox) arrangeAnnotationBox.style.display = "none";
  }

  updateCounters(composerTextarea, composerBeatCount, composerCaesura);
  composerModal.classList.add("active");
  composerTextarea.focus();
  isEditMode = forEdit;
  currentEditingShortcut = key;
}

// Close Composer Modal
function closeComposerModal() {
  if (!composerModal) return;

  composerModal.classList.remove("active");
  if (composerTextarea) composerTextarea.value = "";
  if (composerAnnotation) composerAnnotation.value = "";

  const arrangeAnnotationBox = document.getElementById("arrangeAnnotationBox");
  const arrangeInput = document.getElementById("composerAnnotationArrange");
  if (arrangeInput) arrangeInput.value = "";
  if (arrangeAnnotationBox) arrangeAnnotationBox.style.display = "none";
  if (composerKey) composerKey.value = "";

  isEditMode = false;
  currentEditingShortcut = null;
}

// Orchestrate button click
if (orchestrateBtn) {
  orchestrateBtn.addEventListener("click", () => {
    const content = document.getElementById("replacementInput")?.value || "";
    const annotation = document.getElementById("labelInput")?.value || "";
    const key = document.getElementById("shortcutInput")?.value || "";
    openComposerModal(content, annotation, key, false);
  });
}

// Composer textarea update counters
if (composerTextarea && composerBeatCount && composerCaesura) {
  composerTextarea.addEventListener("input", () => {
    updateCounters(composerTextarea, composerBeatCount, composerCaesura);
  });
}

// Find & Replace
const replaceBtn = document.getElementById("replaceBtn");
if (replaceBtn && composerTextarea) {
  replaceBtn.addEventListener("click", () => {
    const findInput = document.getElementById("findInput");
    const replaceInput = document.getElementById("replaceInput");

    if (!findInput || !replaceInput) return;

    const findText = findInput.value;
    const replaceText = replaceInput.value;

    if (findText) {
      composerTextarea.value = composerTextarea.value
        .split(findText)
        .join(replaceText);
      updateCounters(composerTextarea, composerBeatCount, composerCaesura);
      TypiUtils.showNotification(
        "Text transposed successfully!",
        "success",
        "✅",
      );
    }
  });
}

// Composer Finalize (Compose Mode)
if (composerFinalize) {
  composerFinalize.addEventListener("click", () => {
    if (!composerTextarea || !composerAnnotation) return;

    const content = composerTextarea.value;
    const annotation = composerAnnotation.value;
    const key = composerKey ? composerKey.value : "";

    const replacementInput = document.getElementById("replacementInput");
    const labelInput = document.getElementById("labelInput");
    const shortcutInput = document.getElementById("shortcutInput");

    if (replacementInput) replacementInput.value = content;
    if (labelInput) labelInput.value = annotation;
    if (shortcutInput) shortcutInput.value = key;

    closeComposerModal();
    TypiUtils.showNotification(
      "Arrangement finalized. Click Compose to save.",
      "success",
      "🎵",
    );
  });
}

// Composer Save (Edit Mode)
if (composerSave) {
  composerSave.addEventListener("click", () => {
    if (!composerTextarea) return;

    const content = composerTextarea.value;
    let annotationValue = "";

    if (isEditMode) {
      const arrangeEl = document.getElementById("composerAnnotationArrange");
      annotationValue = arrangeEl
        ? arrangeEl.value
        : composerAnnotation
          ? composerAnnotation.value
          : "";
    } else {
      annotationValue = composerAnnotation ? composerAnnotation.value : "";
    }

    // Save directly in Edit Mode (Composer)
    if (currentEditingShortcut) {
      TypiStorage.save(
        currentEditingShortcut,
        content,
        annotationValue || null,
      ).then(() => {
        TypiUtils.showNotification(
          "Theme saved successfully! 🎼",
          "success",
          "✅",
        );
        closeComposerModal();
        loadShortcuts();
      });
    }
  });
}

// Composer Close/Cancel
if (composerClose) composerClose.addEventListener("click", closeComposerModal);
if (composerCancel)
  composerCancel.addEventListener("click", closeComposerModal);

// Confirm Modal Logic
function showConfirmModal(shortcut) {
  if (!confirmModal) return;

  const details = document.getElementById("modalDetails");
  if (details) details.textContent = `Key: ${shortcut}`;
  confirmModal.classList.add("active");

  confirmCallback = () => {
    TypiStorage.remove(shortcut).then(() => {
      TypiUtils.showNotification("Composition Abolished.", "success", "🗑️");
      loadShortcuts();
      closeConfirmModal();
    });
  };
}

function closeConfirmModal() {
  if (!confirmModal) return;
  confirmModal.classList.remove("active");
  confirmCallback = null;
}

if (modalConfirm) {
  modalConfirm.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
  });
}

if (modalCancel) {
  modalCancel.addEventListener("click", closeConfirmModal);
}

// Load Shortcuts Function
async function loadShortcuts() {
  const data = await TypiStorage.loadAll();
  const container = document.getElementById("shortcutsContainer");

  if (!container) return;

  // Use shared utility to parse storage data
  const { shortcuts, labels } = TypiUtils.parseStorageData(data);

  // Clear container safely
  container.textContent = "";

  if (Object.keys(shortcuts).length === 0) {
    // Create empty state using createElement (XSS-safe)
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Silence. Introduce your first Note.";
    container.appendChild(emptyState);
    return;
  }

  // Use shared utility to sort shortcuts
  const sortedShortcuts = TypiUtils.sortShortcutsByLabel(shortcuts, labels);

  // Build Table using createElement (XSS-safe)
  const table = document.createElement("table");
  table.className = "shortcuts-table";

  // Create thead
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const th1 = document.createElement("th");
  th1.textContent = "Rhythm";
  headerRow.appendChild(th1);

  const th2 = document.createElement("th");
  th2.textContent = "Symphony & Harmony Notes";
  headerRow.appendChild(th2);

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create tbody
  const tbody = document.createElement("tbody");

  sortedShortcuts.forEach((shortcut) => {
    const label = labels[shortcut] || "";
    const stats = TypiUtils.calculateStats(shortcuts[shortcut]);

    // Create row
    const tr = document.createElement("tr");
    tr.setAttribute("data-shortcut", shortcut.toLowerCase());
    tr.setAttribute("data-label", label.toLowerCase());

    // First cell - Rhythm (shortcut key)
    const td1 = document.createElement("td");
    td1.textContent = shortcut;
    tr.appendChild(td1);

    // Second cell - Replacement content
    const td2 = document.createElement("td");
    td2.className = "replacement-cell";

    // Label badge (if label exists)
    if (label) {
      const labelBadge = document.createElement("div");
      labelBadge.className = "label-badge";
      labelBadge.textContent = "📌 " + label;
      td2.appendChild(labelBadge);
    }

    // Replacement content
    const replacementContent = document.createElement("div");
    replacementContent.className = "replacement-content";
    replacementContent.textContent = shortcuts[shortcut];
    td2.appendChild(replacementContent);

    // Stats
    const statsDiv = document.createElement("div");
    statsDiv.className = "replacement-stats";

    const beatSpan = document.createElement("span");
    beatSpan.className = "stat-item";
    beatSpan.textContent = "📊 Beat Count: " + stats.beatCount;
    statsDiv.appendChild(beatSpan);

    const caesuraSpan = document.createElement("span");
    caesuraSpan.className = "stat-item";
    caesuraSpan.textContent = "📏 Caesura: " + stats.caesura;
    statsDiv.appendChild(caesuraSpan);

    td2.appendChild(statsDiv);

    // Button group
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    // Copy/Perform button
    const copyBtn = document.createElement("button");
    copyBtn.className = "action-btn copy-btn";
    copyBtn.setAttribute("data-text", shortcuts[shortcut]);
    copyBtn.textContent = "Perform";
    buttonGroup.appendChild(copyBtn);

    // Edit/Arrange button
    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit-btn";
    editBtn.setAttribute("data-shortcut", shortcut);
    editBtn.setAttribute("data-label", label);
    editBtn.setAttribute("data-replacement", shortcuts[shortcut]);
    editBtn.textContent = "Arrange";
    buttonGroup.appendChild(editBtn);

    // Delete/Abolish button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn delete-btn";
    deleteBtn.setAttribute("data-shortcut", shortcut);
    deleteBtn.textContent = "Abolish";
    buttonGroup.appendChild(deleteBtn);

    td2.appendChild(buttonGroup);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  addActionListeners();

  // Post-save focus logic
  if (postSaveFocusShortcut) {
    const seek = postSaveFocusShortcut.toLowerCase();
    requestAnimationFrame(() => {
      const rows = container.querySelectorAll("tbody tr");
      let target = null;
      rows.forEach((r) => {
        if (r.getAttribute("data-shortcut") === seek) target = r;
      });

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        const cls = UI_CONFIG.focusHighlightClass;
        target.classList.add(cls);
        setTimeout(
          () => target.classList.remove(cls),
          UI_CONFIG.focusHighlightDuration,
        );
      }
    });
    postSaveFocusShortcut = null;
  }
}

// Add Action Listeners
function addActionListeners() {
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-text");
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = "Performed!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove("copied");
        }, TIMING_CONFIG.BUTTON_FEEDBACK_DURATION);
      });
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const shortcut = btn.getAttribute("data-shortcut");
      showConfirmModal(shortcut);
    });
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const shortcut = btn.getAttribute("data-shortcut");
      const label = btn.getAttribute("data-label");
      const replacement = btn.getAttribute("data-replacement");

      const shortcutInput = document.getElementById("shortcutInput");
      const labelInput = document.getElementById("labelInput");
      const replacementInput = document.getElementById("replacementInput");
      const addBtn = document.getElementById("addBtn");
      const saveBtn = document.getElementById("saveBtn");
      const discardBtn = document.getElementById("discardBtn");

      if (shortcutInput) shortcutInput.value = shortcut;
      if (labelInput) labelInput.value = label;
      if (replacementInput) replacementInput.value = replacement;

      if (addBtn) addBtn.style.display = "none";
      if (saveBtn) {
        saveBtn.style.display = "inline-block";
        saveBtn.setAttribute("data-original-shortcut", shortcut);
      }
      if (discardBtn) discardBtn.style.display = "inline-block";

      window.scrollTo({ top: 0, behavior: "smooth" });
      isEditMode = true;
    });
  });
}

// Search Functionality
function performSearch() {
  if (!searchBox) return;

  const query = searchBox.value.toLowerCase().trim();
  const rows = document.querySelectorAll(".shortcuts-table tbody tr");
  let matchCount = 0;
  let firstMatch = null;

  if (!query) {
    rows.forEach((row) => {
      row.classList.remove("hidden");
      row.classList.remove("highlight");
    });
    if (clearBtn) clearBtn.classList.remove("visible");
    return;
  }

  if (clearBtn) clearBtn.classList.add("visible");

  rows.forEach((row) => {
    // Remove previous highlight
    row.classList.remove("highlight");

    const shortcut = row.getAttribute("data-shortcut") || "";
    const label = row.getAttribute("data-label") || "";
    const contentEl = row.querySelector(".replacement-content");
    const content = contentEl ? contentEl.textContent.toLowerCase() : "";

    if (
      shortcut.includes(query) ||
      label.includes(query) ||
      content.includes(query)
    ) {
      row.classList.remove("hidden");
      matchCount++;

      // Track first match
      if (!firstMatch) {
        firstMatch = row;
      }
    } else {
      row.classList.add("hidden");
    }
  });

  if (matchCount === 0) {
    TypiUtils.showNotification(
      "No matching compositions found.",
      "error",
      "🎭",
    );
  } else {
    TypiUtils.showNotification(
      `Found ${matchCount} matching composition${matchCount > 1 ? "s" : ""}!`,
      "success",
      "🎵",
    );

    // ✨ NEW: Auto-scroll to first match and highlight it
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
      firstMatch.classList.add("highlight");

      // Remove highlight after animation completes
      setTimeout(() => {
        firstMatch.classList.remove("highlight");
      }, 2000); // Match the highlightPulse animation duration
    }
  }
}

if (searchBtn) {
  searchBtn.addEventListener("click", performSearch);
}

if (searchBox) {
  searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch();
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (searchBox) searchBox.value = "";
    performSearch();
  });
}

// Floating Button
const floatingBtn = document.getElementById("floatingCompose");
if (floatingBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      floatingBtn.classList.add("visible");
    } else {
      floatingBtn.classList.remove("visible");
    }
  });

  floatingBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const shortcutInput = document.getElementById("shortcutInput");
    if (shortcutInput) shortcutInput.focus();
  });
}

// Add Button (Compose)
const addBtn = document.getElementById("addBtn");
if (addBtn) {
  addBtn.addEventListener("click", () => {
    const shortcutInput = document.getElementById("shortcutInput");
    const labelInput = document.getElementById("labelInput");
    const replacementInput = document.getElementById("replacementInput");

    if (!shortcutInput || !replacementInput) return;

    const shortcut = shortcutInput.value.trim();
    const label = labelInput ? labelInput.value : "";
    const replacement = replacementInput.value;

    if (!shortcut || !replacement) {
      TypiUtils.showNotification("Missing Key or Manuscript.", "error", "⚠️");
      return;
    }

    // ✨ VALIDATION: Check for reserved prefix
    const validation = TypiUtils.validateShortcut(shortcut);
    if (!validation.valid) {
      TypiUtils.showNotification(validation.message, "error", "⚠️");
      return;
    }

    postSaveFocusShortcut = shortcut;

    TypiStorage.save(shortcut, replacement, label || null).then(() => {
      TypiUtils.showNotification("Success! Score Complete.", "success", "✅");
      shortcutInput.value = "";
      if (labelInput) labelInput.value = "";
      replacementInput.value = "";
      loadShortcuts();
    });
  });
}

// Save Button (Edit)
const saveBtn = document.getElementById("saveBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    const shortcutInput = document.getElementById("shortcutInput");
    const labelInput = document.getElementById("labelInput");
    const replacementInput = document.getElementById("replacementInput");

    if (!shortcutInput || !replacementInput) return;

    const originalShortcut = saveBtn.getAttribute("data-original-shortcut");
    const newShortcut = shortcutInput.value.trim();
    const label = labelInput ? labelInput.value : "";
    const replacement = replacementInput.value;

    if (!newShortcut || !replacement) {
      TypiUtils.showNotification("Missing Key or Manuscript.", "error", "⚠️");
      return;
    }

    // ✨ VALIDATION: Check for reserved prefix
    const validation = TypiUtils.validateShortcut(newShortcut);
    if (!validation.valid) {
      TypiUtils.showNotification(validation.message, "error", "⚠️");
      return;
    }

    const savePromise =
      originalShortcut !== newShortcut
        ? TypiStorage.remove(originalShortcut).then(() =>
            TypiStorage.save(newShortcut, replacement, label || null),
          )
        : TypiStorage.save(newShortcut, replacement, label || null);

    savePromise.then(() => {
      TypiUtils.showNotification("Theme saved successfully!", "success", "✅");
      postSaveFocusShortcut = newShortcut;
      exitEditMode();
      loadShortcuts();
    });
  });
}

// Discard Button
const discardBtn = document.getElementById("discardBtn");
if (discardBtn) {
  discardBtn.addEventListener("click", exitEditMode);
}

function exitEditMode() {
  const shortcutInput = document.getElementById("shortcutInput");
  const labelInput = document.getElementById("labelInput");
  const replacementInput = document.getElementById("replacementInput");
  const addBtn = document.getElementById("addBtn");
  const saveBtn = document.getElementById("saveBtn");
  const discardBtn = document.getElementById("discardBtn");

  if (shortcutInput) shortcutInput.value = "";
  if (labelInput) labelInput.value = "";
  if (replacementInput) replacementInput.value = "";
  if (addBtn) addBtn.style.display = "block";
  if (saveBtn) saveBtn.style.display = "none";
  if (discardBtn) discardBtn.style.display = "none";
  isEditMode = false;
}

// Export
const exportBtn = document.getElementById("exportBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    const data = await TypiStorage.loadAll();
    const exportData = {};
    for (let key in data) {
      if (!key.startsWith("__meta__")) {
        exportData[key] = data[key];
      }
    }
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "typipat-musical-notes.json";
    a.click();
    TypiUtils.showNotification(
      "Cadence Executed. Score Released.",
      "success",
      "✅",
    );
  });
}

// Import
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

if (importBtn && importFile) {
  importBtn.addEventListener("click", () => {
    importFile.click();
  });

  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        TypiStorage.importData(data).then(() => {
          TypiUtils.showNotification(
            "Score Imported Successfully!",
            "success",
            "✅",
          );
          loadShortcuts();
        });
      } catch (err) {
        TypiUtils.showNotification("Invalid score file.", "error", "⚠️");
        console.error("Import error:", err);
      }
    };
    reader.readAsText(file);
    importFile.value = "";
  });
}

// Initialize
loadShortcuts();
