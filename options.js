// Initialize
let confirmCallback = null;
let isEditMode = false;
let currentEditingShortcut = null;
let postSaveFocusShortcut = null;
let lastEditedShortcut = null;

function hasKeyConflict(newKey, existingKeys) {
  return existingKeys.includes(newKey);
}

// UI configuration
const UI_CONFIG = {
  focusHighlightClass: "flash-focus",
  focusHighlightDuration: TIMING_CONFIG.FOCUS_HIGHLIGHT_DURATION,
};

// DOM Elements
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
  section = "",
  forEdit = false,
) {
  if (!composerTextarea || !composerAnnotation || !composerModal) return;
  composerTextarea.value = content;
  composerAnnotation.value = annotation;
  if (composerKey) composerKey.value = key;
  const sectionInput = document.getElementById("composerSection");
  if (sectionInput) sectionInput.value = section || "";

  if (forEdit) {
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
      const sectionArrangeInput = document.getElementById(
        "composerSectionArrange",
      );
      if (sectionArrangeInput) sectionArrangeInput.value = section || "";
    }
  } else {
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
    const section = document.getElementById("sectionInput")?.value || "";
    openComposerModal(content, annotation, key, section, false);
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

// Composer Finalize
if (composerFinalize) {
  composerFinalize.addEventListener("click", () => {
    if (!composerTextarea || !composerAnnotation) return;
    const content = composerTextarea.value;
    const annotation = composerAnnotation.value;
    const key = composerKey ? composerKey.value : "";
    const section = document.getElementById("composerSection")?.value || "";
    const replacementInput = document.getElementById("replacementInput");
    const labelInput = document.getElementById("labelInput");
    const shortcutInput = document.getElementById("shortcutInput");
    const sectionInput = document.getElementById("sectionInput");
    if (replacementInput) replacementInput.value = content;
    if (labelInput) labelInput.value = annotation;
    if (shortcutInput) shortcutInput.value = key;
    if (sectionInput) sectionInput.value = section;
    closeComposerModal();
    TypiUtils.showNotification(
      "Arrangement finalized. Click Compose to save.",
      "success",
      "🎵",
    );
  });
}

// Composer Save
if (composerSave) {
  composerSave.addEventListener("click", () => {
    if (!composerTextarea) return;
    const content = composerTextarea.value;
    let annotationValue = null;
    let sectionValue = null;
    if (isEditMode) {
      const arrangeEl = document.getElementById("composerAnnotationArrange");
      annotationValue = arrangeEl ? arrangeEl.value.trim() || null : null;
      const sectionArrangeEl = document.getElementById(
        "composerSectionArrange",
      );
      sectionValue = sectionArrangeEl
        ? sectionArrangeEl.value.trim() || null
        : null;
    } else {
      annotationValue = composerAnnotation
        ? composerAnnotation.value.trim() || null
        : null;
      const sectionInput = document.getElementById("composerSection");
      sectionValue = sectionInput ? sectionInput.value.trim() || null : null;
    }
    if (currentEditingShortcut) {
      TypiStorage.save(
        currentEditingShortcut,
        content,
        annotationValue,
        sectionValue,
      ).then(() => {
        TypiUtils.showNotification(
          "Theme saved successfully! 🎼",
          "success",
          "✅",
        );
        closeComposerModal();
        loadShortcuts();
        // 🎵 Sound: Edit/Theme
        if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
          SoundPlayer.playEditSound();
        }
      });
    }
  });
}

// Composer Close/Cancel
if (composerClose) composerClose.addEventListener("click", closeComposerModal);
if (composerCancel)
  composerCancel.addEventListener("click", closeComposerModal);

// Confirm Modal
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
      // 🎵 Sound: Delete/Abolish
      if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
        SoundPlayer.playDeleteSound();
      }
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

