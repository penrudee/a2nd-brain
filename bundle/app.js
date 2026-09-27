// ==========================================
// A2ND Brain - Application Core Logic
// Integrated: Backlinks, Auto Keyword Linker, & RAG Cross-Referencing Engine
// ==========================================

import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

// Anna Host connection
let anna = null;

let selectedText = '';
let selectedRange = { start: 0, end: 0 };

// Undo / Redo History State
let historyStack = [];
let historyIndex = -1;
const maxHistory = 30;

// Wikilink Suggestion Popup State
let wikilinkDropdown = null;
let activeWikilinkIndex = 0;

// Auto-format & RAG Debounce State
let autoFormatDebounce;
let ragSuggestDebounce;
let lastAutoFormattedContent = '';
const AUTO_FORMAT_IDLE_MS = 3500; // รอผู้ใช้หยุดพิมพ์ 3.5 วิ
const AUTO_FORMAT_MIN_LENGTH = 30;

// ------------------------------------------
// PARA Folder System
// ------------------------------------------
const FOLDERS = [
  { id: 'projects', label: '01 Projects', icon: '📁', hint: 'มีเป้าหมายชัดเจน + มีวันสิ้นสุด' },
  { id: 'areas', label: '02 Areas', icon: '📁', hint: 'มาตรฐานชีวิตที่ต้องดูแลต่อเนื่อง' },
  { id: 'resources', label: '03 Resources', icon: '📁', hint: 'คลังความรู้/หัวข้อที่สนใจ' },
  { id: 'archives', label: '04 Archives', icon: '📁', hint: 'ข้อมูลที่เสร็จแล้วหรือเก็บเข้ากรุ' }
];
const INBOX_FOLDER = { id: 'inbox', label: '00 Inbox', icon: '📥', hint: 'โน้ตที่ยังไม่ได้จัดหมวดหมู่' };

let expandedFolders = new Set([INBOX_FOLDER.id, ...FOLDERS.map(f => f.id)]);

// UI Elements
let folderSelect = null;
let btnExportVault = null;

// DOM Elements
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const saveStatus = document.getElementById('save-status');

const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');

const contextBar = document.getElementById('selected-context-bar');
const contextPreviewText = document.getElementById('context-preview-text');
const btnClearContext = document.getElementById('btn-clear-context');

const chatHistoryContainer = document.getElementById('ai-chat-history');
const aiInput = document.getElementById('ai-input');
const btnSendAi = document.getElementById('btn-send-ai');
const btnNewNote = document.getElementById('btn-new-note');
const folderTree = document.getElementById('folder-tree');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    anna = await AnnaAppRuntime.connect();
  } catch (e) {
    console.error('AnnaAppRuntime.connect() failed:', e);
  }

  injectStyles();
  ensureFolderSelectUI();
  ensureExportButtonUI();
  initEventListeners();
  await loadNotesList();
  await renderBacklinksUI();
  await runRAGCrossReferencing(); // รันการค้นหาความเชื่อมโยงเมื่อเปิดแอป
});

