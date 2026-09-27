// ==========================================
// A2ND Brain - Application Core Logic
// ==========================================

import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

// Anna Host connection - populated once AnnaAppRuntime.connect() resolves
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

  initEventListeners();
  loadNotesList();
});

function initEventListeners() {
  // 1. Auto-save และ Undo/Redo State
  let saveTimeout;
  let historyDebounce;

  const triggerAutoSave = () => {
    saveStatus.textContent = '⏳ กำลังบันทึก...';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      await saveCurrentNote();
      saveStatus.textContent = '✓ บันทึกแล้ว';
      loadNotesList();
    }, 800);
  };

  noteContentInput.addEventListener('input', (e) => {
    triggerAutoSave();
    
    // บันทึกประวัติสำหรับ Undo / Redo
    clearTimeout(historyDebounce);
    historyDebounce = setTimeout(() => {
      saveState(noteContentInput.value);
    }, 400);

    // ดักจับการพิมพ์ [[ เพื่อเปิดระบบ Auto-complete Wikilinks
    handleWikilinkInput(e);
  });

  noteTitleInput.addEventListener('input', triggerAutoSave);

  // 2. ปุ่ม Undo / Redo
  if (btnUndo) btnUndo.addEventListener('click', undo);
  if (btnRedo) btnRedo.addEventListener('click', redo);

  // 3. Selection Context Handling
  noteContentInput.addEventListener('select', updateSelectionContext);
  noteContentInput.addEventListener('keyup', (e) => {
    updateSelectionContext();
    handleWikilinkKeydown(e);
  });
  noteContentInput.addEventListener('mouseup', updateSelectionContext);

  btnClearContext.addEventListener('click', clearSelectionContext);

  // 4. AI Copilot
  btnSendAi.addEventListener('click', handleSendToAI);
  aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendToAI();
  });

  btnNewNote.addEventListener('click', createNewNote);

  // ปิด Wikilink Dropdown เมื่อคลิกนอกพื้นที่
  document.addEventListener('click', (e) => {
    if (wikilinkDropdown && !wikilinkDropdown.contains(e.target) && e.target !== noteContentInput) {
      removeWikilinkDropdown();
    }
  });
}

// ------------------------------------------
// 1. Undo / Redo History Logic
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
  }
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    noteContentInput.value = historyStack[historyIndex];
    saveCurrentNote();
    updateUndoRedoButtons();
  }
}