// ==========================================
// LOAD SHORTCUTS - WITH SECTION SORTING
// ==========================================
async function loadShortcuts() {
  const data = await TypiStorage.loadAll();
  const container = document.getElementById("shortcutsContainer");
  if (!container) return;

  const pinnedOrder = await getPinnedOrder();

  // 🔥 FILTER: I-block lang ang __pinned_order__, __meta__, at reserved settings
  const RESERVED_SETTING_KEYS = ["soundEnabled", "enabled"];
  const filteredData = {};
  for (let key in data) {
    if (
      key !== "__pinned_order__" &&
      !key.startsWith("__meta__") &&
      !RESERVED_SETTING_KEYS.includes(key)
    ) {
      filteredData[key] = data[key];
    }
  }

  const { shortcuts, labels } = TypiUtils.parseStorageData(filteredData);
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
    emptyState.textContent = "Silence. Introduce your first Note.";
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
    if (isUntitledA) return 1; // Untitled sa dulo ng section group
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
    if (isUntitledA) return 1; // Untitled sa pinakadulo
    if (isUntitledB) return -1;

    return labelA.localeCompare(labelB);
  });

  // 6. Pagsamahin: pinned + withSection + withoutSection
  const sortedShortcuts = [...pinned, ...withSection, ...withoutSection];

  // ==========================================
  // RENDER TABLE
  // ==========================================

  const table = document.createElement("table");
  table.className = "shortcuts-table";

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

  const tbody = document.createElement("tbody");

  sortedShortcuts.forEach((shortcut) => {
    const label = labels[shortcut] || "";
    const section = data[`__section__${shortcut}`] || "";
    const stats = TypiUtils.calculateStats(shortcuts[shortcut]);
    const isPinned = pinnedOrder.includes(shortcut);
    const slot = isPinned ? pinnedOrder.indexOf(shortcut) : null;
    const chroma = slot !== null ? getChromaticDataForSlot(slot) : null;

    const tr = document.createElement("tr");
    tr.setAttribute("data-shortcut", shortcut.toLowerCase());
    tr.setAttribute("data-label", label.toLowerCase());
    tr.setAttribute("data-section", section.toLowerCase());
    if (isPinned) tr.classList.add("pinned");

    // ---- First column: Rhythm ----
    const td1 = document.createElement("td");
    td1.style.cssText =
      "vertical-align: middle; padding: 10px 8px; text-align: center; height: 100px;";

    const colContainer = document.createElement("div");
    colContainer.style.cssText =
      "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 80px;";

    // Key + Badge row (sa gitna)
    const topRow = document.createElement("div");
    topRow.style.cssText =
      "display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1;";

    // 🔥 BADGE (sa PINAKA TAAS na KALIWA)
    if (isPinned && chroma) {
      const badgeWrapper = document.createElement("div");
      badgeWrapper.style.cssText =
        "width: 100%; display: flex; justify-content: flex-start; margin-bottom: 4px;";

      const badge = document.createElement("div");
      badge.style.cssText = `
        padding: 3px 10px;
        border-radius: 20px;
        background: ${chroma.bg};
        color: white;
        font-size: 11px;
        font-weight: bold;
        border: 2px solid rgba(0,0,0,0.3);
        font-family: "Georgia", serif;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      `;
      const iconSpan = document.createElement("span");
      iconSpan.textContent = chroma.icon;
      iconSpan.style.fontSize = "12px";
      badge.appendChild(iconSpan);
      const noteSpan = document.createElement("span");
      noteSpan.textContent = chroma.note;
      noteSpan.style.fontSize = "10px";
      badge.appendChild(noteSpan);

      badgeWrapper.appendChild(badge);
      colContainer.appendChild(badgeWrapper);
    }

    // Key (sa gitna)
    const keyDiv = document.createElement("div");
    keyDiv.style.cssText =
      "font-weight: 500; font-size: 16px; text-align: center;";
    if (isPinned) {
      keyDiv.style.color = "#E65100";
      keyDiv.style.fontWeight = "bold";
    } else {
      keyDiv.style.color = "#6a1b9a";
    }
    keyDiv.textContent = shortcut;
    topRow.appendChild(keyDiv);

    colContainer.appendChild(topRow);

    // Fermata (sa pinakababa)
    const fermataDiv = document.createElement("div");
    fermataDiv.style.cssText =
      "display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: auto; padding-top: 6px; font-size: 12px;";
    const fermataIcon = document.createElement("span");
    fermataIcon.textContent = "🎶";
    fermataIcon.style.fontSize = "13px";
    fermataDiv.appendChild(fermataIcon);
    const fermataLabel = document.createElement("span");
    fermataLabel.textContent = "Fermata 𝄐";
    fermataLabel.style.fontWeight = "500";
    fermataLabel.style.fontSize = "11px";
    fermataLabel.style.color = "#DAA520";
    fermataDiv.appendChild(fermataLabel);
    const toggleText = document.createElement("span");
    toggleText.textContent = isPinned ? "[ON]" : "[OFF]";
    toggleText.style.cssText = `
      font-weight: bold;
      cursor: pointer;
      padding: 1px 8px;
      border-radius: 12px;
      background: ${isPinned ? "#FFD700" : "#e0e0e0"};
      color: ${isPinned ? "#333" : "#666"};
      transition: background 0.2s;
      user-select: none;
      font-size: 11px;
    `;
    toggleText.setAttribute("data-shortcut", shortcut);
    toggleText.addEventListener("click", async (e) => {
      e.stopPropagation();
      const sh = toggleText.getAttribute("data-shortcut");
      const currentOrder = await getPinnedOrder();
      const isPinning = !currentOrder.includes(sh);

      if (isPinning && currentOrder.length >= 12) {
        TypiUtils.showNotification(
          "🚫 Scale Overflow: Unpin a note to sustain a new tone.",
          "error",
          "⚠️",
        );
        return;
      }

      const newOrder = togglePin(sh, currentOrder);
      await setPinnedOrder(newOrder);
      showPinNotification(sh, isPinning, currentOrder, newOrder);
      loadShortcuts();
    });
    fermataDiv.appendChild(toggleText);
    colContainer.appendChild(fermataDiv);

    td1.appendChild(colContainer);
    tr.appendChild(td1);

    // ---- Second column: Symphony & Harmony Notes ----
    const td2 = document.createElement("td");
    td2.className = "replacement-cell";
    td2.style.cssText =
      "display: flex; flex-direction: column; align-items: stretch;";

    const labelRow = document.createElement("div");
    labelRow.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 5px;";

    const labelDisplay = label || "Untitled";
    const labelBadge = document.createElement("div");
    labelBadge.className = "label-badge";
    labelBadge.textContent = "📌 " + labelDisplay;
    labelRow.appendChild(labelBadge);

    if (section) {
      const sectionBadge = document.createElement("span");
      sectionBadge.className = "section-badge-right";
      sectionBadge.textContent = "📂 " + section;
      sectionBadge.style.cssText = `
        padding: 4px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        background: linear-gradient(135deg, #fff8e7 0%, #ffecb3 100%);
        color: #4a148c;
        border: 2px solid #ffd54f;
        font-family: "Georgia", "Times New Roman", serif;
        margin-top: -18px;
      `;
      labelRow.appendChild(sectionBadge);
    }

    td2.appendChild(labelRow);

    const replacementContent = document.createElement("div");
    replacementContent.className = "replacement-content";
    replacementContent.textContent = shortcuts[shortcut];
    td2.appendChild(replacementContent);

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

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    const copyBtn = document.createElement("button");
    copyBtn.className = "action-btn copy-btn";
    copyBtn.setAttribute("data-text", shortcuts[shortcut]);
    copyBtn.textContent = "Perform";
    buttonGroup.appendChild(copyBtn);

    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit-btn";
    editBtn.setAttribute("data-shortcut", shortcut);
    editBtn.setAttribute("data-label", label);
    editBtn.setAttribute("data-replacement", shortcuts[shortcut]);
    editBtn.setAttribute("data-section", section);
    editBtn.textContent = "Arrange";
    buttonGroup.appendChild(editBtn);

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

  // Post-save focus
  if (postSaveFocusShortcut) {
    const seek = postSaveFocusShortcut.toLowerCase();
    console.log("🔍 Looking for:", seek);
    setTimeout(() => {
      const rows = container.querySelectorAll("tbody tr");
      let target = null;
      rows.forEach((r) => {
        const shortcut = r.getAttribute("data-shortcut");
        if (shortcut === seek) {
          target = r;
        }
      });
      if (target) {
        console.log("✅ Found target:", seek);
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        const cls = UI_CONFIG.focusHighlightClass;
        target.classList.add(cls);
        setTimeout(
          () => target.classList.remove(cls),
          UI_CONFIG.focusHighlightDuration,
        );
      } else {
        console.log("⚠️ Target not found:", seek);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
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
        // 🎵 Sound: Perform
        if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
          SoundPlayer.playPerformSound();
        }
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
      const section = btn.getAttribute("data-section") || "";

      const shortcutInput = document.getElementById("shortcutInput");
      const labelInput = document.getElementById("labelInput");
      const replacementInput = document.getElementById("replacementInput");
      const sectionInput = document.getElementById("sectionInput");
      const addBtn = document.getElementById("addBtn");
      const saveBtn = document.getElementById("saveBtn");
      const discardBtn = document.getElementById("discardBtn");

      if (shortcutInput) shortcutInput.value = shortcut;
      if (labelInput) labelInput.value = label || "";
      if (replacementInput) replacementInput.value = replacement;
      if (sectionInput) sectionInput.value = section;

      if (addBtn) addBtn.style.display = "none";
      if (saveBtn) {
        saveBtn.style.display = "inline-block";
        saveBtn.setAttribute("data-original-shortcut", shortcut);
      }
      if (discardBtn) discardBtn.style.display = "inline-block";

      lastEditedShortcut = shortcut;
      window.scrollTo({ top: 0, behavior: "smooth" });
      isEditMode = true;

      // 🎵 Sound: Arrange
      if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
        SoundPlayer.playArrangeSound();
      }
    });
  });
}

