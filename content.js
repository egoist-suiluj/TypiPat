// ==========================================
// 1. Field Detection Logic
// ==========================================
const FieldDetector = {
  getFieldType(originalElement) {
    let element = this.getDeepActiveElement();
    if (!element) element = originalElement;
    if (!element) return "unknown";

    if (element.isContentEditable === false && element.readOnly) return "readonly";
    if (element.disabled) return "readonly";

    const tagName = element.tagName.toLowerCase();
    const inputType = (element.type || "").toLowerCase();

    if (tagName === "input" && inputType === "password") {
      return "password";
    }

    if (tagName === "input") {
      const validTypes = ["text", "email", "url", "search", "tel", "number"];
      if (validTypes.includes(inputType) || !inputType) {
        return "input";
      }
      return "unknown";
    }

    if (tagName === "textarea") {
      if (element.readOnly || element.disabled) return "readonly";
      return "textarea";
    }

    if (element.isContentEditable) {
      if (element.getAttribute("contenteditable") === "false") return "readonly";
      return "contentEditable";
    }

    if (tagName === "iframe") {
      try {
        const innerDoc = element.contentDocument || element.contentWindow.document;
        if (innerDoc && innerDoc.designMode === "on") return "contentEditable";
      } catch (e) {}
    }

    return "unknown";
  },

  getDeepActiveElement() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  },
};

// ==========================================
// 2. Template Processing
// ==========================================
const TemplateProcessor = {
  process(text) {
    const now = new Date();
    const date = now.getMonth() + 1 + "/" + now.getDate() + "/" + now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const time = hours + ":" + minutes + " " + ampm;
    const datetime = date + " " + time;

    return text
      .replace(/{datetime}/g, datetime)
      .replace(/{data-time}/g, datetime)
      .replace(/{date}/g, date)
      .replace(/{time}/g, time);
  },
};