// CSS ตกแต่ง UI สำหรับ Backlinks & RAG Cross-referencing Panel
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .note-folder-select {
      display: block;
      margin: 6px 0 10px 0;
      padding: 4px 8px;
      font-size: 12px;
      background: transparent;
      color: inherit;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 4px;
    }
    .btn-export-vault {
      width: 100%;
      margin-top: 6px;
      padding: 8px 10px;
      font-size: 13px;
      cursor: pointer;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
      color: inherit;
    }
    .btn-export-vault:hover { background: rgba(255,255,255,0.1); }
    .btn-export-vault:disabled { opacity: 0.6; cursor: not-allowed; }
    .folder-group { margin-bottom: 4px; }
    .folder-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 4px;
      cursor: pointer;
      font-size: 13px;
      border-radius: 4px;
      user-select: none;
    }
    .folder-header:hover { background: rgba(255,255,255,0.06); }
    .folder-count { opacity: 0.6; font-size: 11px; margin-left: auto; }
    .folder-empty { padding-left: 24px; font-size: 12px; opacity: 0.5; }
    .folder-group .note-item { padding-left: 20px; }

    /* Sidebar Connections (Backlinks & RAG) */
    .connections-container {
      margin-top: 16px;
      padding-top: 8px;
    }
    .section-divider {
      border: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin: 12px 0;
    }
    .backlink-item, .rag-suggestion-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 6px 8px;
      font-size: 12px;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.2s;
      margin-bottom: 4px;
      background: rgba(255,255,255,0.02);
    }
    .backlink-item:hover, .rag-suggestion-item:hover {
      background: rgba(138, 180, 248, 0.15);
      color: #fff;
    }
    .rag-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 500;
    }
    .rag-reason {
      font-size: 10px;
      opacity: 0.75;
      line-height: 1.3;
    }
    .btn-insert-link {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.1);
      color: #fff;
      cursor: pointer;
    }
    .btn-insert-link:hover {
      background: var(--accent-color, #4f46e5);
    }
  `;
  document.head.appendChild(style);
}

function ensureFolderSelectUI() {
  if (folderSelect) return;
  folderSelect = document.createElement('select');
  folderSelect.id = 'note-folder-select';
  folderSelect.className = 'note-folder-select';
  folderSelect.title = 'เลือกหมวดหมู่ PARA ของโน้ตนี้';
  folderSelect.innerHTML = [
    `<option value="">${INBOX_FOLDER.icon} ${INBOX_FOLDER.label}</option>`,
    ...FOLDERS.map(f => `<option value="${f.id}">${f.icon} ${f.label}</option>`)
  ].join('');

  folderSelect.addEventListener('change', async () => {
    await setCurrentNoteFolder(folderSelect.value || null);
  });

  if (noteTitleInput && noteTitleInput.parentElement) {
    noteTitleInput.parentElement.insertBefore(folderSelect, noteTitleInput.nextSibling);
  }
}

function ensureExportButtonUI() {
  if (btnExportVault) return;
  btnExportVault = document.createElement('button');
  btnExportVault.id = 'btn-export-vault';
  btnExportVault.className = 'btn-export-vault';
  btnExportVault.textContent = '⬇️ สำรองข้อมูลทั้งหมด (.zip)';
  btnExportVault.addEventListener('click', exportVaultAsZip);

  if (btnNewNote && btnNewNote.parentElement) {
    btnNewNote.parentElement.insertBefore(btnExportVault, btnNewNote.nextSibling);
  }
}

function initEventListeners() {
  let saveTimeout;
  let historyDebounce;

  const triggerAutoSave = () => {
    saveStatus.textContent = '⏳ กำลังบันทึก...';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      await saveCurrentNote();
      saveStatus.textContent = '✓ บันทึกแล้ว';
      await loadNotesList();
      await renderBacklinksUI();
    }, 800);
  };

  noteContentInput.addEventListener('input', (e) => {
    triggerAutoSave();
    
    clearTimeout(historyDebounce);
    historyDebounce = setTimeout(() => {
      saveState(noteContentInput.value);
    }, 400);

    handleWikilinkInput(e);

    // หน่วงเวลาสำหรับ RAG Cross-referencing และ Auto-linking
    clearTimeout(autoFormatDebounce);
    autoFormatDebounce = setTimeout(async () => {
      await autoLinkKeywordsInContent();
      await autoFormatNoteWithAI();
      await runRAGCrossReferencing(); // ค้นหาความเชื่อมโยงข้ามโน้ตอัตโนมัติ
    }, AUTO_FORMAT_IDLE_MS);
  });

  noteTitleInput.addEventListener('input', triggerAutoSave);

  if (btnUndo) btnUndo.addEventListener('click', undo);
  if (btnRedo) btnRedo.addEventListener('click', redo);

  noteContentInput.addEventListener('select', updateSelectionContext);
  noteContentInput.addEventListener('keyup', (e) => {
    updateSelectionContext();
    handleWikilinkKeydown(e);
  });
  noteContentInput.addEventListener('mouseup', updateSelectionContext);

  btnClearContext.addEventListener('click', clearSelectionContext);

  btnSendAi.addEventListener('click', handleSendToAI);
  aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendToAI();
  });

  btnNewNote.addEventListener('click', createNewNote);

  document.addEventListener('click', (e) => {
    if (wikilinkDropdown && !wikilinkDropdown.contains(e.target) && e.target !== noteContentInput) {
      removeWikilinkDropdown();
    }
  });
}

// ------------------------------------------
// Undo / Redo History Logic
// ------------------------------------------
function saveState(content) {
  if (historyIndex >= 0 && historyStack[historyIndex] === content) return;
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(content);

  if (historyStack.length > maxHistory) {
    historyStack.shift();
  } else {
    historyIndex++;
  }
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (btnUndo) btnUndo.disabled = historyIndex <= 0;
  if (btnRedo) btnRedo.disabled = historyIndex >= historyStack.length - 1;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    noteContentInput.value = historyStack[historyIndex];
    saveCurrentNote();
    updateUndoRedoButtons();
    renderBacklinksUI();
  }
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    noteContentInput.value = historyStack[historyIndex];
    saveCurrentNote();
    updateUndoRedoButtons();
    renderBacklinksUI();
  }
}

// ------------------------------------------
// Storage & Note Management
// ------------------------------------------
async function getNotesFromStorage() {
  const annaStorage = anna?.storage;
  if (annaStorage && typeof annaStorage.get === 'function') {
    try {
      const result = await annaStorage.get({ key: 'a2nd_notes_list' });
      const data = typeof result === 'string' ? result : result?.value;
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Storage get error:', e);
      return [];
    }
  }
  return JSON.parse(localStorage.getItem('a2nd_notes_list') || '[]');
}

async function saveNotesToStorage(notes) {
  const annaStorage = anna?.storage;
  if (annaStorage && typeof annaStorage.set === 'function') {
    try {
      await annaStorage.set({ key: 'a2nd_notes_list', value: JSON.stringify(notes) });
    } catch (e) {
      console.error('Storage set error:', e);
    }
  } else {
    localStorage.setItem('a2nd_notes_list', JSON.stringify(notes));
  }
}

async function saveCurrentNote() {
  const notes = await getNotesFromStorage();
  const currentId = noteTitleInput.dataset.noteId || Date.now().toString();
  noteTitleInput.dataset.noteId = currentId;

  const existingIndex = notes.findIndex(n => n.id === currentId);
  const existingFolder = existingIndex >= 0
    ? (notes[existingIndex].folder || null)
    : (folderSelect ? (folderSelect.value || null) : null);

  const updatedNote = {
    id: currentId,
    title: noteTitleInput.value || 'โน้ตไม่มีชื่อ',
    content: noteContentInput.value,
    folder: existingFolder,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    notes[existingIndex] = updatedNote;
  } else {
    notes.unshift(updatedNote);
  }

  await saveNotesToStorage(notes);
}

async function setCurrentNoteFolder(folderId) {
  const notes = await getNotesFromStorage();
  const currentId = noteTitleInput.dataset.noteId;
  const idx = notes.findIndex(n => n.id === currentId);
  if (idx === -1) return;

  notes[idx].folder = folderId || null;
  notes[idx].updatedAt = new Date().toISOString();
  await saveNotesToStorage(notes);
  await loadNotesList();
}

async function loadNotesList() {
  const notes = await getNotesFromStorage();
  folderTree.innerHTML = '<p class="section-title">โครงสร้างสมองของคุณ</p>';

  if (notes.length === 0) {
    folderTree.innerHTML += '<p class="empty-msg">ยังไม่มีโน้ต</p>';
    return;
  }

  const currentId = noteTitleInput.dataset.noteId;
  const validFolderIds = new Set(FOLDERS.map(f => f.id));
  const groups = { inbox: [] };
  FOLDERS.forEach(f => { groups[f.id] = []; });

  notes.forEach(note => {
    const key = validFolderIds.has(note.folder) ? note.folder : 'inbox';
    groups[key].push(note);
  });

  const allFolderDefs = [INBOX_FOLDER, ...FOLDERS];

  allFolderDefs.forEach(folderDef => {
    const notesInFolder = groups[folderDef.id] || [];
    const isExpanded = expandedFolders.has(folderDef.id);

    const folderEl = document.createElement('div');
    folderEl.className = 'folder-group';

    const folderHeader = document.createElement('div');
    folderHeader.className = 'folder-header';
    folderHeader.title = folderDef.hint || '';
    folderHeader.innerHTML = `
      <span class="folder-toggle">${isExpanded ? '▾' : '▸'}</span>
      <span class="folder-icon">${folderDef.icon}</span>
      <span class="folder-label">${folderDef.label}</span>
      <span class="folder-count">(${notesInFolder.length})</span>
    `;
    folderHeader.addEventListener('click', () => {
      if (expandedFolders.has(folderDef.id)) {
        expandedFolders.delete(folderDef.id);
      } else {
        expandedFolders.add(folderDef.id);
      }
      loadNotesList();
    });
    folderEl.appendChild(folderHeader);

    if (isExpanded) {
      if (notesInFolder.length === 0) {
        const emptyItem = document.createElement('p');
        emptyItem.className = 'empty-msg folder-empty';
        emptyItem.textContent = '— ว่างเปล่า —';
        folderEl.appendChild(emptyItem);
      } else {
        notesInFolder.forEach(note => {
          const item = document.createElement('div');
          item.classList.add('note-item');
          if (note.id === currentId) item.classList.add('active');

          item.innerHTML = `
            <span class="note-item-title">📄 ${note.title || 'โน้ตไม่มีชื่อ'}</span>
            <button class="btn-delete-note" title="ลบโน้ต">✕</button>
          `;

          item.querySelector('.note-item-title').addEventListener('click', () => switchNote(note));
          item.querySelector('.btn-delete-note').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(note.id);
          });

          folderEl.appendChild(item);
        });
      }
    }

    folderTree.appendChild(folderEl);
  });
}

async function switchNote(note) {
  noteTitleInput.dataset.noteId = note.id;
  noteTitleInput.value = note.title;
  noteContentInput.value = note.content;
  
  historyStack = [note.content];
  historyIndex = 0;
  updateUndoRedoButtons();

  clearTimeout(autoFormatDebounce);
  lastAutoFormattedContent = note.content;

  if (folderSelect) folderSelect.value = note.folder || '';

  clearSelectionContext();
  removeWikilinkDropdown();
  saveStatus.textContent = '✓ บันทึกแล้ว';
  await loadNotesList();
  await renderBacklinksUI();
  await runRAGCrossReferencing();
}

async function createNewNote() {
  const newNote = {
    id: Date.now().toString(),
    title: 'โน้ตใหม่',
    content: '',
    folder: null,
    updatedAt: new Date().toISOString()
  };
  await switchNote(newNote);
  await saveCurrentNote();
}

async function deleteNote(id) {
  let notes = await getNotesFromStorage();
  notes = notes.filter(n => n.id !== id);
  await saveNotesToStorage(notes);
  
  if (noteTitleInput.dataset.noteId === id) {
    if (notes.length > 0) {
      await switchNote(notes[0]);
    } else {
      await createNewNote();
    }
  } else {
    await loadNotesList();
    await renderBacklinksUI();
  }
}

// ------------------------------------------
// Selection Context
// ------------------------------------------
function updateSelectionContext() {
  const start = noteContentInput.selectionStart;
  const end = noteContentInput.selectionEnd;

  if (start !== end) {
    selectedText = noteContentInput.value.substring(start, end).trim();
    selectedRange = { start, end };
    if (selectedText.length > 0) {
      contextPreviewText.textContent = `"${selectedText}"`;
      contextBar.classList.remove('hidden');
      return;
    }
  }
}

function clearSelectionContext() {
  selectedText = '';
  selectedRange = { start: 0, end: 0 };
  contextBar.classList.add('hidden');
}

// ------------------------------------------
// Wikilinks Auto-complete (`[[`)
// ------------------------------------------
async function handleWikilinkInput(e) {
  const cursorPos = noteContentInput.selectionStart;
  const textBeforeCursor = noteContentInput.value.substring(0, cursorPos);
  
  const openBracketIndex = textBeforeCursor.lastIndexOf('[[');
  if (openBracketIndex !== -1) {
    const query = textBeforeCursor.substring(openBracketIndex + 2);
    if (!query.includes(']]') && !query.includes('\n')) {
      const allNotes = await getNotesFromStorage();
      const currentNoteId = noteTitleInput.dataset.noteId;
      
      const filteredNotes = allNotes.filter(n => 
        n.id !== currentNoteId && 
        n.title.toLowerCase().includes(query.toLowerCase())
      );

      showWikilinkDropdown(filteredNotes, openBracketIndex, query);
      return;
    }
  }
  removeWikilinkDropdown();
}

function showWikilinkDropdown(notes, openIndex, query) {
  removeWikilinkDropdown();
  if (notes.length === 0) return;

  wikilinkDropdown = document.createElement('div');
  wikilinkDropdown.className = 'wikilink-dropdown';

  notes.forEach((note, index) => {
    const item = document.createElement('div');
    item.className = `wikilink-dropdown-item ${index === 0 ? 'selected' : ''}`;
    item.innerHTML = `🔗 <strong>${note.title}</strong>`;
    item.addEventListener('click', () => insertWikilink(note.title, openIndex));
    wikilinkDropdown.appendChild(item);
  });

  const parent = noteContentInput.parentElement;
  parent.style.position = 'relative';
  parent.appendChild(wikilinkDropdown);
  activeWikilinkIndex = 0;
}

function handleWikilinkKeydown(e) {
  if (!wikilinkDropdown) return;

  const items = wikilinkDropdown.querySelectorAll('.wikilink-dropdown-item');
  if (items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items[activeWikilinkIndex].classList.remove('selected');
    activeWikilinkIndex = (activeWikilinkIndex + 1) % items.length;
    items[activeWikilinkIndex].classList.add('selected');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    items[activeWikilinkIndex].classList.remove('selected');
    activeWikilinkIndex = (activeWikilinkIndex - 1 + items.length) % items.length;
    items[activeWikilinkIndex].classList.add('selected');
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    const selectedTitle = items[activeWikilinkIndex].textContent.replace('🔗 ', '').trim();
    const textBeforeCursor = noteContentInput.value.substring(0, noteContentInput.selectionStart);
    const openIndex = textBeforeCursor.lastIndexOf('[[');
    insertWikilink(selectedTitle, openIndex);
  } else if (e.key === 'Escape') {
    removeWikilinkDropdown();
  }
}

function insertWikilink(title, openIndex = null) {
  if (openIndex !== null) {
    const currentContent = noteContentInput.value;
    const closeIndex = noteContentInput.selectionStart;
    
    const before = currentContent.substring(0, openIndex);
    const after = currentContent.substring(closeIndex);
    
    const insertedText = `[[${title}]] `;
    noteContentInput.value = before + insertedText + after;
    
    const newCursorPos = openIndex + insertedText.length;
    noteContentInput.setSelectionRange(newCursorPos, newCursorPos);
  } else {
    // กรณีต่อท้ายเนื้อหา
    saveState(noteContentInput.value);
    noteContentInput.value += `\n\n[[${title}]]`;
    saveState(noteContentInput.value);
  }

  noteContentInput.focus();
  removeWikilinkDropdown();
  saveCurrentNote();
}

function removeWikilinkDropdown() {
  if (wikilinkDropdown) {
    wikilinkDropdown.remove();
    wikilinkDropdown = null;
  }
}

// ------------------------------------------
// Backlinks Engine
// ------------------------------------------
async function getBacklinksForNote(targetTitle) {
  if (!targetTitle || targetTitle === 'โน้ตไม่มีชื่อ') return [];
  
  const allNotes = await getNotesFromStorage();
  const currentId = noteTitleInput.dataset.noteId;
  const escapedTitle = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wikilinkRegex = new RegExp(`\\[\\[${escapedTitle}\\]\\]`, 'i');

  return allNotes.filter(note => {
    if (note.id === currentId) return false;
    return wikilinkRegex.test(note.content || '');
  });
}

async function renderBacklinksUI() {
  let backlinksContainer = document.getElementById('backlinks-container');
  
  if (!backlinksContainer) {
    backlinksContainer = document.createElement('div');
    backlinksContainer.id = 'backlinks-container';
    backlinksContainer.className = 'connections-container';
    if (folderTree && folderTree.parentElement) {
      folderTree.parentElement.appendChild(backlinksContainer);
    }
  }

  const currentTitle = noteTitleInput.value;
  const backlinks = await getBacklinksForNote(currentTitle);

  backlinksContainer.innerHTML = `
    <hr class="section-divider" />
    <p class="section-title">🔗 Backlinks (${backlinks.length})</p>
    <div class="backlinks-list">
      ${
        backlinks.length === 0
          ? '<p class="empty-msg">ไม่มีโน้ตอื่นที่เชื่อมโยงมายังโน้ตนี้</p>'
          : backlinks.map(bNote => `
              <div class="backlink-item" data-id="${bNote.id}">
                <span class="backlink-title">👈 ${bNote.title || 'โน้ตไม่มีชื่อ'}</span>
              </div>
            `).join('')
      }
    </div>
    <div id="rag-suggestions-wrapper"></div>
  `;

  backlinksContainer.querySelectorAll('.backlink-item').forEach(item => {
    item.addEventListener('click', async () => {
      const allNotes = await getNotesFromStorage();
      const targetNote = allNotes.find(n => n.id === item.dataset.id);
      if (targetNote) switchNote(targetNote);
    });
  });
}

// ------------------------------------------
// RAG & Cross-Referencing Engine (Semantic Connections)
// ------------------------------------------
async function runRAGCrossReferencing() {
  const currentContent = noteContentInput.value.trim();
  const currentTitle = noteTitleInput.value.trim();
  const currentId = noteTitleInput.dataset.noteId;

  const wrapper = document.getElementById('rag-suggestions-wrapper');
  if (!wrapper) return;

  if (currentContent.length < AUTO_FORMAT_MIN_LENGTH) {
    wrapper.innerHTML = '';
    return;
  }

  const allNotes = await getNotesFromStorage();
  const otherNotes = allNotes.filter(n => n.id !== currentId && n.content.trim().length > 0);

  if (otherNotes.length === 0) {
    wrapper.innerHTML = '';
    return;
  }

  // สร้าง Context Vault ย่อๆ ส่งให้ LLM วิเคราะห์ความสัมพันธ์แบบ RAG
  const notesContext = otherNotes.map(n => ({
    title: n.title,
    snippet: n.content.substring(0, 180)
  }));

  const prompt = `
    คุณคือ RAG Cross-Referencing Engine สำหรับระบบจัดการความรู้ Second Brain
    หน้าที่ของคุณ: วิเคราะห์โน้ตปัจจุบัน แล้วเปรียบเทียบกับโน้ตอื่นๆ ใน Vault เพื่อค้นหาโน้ตที่มีความเชื่อมโยงเชิงความหมายหรือไอเดีย (Cross-referencing)

    โน้ตปัจจุบัน (${currentTitle}):
    """
    ${currentContent}
    """

    คลังโน้ตที่มีอยู่ทั้งหมด:
    ${JSON.stringify(notesContext)}

    คำสั่ง:
    - เลือกโน้ตที่มีเนื้อหาเกี่ยวข้องกันหรือต่อยอดกันได้มากที่สุด 1-3 โน้ต
    - ตอบกลับเฉพาะรูปแบบ JSON Array เท่านั้น ห้ามใส่ข้อความอื่นหรือ markdown code fence
    - โครงสร้าง JSON:
    [
      { "title": "ชื่อโน้ตที่เกี่ยวข้อง", "reason": "เหตุผลสั้นๆ ไม่เกิน 1 ประโยคว่าเกี่ยวข้องกันอย่างไร" }
    ]
  `;

  try {
    const annaLLM = anna?.llm;
    if (!annaLLM || typeof annaLLM.complete !== 'function') return;

    const response = await annaLLM.complete({
      messages: [{ role: 'user', content: prompt }]
    });

    const rawResult = parseLLMResponse(response).trim();
    // ทำความสะอาด JSON จาก LLM
    const cleanJsonStr = rawResult.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const suggestions = JSON.parse(cleanJsonStr);

    if (Array.isArray(suggestions) && suggestions.length > 0) {
      wrapper.innerHTML = `
        <hr class="section-divider" />
        <p class="section-title">💡 ไอเดียที่เกี่ยวข้อง (RAG Suggest)</p>
        <div class="rag-list">
          ${suggestions.map(item => `
            <div class="rag-suggestion-item">
              <div class="rag-item-header">
                <span>🧠 [[${item.title}]]</span>
                <button class="btn-insert-link" data-title="${item.title}">+ แทรก</button>
              </div>
              <div class="rag-reason">${item.reason}</div>
            </div>
          `).join('')}
        </div>
      `;

      wrapper.querySelectorAll('.btn-insert-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          insertWikilink(btn.dataset.title);
        });
      });

      wrapper.querySelectorAll('.rag-suggestion-item').forEach(item => {
        item.addEventListener('click', async () => {
          const targetTitle = item.querySelector('.btn-insert-link').dataset.title;
          const targetNote = allNotes.find(n => n.title === targetTitle);
          if (targetNote) switchNote(targetNote);
        });
      });
    } else {
      wrapper.innerHTML = '';
    }
  } catch (err) {
    console.warn('RAG Cross-referencing skipped:', err);
  }
}

// ------------------------------------------
// Deterministic Auto Keyword Linking Engine
// ------------------------------------------
async function autoLinkKeywordsInContent() {
  const currentContent = noteContentInput.value;
  if (!currentContent.trim()) return;

  const allNotes = await getNotesFromStorage();
  const currentId = noteTitleInput.dataset.noteId;

  const otherNotes = allNotes
    .filter(n => n.id !== currentId && n.title && n.title.trim().length > 1)
    .sort((a, b) => b.title.length - a.title.length);

  if (otherNotes.length === 0) return;

  let updatedContent = currentContent;

  otherNotes.forEach(note => {
    const title = note.title.trim();
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\[\\[)${escapedTitle}(?!\\]\\])`, 'g');
    updatedContent = updatedContent.replace(regex, `[[${title}]]`);
  });

  if (updatedContent !== currentContent) {
    saveState(noteContentInput.value);
    noteContentInput.value = updatedContent;
    saveState(updatedContent);
    await saveCurrentNote();
    saveStatus.textContent = '🔗 เชื่อมโยง Wikilink อัตโนมัติแล้ว';
  }
}