// Search
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
    row.classList.remove("highlight");
    const shortcut = row.getAttribute("data-shortcut") || "";
    const label = row.getAttribute("data-label") || "";
    const section = row.getAttribute("data-section") || "";
    const contentEl = row.querySelector(".replacement-content");
    const content = contentEl ? contentEl.textContent.toLowerCase() : "";

    if (
      shortcut.includes(query) ||
      label.includes(query) ||
      content.includes(query) ||
      section.includes(query)
    ) {
      row.classList.remove("hidden");
      matchCount++;
      if (!firstMatch) firstMatch = row;
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
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
      firstMatch.classList.add("highlight");
      setTimeout(() => firstMatch.classList.remove("highlight"), 2000);
    }
  }
}

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    performSearch();
    // 🎵 Sound: Search
    if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
      SoundPlayer.playSearchSound();
    }
  });
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
    // 🎵 Sound: Clear
    if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
      SoundPlayer.playClearSound();
    }
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
if (addBtn) {
  addBtn.addEventListener("click", () => {
    const shortcutInput = document.getElementById("shortcutInput");
    const labelInput = document.getElementById("labelInput");
    const replacementInput = document.getElementById("replacementInput");
    const sectionInput = document.getElementById("sectionInput");

    if (!shortcutInput || !replacementInput) return;

    const shortcut = shortcutInput.value.trim();
    const label = labelInput ? labelInput.value : "";
    const replacement = replacementInput.value;
    const section = sectionInput ? sectionInput.value : "";

    if (!shortcut || !replacement) {
      TypiUtils.showNotification("Missing Key or Manuscript.", "error", "⚠️");
      return;
    }

    const validation = TypiUtils.validateShortcut(shortcut);
    if (!validation.valid) {
      TypiUtils.showNotification(validation.message, "error", "⚠️");
      return;
    }

    TypiStorage.loadAll().then((existingData) => {
      const existingKeys = Object.keys(existingData).filter(
        (k) =>
          !k.startsWith("__label__") &&
          !k.startsWith("__meta__") &&
          !k.startsWith("__section__"),
      );

      if (hasKeyConflict(shortcut, existingKeys)) {
        TypiUtils.showNotification(
          `🎵 Dissonance! The Key "${shortcut}" conflicts with an existing key.`,
          "error",
          "⚠️",
        );
        // 🎵 Sound: Error
        if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
          SoundPlayer.playErrorSound();
        }
        // 🔥 FIX: Huwag i-clear ang form para makita ng user ang error
        return;
      }

      postSaveFocusShortcut = shortcut;
      TypiStorage.save(shortcut, replacement, label || null, section || null)
        .then(() => {
          TypiUtils.showNotification(
            "Success! Score Complete.",
            "success",
            "✅",
          );
          shortcutInput.value = "";
          if (labelInput) labelInput.value = "";
          replacementInput.value = "";
          if (sectionInput) sectionInput.value = "";
          loadShortcuts();
          // 🎵 Sound: Add
          if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
            SoundPlayer.playAddSound();
          }
        })
        .catch((error) => {
          console.error("Add error:", error);
          TypiUtils.showNotification(
            `Save failed: ${error.message || "Unknown error"}`,
            "error",
            "⚠️",
          );
        });
    });
  });
}