// ==========================================
// 3. Expansion Logic
// ==========================================
const SnippetExpander = {
  async expand(element, shortcut, replacement, fieldType) {
  const processedReplacement = TemplateProcessor.process(replacement);
  let success = false;

  try {
    if (fieldType === "input" || fieldType === "textarea") {
      success = this.insertInInput(element, shortcut, processedReplacement);
    } else if (fieldType === "contentEditable") {
      // 🔥 DETECT TINYMCE
      if (window.tinymce && window.tinymce.activeEditor) {
        success = this.insertInTinyMCE(element, shortcut, processedReplacement);
      } else {
        success = this.insertInContentEditable(element, shortcut, processedReplacement);
      }
    }
  } catch (err) {
    success = false;
  }

  if (!success) {
    await this.insertViaClipboard(shortcut, processedReplacement);
  }
},

  insertInInput(element, shortcut, replacement) {
    try {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const val = element.value;

      const textBefore = val.slice(0, start);
      if (!textBefore.endsWith(shortcut)) {
        return false;
      }

      const before = val.slice(0, start - shortcut.length);
      const after = val.slice(end);

      const prototype = element.tagName.toLowerCase() === "textarea"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(prototype, "value").set;

      const newContent = before + replacement + after;

      if (nativeSetter) {
        nativeSetter.call(element, newContent);
      } else {
        element.value = newContent;
      }

      const newCursorPos = before.length + replacement.length;
      element.focus();
      element.setSelectionRange(newCursorPos, newCursorPos);
      this.triggerInputEvents(element);
      return true;
    } catch (e) {
      return false;
    }
  },

  // 🔥 ITO ANG ORIGINAL - GUMAGANA SA TINYMCE DETECTION PERO HINDI NAG-U-UPDATE ANG SCREEN
  insertInContentEditable(element, shortcut, replacement) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    if (range.endContainer.nodeType !== Node.TEXT_NODE) return false;

    const text = range.endContainer.textContent;
    const endOffset = range.endOffset;

    if (endOffset < shortcut.length) return false;

    const startOffset = endOffset - shortcut.length;
    if (text.slice(startOffset, endOffset) !== shortcut) return false;

    selection.collapseToEnd();

    if (selection.modify) {
      for (let i = 0; i < shortcut.length; i++) {
        selection.modify("extend", "backward", "character");
      }
    } else {
      const newRange = document.createRange();
      newRange.setStart(range.endContainer, startOffset);
      newRange.setEnd(range.endContainer, endOffset);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    const result = document.execCommand("insertText", false, replacement);

    if (result) {
      const finalSelection = window.getSelection();
      if (finalSelection && finalSelection.rangeCount > 0) {
        finalSelection.collapseToEnd();
      }
      return true;
    }

    return false;
  },

    // ==========================================
  // 🆕 DETECT TINYMCE
  // ==========================================
  isTinyMCE() {
  // 🔥 DIREKTA SA PAGE
  if (window.tinymce && window.tinymce.activeEditor) {
    console.log('✅ TinyMCE found directly on page');
    return true;
  }
  
  // Fallback: check sa parent (may try-catch)
  if (window.parent && window.parent !== window) {
    try {
      if (window.parent.tinymce && window.parent.tinymce.activeEditor) {
        console.log('✅ TinyMCE found in parent window');
        return true;
      }
    } catch (e) {
      // Cross-origin parent - i-skip lang
    }
  }
  
  // Fallback: check sa iframes (kung meron man)
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      if (iframe.contentWindow && iframe.contentWindow.tinymce && iframe.contentWindow.tinymce.activeEditor) {
        console.log('✅ TinyMCE found in iframe');
        return true;
      }
    } catch (e) {}
  }
  
  return false;
},

  // ==========================================
  // 🆕 INSERT IN TINYMCE - DEDICATED
  // ==========================================
  insertInTinyMCE(element, shortcut, replacement) {
    console.log('🔧 TinyMCE specific insert');
    
    try {
      let editor = null;
      
      if (window.tinymce && window.tinymce.activeEditor) {
        editor = window.tinymce.activeEditor;
      } else if (window.parent && window.parent.tinymce && window.parent.tinymce.activeEditor) {
        editor = window.parent.tinymce.activeEditor;
      } else {
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
          try {
            if (iframe.contentWindow && iframe.contentWindow.tinymce && iframe.contentWindow.tinymce.activeEditor) {
              editor = iframe.contentWindow.tinymce.activeEditor;
              break;
            }
          } catch (e) {}
        }
      }
      
      if (!editor) {
        console.warn('⚠️ TinyMCE editor not found');
        return false;
      }
      
      // Kunin ang selection at text bago cursor
      const rng = editor.selection.getRng();
      const node = rng.startContainer;
      const offset = rng.startOffset;
      
      let textBefore = '';
      if (node.nodeType === Node.TEXT_NODE) {
        textBefore = node.textContent.substring(0, offset);
      } else {
        // Kung hindi text node, gamitin ang buong content
        textBefore = editor.getContent({ format: 'text' });
      }
      
      console.log('📝 Text before cursor:', textBefore.substring(Math.max(0, textBefore.length - 20)));
      
      if (textBefore.endsWith(shortcut)) {
        const startPos = textBefore.length - shortcut.length;
        const newRange = document.createRange();
        newRange.setStart(node, startPos);
        newRange.setEnd(node, offset);
        editor.selection.setRng(newRange);
        
        // 🔥 GAMITIN ANG TINYMCE insertContent
        const success = editor.execCommand('mceInsertContent', false, replacement);
        
        if (success) {
          editor.fire('input');
          editor.fire('change');
          editor.fire('UpdateContent');
          console.log('✅ TinyMCE insert successful!');
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.warn('TinyMCE insert error:', err);
      return false;
    }
  },

    async insertViaClipboard(shortcut, replacement) {
    console.log('📋 Clipboard fallback called');
    
    try {
      // 1. I-save ang current clipboard
      let originalClipboard = '';
      try {
        originalClipboard = await navigator.clipboard.readText();
        console.log('✅ Original clipboard saved');
      } catch (err) {
        console.log('⚠️ Cannot read clipboard, continuing anyway');
      }

      // 2. I-delete ang shortcut
      const el = FieldDetector.getDeepActiveElement();
      if (el) {
        if (this.selectTextBackwards(el, shortcut.length)) {
          document.execCommand("delete");
          console.log('✅ Shortcut deleted');
        }
      }

      // 3. Write replacement sa clipboard
      await navigator.clipboard.writeText(replacement);
      console.log('✅ Replacement written to clipboard');

      // 4. Paste
      document.execCommand("paste");
      console.log('✅ Paste executed');

      // 5. I-restore ang original clipboard (kung meron)
      if (originalClipboard) {
        setTimeout(async () => {
          try {
            await navigator.clipboard.writeText(originalClipboard);
            console.log('✅ Original clipboard restored');
          } catch (err) {
            console.warn('⚠️ Cannot restore clipboard:', err);
          }
        }, 200);
      }
      
      return true;
    } catch (err) {
      console.warn('❌ Clipboard fallback failed:', err);
      return false;
    }
  },

  selectTextBackwards(element, length) {
    if (["input", "textarea"].includes(element.tagName.toLowerCase())) {
      const start = element.selectionStart;
      if (start >= length) {
        element.setSelectionRange(start - length, start);
        return true;
      }
    } else if (element.isContentEditable) {
      const sel = window.getSelection();
      if (!sel.rangeCount) return false;
      const range = sel.getRangeAt(0);

      if (sel.modify) {
        for (let i = 0; i < length; i++) {
          sel.modify("extend", "backward", "character");
        }
        return true;
      }
    }
    return false;
  },

  triggerInputEvents(element) {
    try {
      const inputEvent = new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertReplacementText",
        data: null,
      });
      element.dispatchEvent(inputEvent);
    } catch (e) {
      const fallbackInput = new Event("input", { bubbles: true, cancelable: true });
      element.dispatchEvent(fallbackInput);
    }

    const changeEvent = new Event("change", { bubbles: true, cancelable: true });
    element.dispatchEvent(changeEvent);

    const keyupEvent = new Event("keyup", { bubbles: true, cancelable: true });
    element.dispatchEvent(keyupEvent);
  }
};