// ------------------------------------------
// AI Integration & Auto-Format
// ------------------------------------------
function appendChatBubble(sender, text, rawAiText = null) {
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', sender);
  bubble.textContent = text;

  if (sender === 'ai' && rawAiText) {
    const actionBox = document.createElement('div');
    actionBox.classList.add('ai-action-box');

    if (selectedText) {
      const btnReplace = document.createElement('button');
      btnReplace.className = 'ai-action-btn';
      btnReplace.innerHTML = '🔄 แทนที่ข้อความที่ไฮไลต์';
      btnReplace.onclick = () => applyToNote('replace', rawAiText);
      actionBox.appendChild(btnReplace);
    }

    const btnAppend = document.createElement('button');
    btnAppend.className = 'ai-action-btn';
    btnAppend.innerHTML = '➕ ต่อท้ายโน้ต';
    btnAppend.onclick = () => applyToNote('append', rawAiText);
    actionBox.appendChild(btnAppend);

    bubble.appendChild(actionBox);
  }

  chatHistoryContainer.appendChild(bubble);
  chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
  return bubble;
}

function applyToNote(mode, text) {
  saveState(noteContentInput.value);
  const currentContent = noteContentInput.value;

  if (mode === 'replace' && selectedRange.start !== selectedRange.end) {
    const before = currentContent.substring(0, selectedRange.start);
    const after = currentContent.substring(selectedRange.end);
    noteContentInput.value = before + text + after;
  } else if (mode === 'append') {
    noteContentInput.value = currentContent ? `${currentContent}\n\n${text}` : text;
  }

  saveState(noteContentInput.value);
  saveCurrentNote();
  saveStatus.textContent = '✓ บันทึกแล้ว';
  clearSelectionContext();
  renderBacklinksUI();
}