// Save Button (Edit)
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    const shortcutInput = document.getElementById("shortcutInput");
    const labelInput = document.getElementById("labelInput");
    const replacementInput = document.getElementById("replacementInput");
    const sectionInput = document.getElementById("sectionInput");

    if (!shortcutInput || !replacementInput) return;

    const originalShortcut = saveBtn.getAttribute("data-original-shortcut");
    const newShortcut = shortcutInput.value.trim();
    const label = labelInput ? labelInput.value : "";
    const replacement = replacementInput.value;
    const section = sectionInput ? sectionInput.value : "";

    if (!newShortcut || !replacement) {
      TypiUtils.showNotification("Missing Key or Manuscript.", "error", "⚠️");
      return;
    }

    // 🔥 VALIDATION: Gamitin ang TypiUtils.validateShortcut
    const validation = TypiUtils.validateShortcut(newShortcut);
    if (!validation.valid) {
      TypiUtils.showNotification(validation.message, "error", "⚠️");
      return;
    }

    TypiStorage.loadAll().then((existingData) => {
      const existingKeys = Object.keys(existingData).filter(
        (k) =>
          !k.startsWith("__label__") &&
          !k.startsWith("__meta__") &&
          !k.startsWith("__section__"),
      );

      if (originalShortcut === newShortcut) {
        performSave(originalShortcut, newShortcut, replacement, label, section);
        return;
      }

      const filteredKeys = existingKeys.filter((k) => k !== originalShortcut);
      if (hasKeyConflict(newShortcut, filteredKeys)) {
        TypiUtils.showNotification(
          `🎵 Dissonance! The Key "${newShortcut}" conflicts with an existing key.`,
          "error",
          "⚠️",
        );
        // 🎵 Sound: Error
        if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
          SoundPlayer.playErrorSound();
        }

        // 🔥 FIX: I-set pa rin ang postSaveFocusShortcut para sa navigation
        postSaveFocusShortcut = originalShortcut;
        loadShortcuts(); // I-reload ang listahan para makita ang error state
        return;
      }

      performSave(originalShortcut, newShortcut, replacement, label, section);
    });
  });
}