// ------------------------------------------
// 2. Storage & Note Management
// ------------------------------------------
async function getNotesFromStorage() {
  const annaStorage = anna?.storage;
  if (annaStorage && typeof annaStorage.get === 'function') {
    try {
      // Host คาดหวัง object { key } ไม่ใช่ raw string - ดูจาก error
      // "'str' object has no attribute 'get'" ที่ฝั่ง Python handler
      const result = await annaStorage.get({ key: 'a2nd_notes_list' });
      console.log('storage.get raw result:', result);

      // รองรับได้ทั้งกรณี host คืนค่าตรง ๆ หรือห่อเป็น { value: ... }
      const data = typeof result === 'string' ? result : result?.value;
      if (!data) return [];

      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch (parseErr) {
        console.error('Storage JSON.parse error:', parseErr, 'raw data was:', data);
        return [];
      }

      // กัน edge case ที่ data เป็น string "null" (truthy) แต่ parse แล้วได้ null จริงๆ
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

  const updatedNote = {
    id: currentId,
    title: noteTitleInput.value || 'โน้ตไม่มีชื่อ',
    content: noteContentInput.value,
    updatedAt: new Date().toISOString()
  };

  const existingIndex = notes.findIndex(n => n.id === currentId);
  if (existingIndex >= 0) {
    notes[existingIndex] = updatedNote;
  } else {
    notes.unshift(updatedNote);
  }

  await saveNotesToStorage(notes);
}

async function loadNotesList() {
  const notes = await getNotesFromStorage();
  folderTree.innerHTML = '<p class="section-title">โครงสร้างสมองของคุณ</p>';
  
  if (notes.length === 0) {
    folderTree.innerHTML += '<p class="empty-msg">ยังไม่มีโน้ต</p>';
    return;
  }

  const currentId = noteTitleInput.dataset.noteId;

  notes.forEach(note => {
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

    folderTree.appendChild(item);
  });
}

function switchNote(note) {
  noteTitleInput.dataset.noteId = note.id;
  noteTitleInput.value = note.title;
  noteContentInput.value = note.content;
  
  // รีเซ็ต History Stack สำหรับโน้ตใหม่
  historyStack = [note.content];
  historyIndex = 0;
  updateUndoRedoButtons();

  clearSelectionContext();
  removeWikilinkDropdown();
  saveStatus.textContent = '✓ บันทึกแล้ว';
  loadNotesList();
}

async function createNewNote() {
  const newNote = {
    id: Date.now().toString(),
    title: 'โน้ตใหม่',
    content: '',
    updatedAt: new Date().toISOString()
  };
  switchNote(newNote);
  await saveCurrentNote();
}

async function deleteNote(id) {
  let notes = await getNotesFromStorage();
  notes = notes.filter(n => n.id !== id);
  await saveNotesToStorage(notes);
  
  if (noteTitleInput.dataset.noteId === id) {
    if (notes.length > 0) {
      switchNote(notes[0]);
    } else {
      createNewNote();
    }
  } else {
    loadNotesList();
  }
}

// ------------------------------------------
// 3. Selection Context
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
// 4. Wikilinks Auto-complete (`[[`)
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

function insertWikilink(title, openIndex) {
  const currentContent = noteContentInput.value;
  const closeIndex = noteContentInput.selectionStart;
  
  const before = currentContent.substring(0, openIndex);
  const after = currentContent.substring(closeIndex);
  
  const insertedText = `[[${title}]] `;
  noteContentInput.value = before + insertedText + after;
  
  const newCursorPos = openIndex + insertedText.length;
  noteContentInput.setSelectionRange(newCursorPos, newCursorPos);
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
// 5. AI Integration (Anna OS Host LLM API)
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
}

// ฟังก์ชันแปลงรูปแบบ Response จาก LLM
function parseLLMResponse(response) {
  console.log('LLM raw response:', response);

  if (typeof response === 'string') {
    return response;
  }

  const content = response?.content;

  // รูปแบบจริงที่เจอ: content เป็น object เดี่ยว { type: 'text', text: '...' } ไม่ใช่ array
  if (content && typeof content === 'object' && !Array.isArray(content) && typeof content.text === 'string') {
    return content.text;
  }

  if (Array.isArray(content)) {
    return content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  }

  if (typeof content === 'string') {
    return content;
  }

  if (typeof response?.text === 'string') {
    return response.text;
  }

  if (Array.isArray(response?.message?.content)) {
    return response.message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  }

  console.warn('Unrecognized LLM response shape, falling back to JSON:', response);
  return JSON.stringify(response, null, 2);
}

async function handleSendToAI() {
  const userMessage = aiInput.value.trim();
  if (!userMessage) return;

  appendChatBubble('user', userMessage);
  aiInput.value = '';

  const loadingBubble = appendChatBubble('ai', '🧠 AI กำลังวิเคราะห์...');

  try {
    let aiResponseText = '';

    let contextPrompt = '';
    if (selectedText) {
      contextPrompt = `ข้อความที่ผู้ใช้กำลังไฮไลต์เลือกอยู่เฉพาะจุด: "${selectedText}"\n`;
    }

    const prompt = `
      คุณคือ AI Architect ของแอปจัดการความรู้ A2ND Brain
      ${contextPrompt}
      หัวข้อโน้ตปัจจุบัน: "${noteTitleInput.value}"
      เนื้อหาโน้ตทั้งหมดปัจจุบัน: "${noteContentInput.value}"
      คำสั่งของผู้ใช้: "${userMessage}"

      คำแนะนำ: ตอบคำถามให้ตรงประเด็น หากผู้ใช้ขอให้แก้ไขหรือแต่งข้อความ ให้ส่งกลับข้อความฉบับปรับปรุงโดยตรงเพื่อให้ผู้ใช้นำไปใช้งานได้ทันที
    `;

    const annaLLM = anna?.llm;

    if (annaLLM && typeof annaLLM.complete === 'function') {
      const response = await annaLLM.complete({
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      aiResponseText = parseLLMResponse(response);
    } else {
      aiResponseText = '⚠️ ไม่พบการเชื่อมต่อ Anna LLM API โปรดตรวจสอบว่ารันแอปผ่าน Anna App Harness และระบุ "llm": ["complete"] ใน manifest.json เรียบร้อยแล้ว';
    }

    loadingBubble.remove();
    appendChatBubble('ai', aiResponseText, aiResponseText);
  } catch (error) {
    console.error('AI Error:', error);
    loadingBubble.textContent = 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI';
  }
}

// ฟังก์ชันให้ AI ช่วยวิเคราะห์หาจุดเชื่อมโยง Wikilinks ในโน้ตปัจจุบัน
export async function suggestAiWikilinks() {
  const allNotes = await getNotesFromStorage();
  const currentContent = noteContentInput.value;
  const currentTitle = noteTitleInput.value;

  if (!currentContent.trim()) return;

  const otherNoteTitles = allNotes
    .filter(n => n.id !== noteTitleInput.dataset.noteId)
    .map(n => n.title);

  if (otherNoteTitles.length === 0) {
    appendChatBubble('ai', '💡 ยังไม่มีโน้ตอื่นให้เชื่อมโยงครับ ลองสร้างโน้ตเพิ่มก่อนนะ!');
    return;
  }

  const loadingBubble = appendChatBubble('ai', '🧠 AI กำลังสแกนหาจุดเชื่อมโยงความคิด...');

  const prompt = `
    คุณคือ AI PKM Assistant
    เนื้อหาโน้ตปัจจุบัน (${currentTitle}):
    "${currentContent}"

    รายชื่อโน้ตทั้งหมดในสมองของผู้ใช้:
    ${JSON.stringify(otherNoteTitles)}

    หน้าที่ของคุณ:
    1. ตรวจสอบว่าในเนื้อหาโน้ตปัจจุบัน มีคำหรือบริบทใดที่สามารถเชื่อมโยงไปยัง "รายชื่อโน้ตทั้งหมดในสมอง" ได้บ้าง
    2. ส่งกลับข้อความสั้นๆ เสนอแนะผู้ใช้ว่าควรเปลี่ยนคำไหนเป็น [[ชื่อโน้ต]]
    3. หรือหากไม่มีคำตรงๆ ให้เสนอประโยคฉบับปรับปรุงที่มีการใส่ [[ชื่อโน้ต]] ให้เรียบร้อย
  `;

  try {
    const annaLLM = anna?.llm;
    if (annaLLM && typeof annaLLM.complete === 'function') {
      const response = await annaLLM.complete({
        messages: [
          { role: 'user', content: prompt }
        ]
      });
      const aiText = parseLLMResponse(response);

      loadingBubble.remove();
      appendChatBubble('ai', aiText, aiText);
    } else {
      loadingBubble.textContent = '⚠️ ไม่พบการเชื่อมต่อ Anna LLM API';
    }
  } catch (err) {
    console.error('Wikilink AI Error:', err);
    loadingBubble.textContent = 'เกิดข้อผิดพลาดในการวิเคราะห์ลิงก์';
  }
}