// ==========================================
// 4. Main Orchestrator
// ==========================================
const TypiPat = {
  shortcuts: {},
  sortedKeys: [],
  isReplacing: false,

  init() {
  this.loadShortcuts();

  TypiStorage.onChanged((data) => {
    this.updateShortcuts(data);
  });

  // 🔥 PARA SA GMAIL (SPA)
  if (window.location.hostname.includes('mail.google.com')) {
    console.log('📧 Gmail detected, setting up SPA listeners...');
    
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('🔄 Gmail navigation detected, re-attaching listeners...');
        this.setupListeners();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // 🔥 TUMAWAG SA setupListeners()
  this.setupListeners();
},

// ==========================================
// SETUP LISTENERS
// ==========================================
setupListeners() {
  console.log('🎵 Setting up TypiPat listeners...');
  
  // 🔥 I-SKIP ANG MGA CHROME PAGES
  if (window.location.protocol === 'chrome:') {
    console.log('⏭️ Skipping setup on chrome:// page');
    return;
  }
  
  document.addEventListener("input", this.handleInput.bind(this), true);

  document.addEventListener("focusin", (e) => {
    const element = e.target;
    if (this.isTextField(element)) {
      element.addEventListener("input", this.handleInput.bind(this), true);
      
      if (element.isContentEditable) {
        element.addEventListener("keyup", this.handleInput.bind(this), true);
        element.addEventListener("keydown", this.handleInput.bind(this), true);
      }
    }
  }, true);

  this.attachToTinyMCE();
  this.observeDynamicFields();

  if (window === window.top) {
    this.observeIframes();
  }
},

// ==========================================
// ATTACH TO TINYMCE
// ==========================================
attachToTinyMCE() {
  // 🔥 I-SKIP ANG MGA CHROME PAGES (newtab, settings, etc.)
  if (window.location.protocol === 'chrome:') {
    console.log('⏭️ Skipping TinyMCE on chrome:// page');
    return;
  }
  
  console.log('🔍 Looking for TinyMCE...');
  
  setTimeout(() => {
    try {
      let editor = null;
      
      if (window.tinymce && window.tinymce.activeEditor) {
        editor = window.tinymce.activeEditor;
      } else if (window.parent && window.parent !== window) {
        // 🔥 I-WRAP SA TRY-CATCH PARA MAIWASAN ANG CROSS-ORIGIN ERROR
        try {
          if (window.parent.tinymce && window.parent.tinymce.activeEditor) {
            editor = window.parent.tinymce.activeEditor;
          }
        } catch (e) {
          // Cross-origin parent - i-skip lang
          console.log('⏭️ Cannot access parent.tinymce (cross-origin)');
        }
      }
      
      if (editor) {
        console.log('✅ TinyMCE editor found');
        const editorBody = editor.getBody();
        if (editorBody) {
          editorBody.addEventListener('input', this.handleInput.bind(this), true);
          editorBody.addEventListener('keyup', this.handleInput.bind(this), true);
          editorBody.addEventListener('keydown', this.handleInput.bind(this), true);
          
          editor.on('input', () => {
            this.handleInput({ target: editorBody, type: 'input' });
          });
          
          console.log('✅ TinyMCE listeners attached');
        }
      }
    } catch (err) {
      console.warn('⚠️ TinyMCE error:', err.message || err);
    }
  }, 500);
},

// ==========================================
// OBSERVE DYNAMIC FIELDS
// ==========================================
observeDynamicFields() {
  const targetNode = document.body;
  const config = {
    childList: true,
    subtree: true,
    attributes: false,
  };

  const callback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'IFRAME') return;
          
          if (this.isTextField(node)) {
            if (node.isContentEditable && !node._hasTypiPatListener) {
              node.addEventListener("input", this.handleInput.bind(this), true);
              node._hasTypiPatListener = true;
            } else if (!node.isContentEditable) {
              node.addEventListener("input", this.handleInput.bind(this), true);
            }
          }
          if (node.querySelectorAll) {
            const inputs = node.querySelectorAll('input, textarea, [contenteditable="true"]');
            inputs.forEach((input) => {
              if (input.isContentEditable && !input._hasTypiPatListener) {
                input.addEventListener("input", this.handleInput.bind(this), true);
                input._hasTypiPatListener = true;
              } else if (!input.isContentEditable) {
                input.addEventListener("input", this.handleInput.bind(this), true);
              }
            });
          }
        });
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
  this.observer = observer;
},