function performSave(
  originalShortcut,
  newShortcut,
  replacement,
  label,
  section,
) {
  const isRename = originalShortcut !== newShortcut;
  const savePromise = isRename
    ? TypiStorage.remove(originalShortcut).then(() =>
        TypiStorage.save(
          newShortcut,
          replacement,
          label || null,
          section || null,
        ),
      )
    : TypiStorage.save(
        newShortcut,
        replacement,
        label || null,
        section || null,
      );

  savePromise
    .then(async () => {
      // 🔥 FIX: i-carry over ang pin status pag nag-rename
      if (isRename) {
        const currentOrder = await getPinnedOrder();
        const idx = currentOrder.indexOf(originalShortcut);
        if (idx !== -1) {
          currentOrder[idx] = newShortcut;
          await setPinnedOrder(currentOrder);
        }
      }

      TypiUtils.showNotification("Theme saved successfully!", "success", "✅");
      postSaveFocusShortcut = newShortcut;
      exitEditMode();
      if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
        SoundPlayer.playEditSound();
      }
    })
    .catch((error) => {
      console.error("Save error:", error);
      TypiUtils.showNotification(
        `Save failed: ${error.message || "Unknown error"}`,
        "error",
        "⚠️",
      );
      postSaveFocusShortcut = originalShortcut;
      exitEditMode();
    });
}