function parseLLMResponse(response) {
  if (typeof response === 'string') return response;
  const content = response?.content;

  if (content && typeof content === 'object' && !Array.isArray(content) && typeof content.text === 'string') {
    return content.text;
  }
  if (Array.isArray(content)) {
    return content.filter(block => block.type === 'text').map(block => block.text).join('\n');
  }
  if (typeof content === 'string') return content;
  if (typeof response?.text === 'string') return response.text;

  return JSON.stringify(response, null, 2);
}

async function autoFormatNoteWithAI() {
  const content = noteContentInput.value;
  if (!content.trim() || content.trim().length < AUTO_FORMAT_MIN_LENGTH) return;
  if (content === lastAutoFormattedContent) return;

  const annaLLM = anna?.llm;
  if (!annaLLM || typeof annaLLM.complete !== 'function') return;

  const currentNoteId = noteTitleInput.dataset.noteId;
  const allNotes = await getNotesFromStorage();
  const otherTitles = allNotes.filter(n => n.id !== currentNoteId).map(n => n.title);

  const prompt = `
    คุณคือ AI จัดระเบียบโน้ต Obsidian Second Brain
    หน้าที่: จัดรูปแบบโน้ตให้เป็น Markdown ที่อ่านง่าย และใส่ wikilink [[ชื่อโน้ต]] ในจุดที่พูดถึงหัวข้อตรงกับโน้ตอื่น
    รายชื่อโน้ตอื่น: ${JSON.stringify(otherTitles)}
    เนื้อหาโน้ตปัจจุบัน:
    """
    ${content}
    """
    กติกา: ส่งกลับเฉพาะเนื้อหาฉบับจัดรูปแบบแล้ว ห้ามใส่คำอธิบาย ห้ามใส่ markdown code fence
  `;

  try {
    const response = await annaLLM.complete({
      messages: [{ role: 'user', content: prompt }]
    });

    const formatted = parseLLMResponse(response).trim();
    if (!formatted || formatted === content.trim()) {
      lastAutoFormattedContent = content;
      return;
    }

    saveState(noteContentInput.value);
    noteContentInput.value = formatted;
    lastAutoFormattedContent = formatted;
    saveState(formatted);

    await saveCurrentNote();
    await loadNotesList();
    await renderBacklinksUI();
    saveStatus.textContent = '🪄 AI ปรับรูปแบบโน้ตให้อัตโนมัติแล้ว';
  } catch (err) {
    console.error('Auto-format AI error:', err);
  }
}