// ==========================================
// OBSERVE IFRAMES
// ==========================================
observeIframes() {
  // 🔥 I-SKIP ANG MGA CHROME PAGES
  if (window.location.protocol === 'chrome:') {
    return;
  }
  
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    if (iframe.src && iframe.src.startsWith('chrome-extension://')) {
      return;
    }
    this.attachToIframe(iframe);
  });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'IFRAME') {
          if (node.src && node.src.startsWith('chrome-extension://')) {
            continue;
          }
          this.attachToIframe(node);
        }
        if (node.querySelectorAll) {
          const nestedIframes = node.querySelectorAll('iframe');
          nestedIframes.forEach((iframe) => {
            if (iframe.src && iframe.src.startsWith('chrome-extension://')) {
              return;
            }
            this.attachToIframe(iframe);
          });
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
},

// ==========================================
// ATTACH TO IFRAME
// ==========================================
attachToIframe(iframe) {
  if (iframe.src && iframe.src.startsWith('chrome-extension://')) {
    return;
  }

  try {
    iframe.addEventListener('load', () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        console.log('📄 Attaching to iframe:', iframe.src);

        const editableElements = doc.querySelectorAll(
          'input, textarea, [contenteditable="true"]'
        );
        
        editableElements.forEach((el) => {
          el.addEventListener('input', this.handleInput.bind(this), true);
          console.log('✅ Attached listener to:', el.tagName);
        });

        doc.addEventListener('focusin', (e) => {
          const target = e.target;
          if (this.isTextField(target)) {
            target.addEventListener('input', this.handleInput.bind(this), true);
          }
        }, true);

        const innerObserver = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (this.isTextField(node)) {
                node.addEventListener('input', this.handleInput.bind(this), true);
              }
              if (node.querySelectorAll) {
                const inputs = node.querySelectorAll(
                  'input, textarea, [contenteditable="true"]'
                );
                inputs.forEach((el) => {
                  el.addEventListener('input', this.handleInput.bind(this), true);
                });
              }
            }
          }
        });

        if (doc.body) {
          innerObserver.observe(doc.body, {
            childList: true,
            subtree: true
          });
        }

      } catch (err) {
        console.log('⚠️ Cannot access iframe content (cross-origin):', iframe.src);
      }
    });
  } catch (err) {
    // Silent fail
  }
},

  isTextField(element) {
    if (!element) return false;
    const tag = element.tagName ? element.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea') return true;
    if (element.isContentEditable) return true;
    return false;
  },

  loadShortcuts() {
    TypiStorage.loadAll().then((data) => {
      this.updateShortcuts(data);
    });
  },

  updateShortcuts(data) {
    this.shortcuts = {};
    for (let key in data) {
      if (!key.startsWith("__label__") && !key.startsWith("__meta__")) {
        this.shortcuts[key] = data[key];
      }
    }
    this.sortedKeys = Object.keys(this.shortcuts).sort((a, b) => b.length - a.length);
  },

  handleInput(e) {
    if (this.isReplacing) return;

    const path = e.composedPath ? e.composedPath() : [];
    const element = path.length > 0 ? path[0] : e.target;
    const fieldType = FieldDetector.getFieldType(element);

    if (fieldType === "password" || fieldType === "readonly" || fieldType === "unknown") {
      return;
    }

    const context = this.getTextContext(element, fieldType);
    if (!context) return;

    const { textBeforeCursor } = context;

    for (let shortcut of this.sortedKeys) {
      if (textBeforeCursor.endsWith(shortcut)) {
        if (!this.isWordBoundary(textBeforeCursor, shortcut)) {
          continue;
        }

        const replacement = this.shortcuts[shortcut];

        this.isReplacing = true;
        try {
          SnippetExpander.expand(element, shortcut, replacement, fieldType);
        } catch (err) {
          // Silent fail
        } finally {
          setTimeout(() => {
            this.isReplacing = false;
          }, 150);
        }
        break;
      }
    }
  },

  getTextContext(element, fieldType) {
    try {
      if (fieldType === "input" || fieldType === "textarea") {
        return {
          textBeforeCursor: element.value.substring(0, element.selectionStart),
        };
      } else if (fieldType === "contentEditable") {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const node = range.endContainer;
          const offset = range.endOffset;

          if (node.nodeType === Node.TEXT_NODE) {
            return {
              textBeforeCursor: node.textContent.substring(0, offset),
            };
          }
          return null;
        }
      }
    } catch (err) {
      return null;
    }
    return null;
  },

  isWordBoundary(text, shortcut) {
    const beforeIndex = text.length - shortcut.length - 1;
    if (beforeIndex < 0) return true;

    const charBefore = text.charAt(beforeIndex);
    return !/[A-Za-z0-9_]/.test(charBefore);
  },
};