// Discard Button
const discardBtn = document.getElementById("discardBtn");
if (discardBtn) {
  discardBtn.addEventListener("click", () => {
    exitEditMode();
    // 🎵 Sound: Variance
    if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
      SoundPlayer.playVarianceSound();
    }
  });
}

function exitEditMode() {
  const shortcutInput = document.getElementById("shortcutInput");
  const labelInput = document.getElementById("labelInput");
  const replacementInput = document.getElementById("replacementInput");
  const sectionInput = document.getElementById("sectionInput");
  const addBtn = document.getElementById("addBtn");
  const saveBtn = document.getElementById("saveBtn");
  const discardBtn = document.getElementById("discardBtn");

  if (shortcutInput) shortcutInput.value = "";
  if (labelInput) labelInput.value = "";
  if (replacementInput) replacementInput.value = "";
  if (sectionInput) sectionInput.value = "";

  if (addBtn) addBtn.style.display = "block";
  if (saveBtn) saveBtn.style.display = "none";
  if (discardBtn) discardBtn.style.display = "none";
  isEditMode = false;

  if (lastEditedShortcut) {
    if (!postSaveFocusShortcut) {
      // 🔥 huwag i-overwrite kung meron nang naka-set
      postSaveFocusShortcut = lastEditedShortcut;
    }
    lastEditedShortcut = null;
    loadShortcuts();
  }
}

// Export
const exportBtn = document.getElementById("exportBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    const data = await TypiStorage.loadAll();
    const RESERVED_SETTING_KEYS = ["soundEnabled", "enabled"];
    const exportData = {};
    let hasContent = false;
    for (let key in data) {
      if (
        !key.startsWith("__meta__") &&
        key !== "__pinned_order__" &&
        !RESERVED_SETTING_KEYS.includes(key)
      ) {
        exportData[key] = data[key];
        hasContent = true;
      }
    }
    if (!hasContent) {
      TypiUtils.showNotification(
        "Silence. No notes to export. Compose first.",
        "error",
        "🎭",
      );
      return;
    }
    showCadenceModal(exportData);
    // 🎵 Sound: Cadence
    if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
      SoundPlayer.playCadenceSound();
    }
  });
}