async function handleSendToAI() {
  const userMessage = aiInput.value.trim();
  if (!userMessage) return;

  appendChatBubble('user', userMessage);
  aiInput.value = '';

  const loadingBubble = appendChatBubble('ai', '🧠 AI กำลังวิเคราะห์...');

  try {
    let aiResponseText = '';
    let contextPrompt = selectedText ? `ข้อความที่ผู้ใช้ไฮไลต์: "${selectedText}"\n` : '';

    const prompt = `
      คุณคือ AI Architect ของแอปจัดการความรู้ A2ND Brain
      ${contextPrompt}
      หัวข้อโน้ตปัจจุบัน: "${noteTitleInput.value}"
      เนื้อหาโน้ตทั้งหมด: "${noteContentInput.value}"
      คำสั่งผู้ใช้: "${userMessage}"
    `;

    const annaLLM = anna?.llm;
    if (annaLLM && typeof annaLLM.complete === 'function') {
      const response = await annaLLM.complete({
        messages: [{ role: 'user', content: prompt }]
      });
      aiResponseText = parseLLMResponse(response);
    } else {
      aiResponseText = '⚠️ ไม่พบการเชื่อมต่อ Anna LLM API';
    }

    loadingBubble.remove();
    appendChatBubble('ai', aiResponseText, aiResponseText);
  } catch (error) {
    console.error('AI Error:', error);
    loadingBubble.textContent = 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI';
  }
}