// Initialize
TypiPat.init();

// ==========================================
// 5. Floating UI Injection
// ==========================================
const FloatingUI = {
  container: null,
  iframe: null,
  icon: null,
  visible: false,
  isDragging: false,
  startY: 0,
  startTop: 0,
  hasMoved: false,

  init() {
    if (window !== window.top) return;
    this.createButton();
    this.createOverlay();

    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === "toggleOverlay") {
        this.toggleOverlay();
      }
    });

    document.addEventListener("click", (e) => {
      if (this.visible && this.iframe && !this.iframe.contains(e.target) &&
          this.container && !this.container.contains(e.target)) {
        this.closeOverlay();
      }
    });
  },

  createButton() {
    const container = document.createElement("div");
    container.id = "typipat-fab-container";

    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("iPat.png");
    img.className = "typipat-fab-icon";

    container.appendChild(img);
    document.body.appendChild(container);

    container.onclick = (e) => {
      e.stopPropagation();
      if (!this.hasMoved) {
        this.toggleOverlay();
      }
    };

    container.ondblclick = (e) => {
      e.stopPropagation();
      try {
        if (chrome.runtime?.id) {
          chrome.runtime.sendMessage({ action: "openOptions" });
        }
      } catch (err) {}
    };

    container.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (chrome.runtime?.id) {
          chrome.runtime.sendMessage({ action: "openOptions" });
        }
      } catch (err) {}
    };

    this.container = container;
    this.icon = img;
    this.initDrag(container);
  },

  createOverlay() {
    const iframe = document.createElement("iframe");
    iframe.id = "typipat-overlay";
    iframe.src = chrome.runtime.getURL("popup.html");
    iframe.allow = "clipboard-read; clipboard-write";

    document.body.appendChild(iframe);
    this.iframe = iframe;
  },

  initDrag(element) {
    const startDrag = (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.hasMoved = false;
      this.startY = e.clientY;
      const rect = element.getBoundingClientRect();
      this.startTop = rect.top;
      element.style.transition = "none";
      e.preventDefault();
    };

    const doDrag = (e) => {
      if (!this.isDragging) return;
      const deltaY = e.clientY - this.startY;
      if (Math.abs(deltaY) > 5) {
        this.hasMoved = true;
      }
      const newTop = this.startTop + deltaY;
      element.style.top = `${newTop}px`;
    };

    const stopDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      element.style.transition = "";
    };

    element.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  },

  toggleOverlay() {
    this.visible = !this.visible;
    if (this.visible) {
      this.iframe.classList.add("visible");
      this.container.style.display = "none";
    } else {
      this.closeOverlay();
    }
  },

  closeOverlay() {
    this.visible = false;
    this.iframe.classList.remove("visible");
    this.container.style.display = "flex";
  },
};

// Initialize FloatingUI
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => FloatingUI.init());
} else {
  FloatingUI.init();
}