// Cadence Modal
function showCadenceModal(exportData) {
  const modal = document.getElementById("cadenceModal");
  const input = document.getElementById("cadenceAlbumInput");
  const confirmBtn = document.getElementById("cadenceConfirmBtn");
  const cancelBtn = document.getElementById("cadenceCancelBtn");
  const errorMsg = document.getElementById("cadenceErrorMsg");

  if (!modal) return;
  input.value = "";
  if (errorMsg) errorMsg.style.display = "none";
  modal.style.display = "flex";
  setTimeout(() => input.focus(), 100);

  const handleConfirm = () => {
    const albumName = input.value.trim();
    if (!albumName) {
      if (errorMsg) {
        errorMsg.textContent =
          "🎵 An Album requires a title to achieve Harmony.";
        errorMsg.style.display = "block";
      } else {
        TypiUtils.showNotification(
          "An Album requires a title to achieve Harmony.",
          "error",
          "🎵",
        );
      }
      input.focus();
      return;
    }
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${albumName} - typipat-musical-notes.json`;
    a.click();
    TypiUtils.showNotification(
      `🎵 "${albumName}" composed and released!`,
      "success",
      "✅",
    );
    modal.style.display = "none";
    cleanup();
  };

  const handleCancel = () => {
    TypiUtils.showNotification(
      "Score Sustained. No changes applied.",
      "info",
      "🎵",
    );
    modal.style.display = "none";
    cleanup();
  };

  const cleanup = () => {
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
    document.removeEventListener("keydown", handleKeydown);
    if (errorMsg) errorMsg.style.display = "none";
  };

  const handleKeydown = (e) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  confirmBtn.addEventListener("click", handleConfirm);
  cancelBtn.addEventListener("click", handleCancel);
  document.addEventListener("keydown", handleKeydown);
}

// Import
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
if (importBtn && importFile) {
  importBtn.addEventListener("click", () => {
    importFile.click();
    // 🎵 Sound: Entrata
    if (typeof SoundPlayer !== "undefined" && SoundPlayer.enabled) {
      SoundPlayer.playEntrataSound();
    }
  });

  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const RESERVED_SETTING_KEYS = ["soundEnabled", "enabled"];

        const existingData = await TypiStorage.loadAll();
        const existingKeySet = new Set(
          Object.keys(existingData).filter(
            (k) =>
              !k.startsWith("__meta__") &&
              !k.startsWith("__label__") &&
              !k.startsWith("__section__") &&
              k !== "__pinned_order__" &&
              !RESERVED_SETTING_KEYS.includes(k),
          ),
        );

        const incomingShortcutKeys = Object.keys(data).filter(
          (k) =>
            !k.startsWith("__meta__") &&
            !k.startsWith("__label__") &&
            !k.startsWith("__section__") &&
            k !== "__pinned_order__" &&
            !RESERVED_SETTING_KEYS.includes(k),
        );

        // 🔥 Auto-rename ang mga kapangalan — HINDI na mag-o-overwrite ng luma
        const renamedData = {};
        let renameCount = 0;

        incomingShortcutKeys.forEach((key) => {
          let finalKey = key;
          if (existingKeySet.has(key)) {
            let attempt = key + " (Reprise)";
            let counter = 2;
            while (
              existingKeySet.has(attempt) ||
              incomingShortcutKeys.includes(attempt)
            ) {
              attempt = `${key} (Reprise ${counter})`;
              counter++;
            }
            finalKey = attempt;
            renameCount++;
          }
          renamedData[finalKey] = data[key];
          if (data[`__label__${key}`] !== undefined) {
            renamedData[`__label__${finalKey}`] = data[`__label__${key}`];
          }
          if (data[`__section__${key}`] !== undefined) {
            renamedData[`__section__${finalKey}`] = data[`__section__${key}`];
          }
        });

        if (renameCount > 0) {
          const proceed = window.confirm(
            `🎵 ${renameCount} shortcut(s) ay may kaparehong pangalan sa existing mo.\n\n` +
              `Awtomatiko silang bibigyan ng "(Reprise)" suffix para hindi mabura ang luma mo.\n\n` +
              `Gusto mo bang ituloy ang import?`,
          );
          if (!proceed) {
            TypiUtils.showNotification(
              "Import cancelled. Walang binago.",
              "info",
              "🎵",
            );
            importFile.value = "";
            return;
          }
        }

        const result = await TypiStorage.importData(renamedData);
        if (result.syncFailed) {
          TypiUtils.showNotification(
            "Na-import locally, pero puno na ang sync storage — hindi na-sync sa ibang device.",
            "error",
            "⚠️",
          );
        } else if (renameCount > 0) {
          TypiUtils.showNotification(
            `Imported! ${renameCount} shortcut(s) na-rename ng (Reprise) para maiwasan ang conflict.`,
            "success",
            "✅",
          );
        } else {
          TypiUtils.showNotification(
            "Score Imported Successfully!",
            "success",
            "✅",
          );
        }
        loadShortcuts();
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

// ==========================================
// SOUND TOGGLE
// ==========================================
const soundToggle = document.getElementById("soundToggle");
if (soundToggle) {
  chrome.storage.local.get(["soundEnabled"], (result) => {
    soundToggle.checked = result.soundEnabled !== false;
  });

  soundToggle.addEventListener("change", () => {
    const enabled = soundToggle.checked;
    chrome.storage.local.set({ soundEnabled: enabled });
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs
            .sendMessage(tab.id, { action: "toggleSound", enabled: enabled })
            .catch(() => {});
        }
      });
    });
    TypiUtils.showNotification(
      enabled
        ? "🎵 Harmonies Restored: Audio feedback enabled."
        : "🔇 Tacet Mode: Audio feedback muted.",
      "info",
      enabled ? "🎵" : "🔇",
    );
  });
}
