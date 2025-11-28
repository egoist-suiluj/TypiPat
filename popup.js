// Load and display all shortcuts
async function loadNotes() {
  const data = await TypiStorage.loadAll();
  const container = document.getElementById('notesList');

  if (!container) return;

  // Use shared utility to parse storage data
  const { shortcuts, labels } = TypiUtils.parseStorageData(data);

  // Check if there are shortcuts
  if (Object.keys(shortcuts).length === 0) {
    container.innerHTML = '<div class="empty-state">Silence. No notes composed yet.</div>';
    return;
  }

  // Use shared utility to sort shortcuts
  const sortedShortcuts = TypiUtils.sortShortcutsByLabel(shortcuts, labels);

  // Build notes HTML
  let notesHTML = '';

  sortedShortcuts.forEach(shortcut => {
    const label = labels[shortcut] || 'Untitled';

    notesHTML += `
      <div class="note-item" data-shortcut="${TypiUtils.escapeHtml(shortcut).toLowerCase()}" data-label="${TypiUtils.escapeHtml(label).toLowerCase()}">
        <div class="note-header">
          <div class="note-content">
            <div class="note-rhythm">${TypiUtils.escapeHtml(shortcut)}</div>
            <div class="note-label">${TypiUtils.escapeHtml(label)}</div>
          </div>
          <button class="perform-btn" data-text="${TypiUtils.escapeHtml(shortcuts[shortcut])}">Perform</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = notesHTML;

  // Add event listeners
  addPerformListeners();
}

// Add event listeners for perform buttons
function addPerformListeners() {
  document.querySelectorAll('.perform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');

      // Copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalText = btn.textContent;
        btn.textContent = 'Scored!';
        btn.classList.add('copied');

        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, TIMING_CONFIG.BUTTON_FEEDBACK_DURATION);
      }).catch(err => {
        console.error('Failed to perform:', err);
      });
    });
  });
}

// Open options page
const openOptionsBtn = document.getElementById('openOptions');
if (openOptionsBtn) {
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Search functionality
const searchBox = document.getElementById('searchBox');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearSearch');

function performSearch() {
  if (!searchBox) return;

  const searchTerm = searchBox.value.toLowerCase().trim();
  const notes = document.querySelectorAll('.note-item');

  // Check if search is empty
  if (!searchTerm) {
    TypiUtils.showNotification('Please enter a search term to cue.', 'error', '🎭');
    return;
  }

  // Show/hide clear button
  if (clearBtn) {
    clearBtn.classList.add('visible');
  }

  let foundMatch = false;
  let matchCount = 0;

  notes.forEach(note => {
    const shortcut = note.getAttribute('data-shortcut');
    const label = note.getAttribute('data-label');

    if (shortcut.includes(searchTerm) || label.includes(searchTerm)) {
      note.classList.remove('hidden');
      matchCount++;

      // Highlight first match
      if (!foundMatch) {
        note.classList.add('highlight');
        note.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        foundMatch = true;

        setTimeout(() => {
          note.classList.remove('highlight');
        }, TIMING_CONFIG.BUTTON_FEEDBACK_DURATION);
      }
    } else {
      note.classList.add('hidden');
      note.classList.remove('highlight');
    }
  });

  // Show result notification
  if (matchCount === 0) {
    TypiUtils.showNotification('No matching notes found. Try a different rhythm.', 'error', '🎭');
  } else if (matchCount === 1) {
    TypiUtils.showNotification('Found 1 matching note!', 'success', '🎵');
  } else {
    TypiUtils.showNotification(`Found ${matchCount} matching notes!`, 'success', '🎵');
  }
}

// Search button click
if (searchBtn) {
  searchBtn.addEventListener('click', performSearch);
}

// Enter key press
if (searchBox) {
  searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}

// Clear search
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (searchBox) {
      searchBox.value = '';
    }
    clearBtn.classList.remove('visible');

    const notes = document.querySelectorAll('.note-item');
    notes.forEach(note => {
      note.classList.remove('hidden');
      note.classList.remove('highlight');
    });
  });
}

// Load notes when popup opens
loadNotes();