// ------------------------------------------
// Export Vault As .zip
// ------------------------------------------
let _crc32Table = null;
function crc32(bytes) {
  if (!_crc32Table) {
    _crc32Table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      _crc32Table[n] = c >>> 0;
    }
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ _crc32Table[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function dosDateTime(date) {
  const dosTime = ((date.getHours() & 0x1F) << 11) | ((date.getMinutes() & 0x3F) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1F);
  const dosDate = (((date.getFullYear() - 1980) & 0x7F) << 9) | (((date.getMonth() + 1) & 0xF) << 5) | (date.getDate() & 0x1F);
  return { dosTime, dosDate };
}

function buildZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime(new Date());

  files.forEach(file => {
    const nameBytes = encoder.encode(file.path);
    const contentBytes = encoder.encode(file.content);
    const crc = crc32(contentBytes);
    const size = contentBytes.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + contentBytes.length;
  });

  const centralDirOffset = offset;
  const centralDirSize = centralParts.reduce((sum, p) => sum + p.length, 0);

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralDirSize, true);
  ev.setUint32(16, centralDirOffset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function sanitizeFilename(name) {
  return (name || 'untitled').replace(/[\\/:*?"<>|]/g, '_').trim() || 'untitled';
}

async function exportVaultAsZip() {
  const notes = await getNotesFromStorage();
  if (!notes.length) {
    saveStatus.textContent = 'ℹ️ ยังไม่มีโน้ตให้สำรองข้อมูล';
    return;
  }

  const validFolderIds = new Set(FOLDERS.map(f => f.id));
  const usedPaths = new Set();

  const files = notes.map(note => {
    const folderDef = validFolderIds.has(note.folder)
      ? FOLDERS.find(f => f.id === note.folder)
      : INBOX_FOLDER;

    const safeTitle = sanitizeFilename(note.title);
    let path = `${folderDef.label}/${safeTitle}.md`;
    let counter = 2;
    while (usedPaths.has(path)) {
      path = `${folderDef.label}/${safeTitle} (${counter}).md`;
      counter++;
    }
    usedPaths.add(path);

    return { path, content: note.content || '' };
  });

  try {
    btnExportVault.disabled = true;
    btnExportVault.textContent = '⏳ กำลังสร้างไฟล์ .zip...';

    const blob = buildZipBlob(files);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `a2nd-brain-backup-${dateStr}.zip`);

    saveStatus.textContent = `📦 Export ${notes.length} โน้ตเป็น .zip สำเร็จแล้ว`;
  } catch (err) {
    console.error('Export vault error:', err);
    saveStatus.textContent = '❌ Export ไม่สำเร็จ';
  } finally {
    btnExportVault.disabled = false;
    btnExportVault.textContent = '⬇️ สำรองข้อมูลทั้งหมด (.zip)';
  }
}