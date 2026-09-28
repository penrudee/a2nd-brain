// ==========================================
// A2ND Brain - Application Core Logic
// A 2nd brain engine — Backlinks, Auto Keyword Linker, RAG Engine,
// Zip Backup/Restore & File Attachments Engine
// i18n: English default · Thai auto-detected
// ==========================================

import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

// Anna Host connection
let anna = null;

// ==========================================
// 🌐 i18n — Internationalization
// ==========================================
const I18N = {
  en: {
    // Sidebar
    newNote: '+ New Note',
    brainStructureTitle: '🧠 Your Brain Structure',

    // Editor
    permanentBrain: '📄 Permanent Brain',
    saved: '✓ Saved',
    saving: '⏳ Saving...',
    read: 'Read',
    write: 'Write',
    toggleViewTitle: 'Toggle: Write ↔ Read',
    undo: 'Undo',
    redo: 'Redo',
    noteTitlePlaceholder: 'Note title...',
    noteContentPlaceholder: 'Type your thoughts, ideas, or content here (auto-saved)...',
    welcomeTitle: 'Welcome to A2ND Brain',
    untitled: 'Untitled Note',
    newNoteTitle: 'New Note',
    emptyPreview: '📭 No content yet — click "Write" to start typing',

    // AI panel
    aiArchitect: '🧠 AI Architect',
    highlightedText: '📌 Highlighted:',
    aiGreeting: "Hi! I'm your AI assistant for organizing your brain. Highlight any text in your note and ask me about it!",
    aiInputPlaceholder: 'Ask AI or give a command...',
    send: 'Send',
    aiAnalyzing: '🧠 AI is thinking...',
    aiConnectionMissing: '⚠️ Anna LLM API not connected',
    aiError: 'Sorry, there was an error connecting to AI.',

    // Brain folders
    brainLegendTitle: '💡 How the 4 brain regions work',
    folders: {
      inbox: {
        label: '00 Inbox',
        hint: "Notes that haven't been categorized yet — waiting to be sorted into the right brain region.",
        shortHint: 'Uncategorized',
        brainPart: 'Sensory Buffer'
      },
      executive: {
        label: '01 Executive Buffer',
        hint: "Tasks that must be finished within a limited time — equivalent to the brain's Working Memory.",
        shortHint: 'Urgent tasks',
        brainPart: 'Prefrontal Cortex'
      },
      intention: {
        label: '02 Intention Network',
        hint: 'Long-term commitments — long-range goals, identity, and life direction.',
        shortHint: 'Long-term goals',
        brainPart: 'Default Mode Network'
      },
      associative: {
        label: '03 Associative Cortex',
        hint: 'Reference data, images, files, and knowledge that can be linked together.',
        shortHint: 'Knowledge base',
        brainPart: 'Associative Cortex'
      },
      consolidated: {
        label: '04 Consolidated Memory',
        hint: 'Completed projects — long-term memories not often used but still accessible.',
        shortHint: 'Completed work',
        brainPart: 'Hippocampus → Neocortex'
      }
    },

    folderSelectTitle: 'Choose which brain region to store this note in',
    folderEmpty: '— empty —',
    noNotes: 'No notes yet',

    // Backup
    exportVault: '⬇️ Backup (.zip)',
    importVault: '⬆️ Restore (.zip)',
    exportingVault: '⏳ Backing up...',
    importingVault: '⏳ Reading file...',
    importingVaultRestore: '⏳ Restoring from .zip...',
    exportSuccess: (n) => `📦 Exported ${n} notes to .zip`,
    exportFailed: '❌ Export failed',
    exportEmpty: 'ℹ️ No notes to back up',
    importSuccess: (n) => `✅ Restored ${n} notes`,
    importFailed: '❌ Restore failed',
    importNoMarkdown: '⚠️ No supported .md notes found inside the Zip',

    // Attachments
    attachFile: '📎 Attach file (image / PDF)',
    attaching: '⏳ Processing attachment...',
    readingImage: '🧠 AI is reading and extracting text from the image...',
    readingPdf: '📄 Reading PDF...',
    pdfReference: (name) => `[PDF Reference: ${name}]`,
    extractedHeader: (name) => `\n\n--- \n📌 **Text extracted from attachment (${name}):**\n`,
    attachSuccess: '✅ File attached',
    attachFailed: '❌ Failed to attach file',
    removeAttachment: 'Remove attachment',

    // Backlinks
    backlinks: (n) => `🔗 Backlinks (${n})`,
    show: '👁 Show',
    hide: '🙈 Hide',
    noBacklinks: 'No other notes link to this note',
    backlinkTitle: (title) => `👈 ${title}`,

    // RAG
    ragTitle: '💡 Related ideas (RAG Suggest)',
    ragInsert: '+ Insert',

    // Auto-link / format
    autoLinked: '🔗 Wikilinks auto-connected',
    autoFormatted: '🪄 AI auto-formatted the note',

    // Preview
    noteNotFound: (title) => `⚠️ Note "${title}" not found`,

    // AI Prompts
    prompts: {
      visionOcr: `You are a Vision OCR Engine.
Your task: extract and describe all text, data, summaries, or diagrams in this image in clear, readable English.
Return only the extracted content. Do not add any extra commentary.`,

      ragEngine: (currentTitle, currentContent, notesContext) => `
You are a RAG Cross-Referencing Engine for a 2nd brain knowledge system.
Your task: analyze the current note, then compare it with other notes in the vault to find notes that share semantic or idea-level connections (cross-referencing).

Current note (${currentTitle}):
"""
${currentContent}
"""

All notes in the vault:
${JSON.stringify(notesContext)}

Instructions:
- Pick the 1-3 most relevant or extendable notes
- Reply ONLY with a JSON Array. Do not include any other text or markdown code fence.
- JSON structure:
[
  { "title": "related note title", "reason": "short reason, max 1 sentence, explaining how they connect" }
]`,

      autoFormat: (otherTitles, content) => `
You are an AI that organizes notes in a 2nd brain.
Task: format the note as clean, readable Markdown, and insert wikilinks [[note title]] where the topic matches another note.
Other note titles: ${JSON.stringify(otherTitles)}
Current note content:
"""
${content}
"""
Rules: return only the formatted content. No explanation, no markdown code fence.`,

      chat: (contextPrompt, title, content, userMessage) => `
You are the AI Architect of the A2ND Brain knowledge app.
${contextPrompt}
Current note title: "${title}"
Full note content: "${content}"
User command: "${userMessage}"`
    }
  },

  th: {
    // Sidebar
    newNote: '+ โน้ตใหม่',
    brainStructureTitle: '🧠 โครงสร้างสมองของคุณ',

    // Editor
    permanentBrain: '📄 สมองส่วนถาวร',
    saved: '✓ บันทึกแล้ว',
    saving: '⏳ กำลังบันทึก...',
    read: 'อ่าน',
    write: 'เขียน',
    toggleViewTitle: 'สลับโหมด: เขียน ↔ อ่าน',
    undo: 'ย้อนกลับ (Undo)',
    redo: 'ทำซ้ำ (Redo)',
    noteTitlePlaceholder: 'ชื่อหัวข้อโน้ต...',
    noteContentPlaceholder: 'พิมพ์ความสนใจ ไอเดีย หรือเนื้อหาของคุณที่นี่ (บันทึกให้อัตโนมัติ)...',
    welcomeTitle: 'ยินดีต้อนรับสู่ A2ND Brain',
    untitled: 'โน้ตไม่มีชื่อ',
    newNoteTitle: 'โน้ตใหม่',
    emptyPreview: '📭 ยังไม่มีเนื้อหา — คลิก "เขียน" เพื่อเริ่มพิมพ์',

    // AI panel
    aiArchitect: '🧠 AI Architect',
    highlightedText: '📌 ไฮไลต์ข้อความอยู่:',
    aiGreeting: 'สวัสดีครับ! ผมคือ AI ช่วยจัดระเบียบสมองของคุณ สามารถไฮไลต์ข้อความในโน้ตแล้วถามผมเฉพาะจุดได้เลยครับ!',
    aiInputPlaceholder: 'พิมพ์คำสั่งหรือถาม AI...',
    send: 'ส่ง',
    aiAnalyzing: '🧠 AI กำลังวิเคราะห์...',
    aiConnectionMissing: '⚠️ ไม่พบการเชื่อมต่อ Anna LLM API',
    aiError: 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI',

    // Brain folders
    brainLegendTitle: '💡 สมอง 4 ส่วน ทำงานอย่างไร',
    folders: {
      inbox: {
        label: '00 Inbox',
        hint: 'โน้ตที่ยังไม่ได้จัดหมวดหมู่ — รอการตัดสินใจว่าจะไปอยู่สมองส่วนไหน',
        shortHint: 'รอจัดหมวดหมู่',
        brainPart: 'Sensory Buffer'
      },
      executive: {
        label: '01 Executive Buffer',
        hint: 'งานที่ต้องทำเสร็จในระยะเวลาจำกัด — เทียบเท่า Working Memory ของสมอง',
        shortHint: 'งานเร่งด่วน',
        brainPart: 'Prefrontal Cortex'
      },
      intention: {
        label: '02 Intention Network',
        hint: 'งานที่ตั้งใจจะทำไปตลอด — เป้าหมายระยะยาว อัตลักษณ์ และทิศทางชีวิต',
        shortHint: 'เป้าหมายระยะยาว',
        brainPart: 'Default Mode Network'
      },
      associative: {
        label: '03 Associative Cortex',
        hint: 'คลังข้อมูลอ้างอิง รูปภาพ ไฟล์ และความรู้ที่เชื่อมโยงกันได้',
        shortHint: 'คลังความรู้',
        brainPart: 'Associative Cortex'
      },
      consolidated: {
        label: '04 Consolidated Memory',
        hint: 'โปรเจกต์ที่สำเร็จแล้ว — ความจำระยะยาวที่ไม่ต้องใช้งานบ่อยแต่ยังเข้าถึงได้',
        shortHint: 'งานที่เสร็จแล้ว',
        brainPart: 'Hippocampus → Neocortex'
      }
    },

    folderSelectTitle: 'เลือกสมองส่วนที่จะเก็บโน้ตนี้',
    folderEmpty: '— ว่างเปล่า —',
    noNotes: 'ยังไม่มีโน้ต',

    // Backup
    exportVault: '⬇️ สำรองข้อมูล (.zip)',
    importVault: '⬆️ คืนค่าข้อมูล (.zip)',
    exportingVault: '⏳ สำรองข้อมูล...',
    importingVault: '⏳ กำลังอ่านไฟล์...',
    importingVaultRestore: '⏳ กำลังคืนค่าข้อมูลจาก .zip...',
    exportSuccess: (n) => `📦 Export ${n} โน้ตเป็น .zip สำเร็จแล้ว`,
    exportFailed: '❌ Export ไม่สำเร็จ',
    exportEmpty: 'ℹ️ ยังไม่มีโน้ตให้สำรองข้อมูล',
    importSuccess: (n) => `✅ คืนค่าสำเร็จ ${n} โน้ต`,
    importFailed: '❌ คืนค่าข้อมูลไม่สำเร็จ',
    importNoMarkdown: '⚠️ ไม่พบไฟล์โน้ต .md ที่รองรับภายใน Zip',

    // Attachments
    attachFile: '📎 แนบไฟล์อ้างอิง (รูปภาพ / PDF)',
    attaching: '⏳ กำลังประมวลผลไฟล์แนบ...',
    readingImage: '🧠 AI กำลังอ่านและสกัดข้อความจากรูปภาพ...',
    readingPdf: '📄 กำลังอ่านข้อมูล PDF...',
    pdfReference: (name) => `[ไฟล์ PDF อ้างอิง: ${name}]`,
    extractedHeader: (name) => `\n\n--- \n📌 **ข้อความสกัดจากไฟล์อ้างอิง (${name}):**\n`,
    attachSuccess: '✅ แนบไฟล์สำเร็จ',
    attachFailed: '❌ แนบไฟล์ไม่สำเร็จ',
    removeAttachment: 'ลบไฟล์แนบ',

    // Backlinks
    backlinks: (n) => `🔗 Backlinks (${n})`,
    show: '👁 แสดง',
    hide: '🙈 ซ่อน',
    noBacklinks: 'ไม่มีโน้ตอื่นที่เชื่อมโยงมายังโน้ตนี้',
    backlinkTitle: (title) => `👈 ${title}`,

    // RAG
    ragTitle: '💡 ไอเดียที่เกี่ยวข้อง (RAG Suggest)',
    ragInsert: '+ แทรก',

    // Auto-link / format
    autoLinked: '🔗 เชื่อมโยง Wikilink อัตโนมัติแล้ว',
    autoFormatted: '🪄 AI ปรับรูปแบบโน้ตให้อัตโนมัติแล้ว',

    // Preview
    noteNotFound: (title) => `⚠️ ไม่พบโน้ต "${title}"`,

    // AI Prompts
    prompts: {
      visionOcr: `คุณคือ Vision OCR Engine
หน้าที่ของคุณ: สกัดและอธิบายข้อความ ข้อมูล สรุป หรือไดอะแกรมที่ปรากฏในรูปภาพนี้เป็นภาษาไทยให้อ่านเข้าใจง่าย
ส่งกลับเฉพาะข้อความเนื้อหา ห้ามใส่คำอธิบายอื่น`,

      ragEngine: (currentTitle, currentContent, notesContext) => `
คุณคือ RAG Cross-Referencing Engine สำหรับระบบจัดการความรู้ a 2nd brain
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
]`,

      autoFormat: (otherTitles, content) => `
คุณคือ AI จัดระเบียบโน้ต a 2nd brain
หน้าที่: จัดรูปแบบโน้ตให้เป็น Markdown ที่อ่านง่าย และใส่ wikilink [[ชื่อโน้ต]] ในจุดที่พูดถึงหัวข้อตรงกับโน้ตอื่น
รายชื่อโน้ตอื่น: ${JSON.stringify(otherTitles)}
เนื้อหาโน้ตปัจจุบัน:
"""
${content}
"""
กติกา: ส่งกลับเฉพาะเนื้อหาฉบับจัดรูปแบบแล้ว ห้ามใส่คำอธิบาย ห้ามใส่ markdown code fence`,

      chat: (contextPrompt, title, content, userMessage) => `
คุณคือ AI Architect ของแอปจัดการความรู้ A2ND Brain
${contextPrompt}
หัวข้อโน้ตปัจจุบัน: "${title}"
เนื้อหาโน้ตทั้งหมด: "${content}"
คำสั่งผู้ใช้: "${userMessage}"`
    }
  }
};

// ==========================================
// 🌐 Language Detection & Translation
// ==========================================
let currentLang = 'en';

function detectLanguage() {
  try {
    const saved = localStorage.getItem('a2nd_lang');
    if (saved === 'th' || saved === 'en') return saved;
  } catch (_) { }

  const langs = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || 'en'];

  for (const lang of langs) {
    const l = String(lang).toLowerCase();
    if (l.startsWith('th')) return 'th';
  }
  return 'en';
}

/**
 * Translation helper with dot notation.
 * t('saved') / t('folders.inbox.label') / t('exportSuccess', 5)
 */
function t(key, ...args) {
  const parts = String(key).split('.');
  let node = I18N[currentLang];
  for (const p of parts) {
    if (node == null) { node = undefined; break; }
    node = node[p];
  }
  if (node === undefined) {
    // Fallback to English
    node = I18N.en;
    for (const p of parts) {
      if (node == null) { node = undefined; break; }
      node = node[p];
    }
  }
  if (typeof node === 'function') return node(...args);
  return node !== undefined ? node : key;
}

/**
 * Apply translations to all DOM elements with data-i18n* attributes.
 */
function applyI18nToDom() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (typeof val === 'string') el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = t(el.dataset.i18nPlaceholder);
    if (typeof val === 'string') el.placeholder = val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const val = t(el.dataset.i18nTitle);
    if (typeof val === 'string') el.title = val;
  });
}
/**
 * Update the language toggle button label.
 * Shows the language you will get when clicking.
 */
function updateLangToggleButton() {
  const btn = document.getElementById('btn-lang-toggle');
  if (!btn) return;
  if (currentLang === 'en') {
    btn.textContent = '🌐 ไทย';
    btn.title = 'เปลี่ยนเป็นภาษาไทย';
  } else {
    btn.textContent = '🌐 EN';
    btn.title = 'Switch to English';
  }
}

/**
 * Refresh folder <select> options to match current language.
 */
function refreshFolderSelectOptions() {
  if (!folderSelect) return;
  const currentValue = folderSelect.value;
  folderSelect.title = t('folderSelectTitle');
  folderSelect.innerHTML = [
    `<option value="">${INBOX_FOLDER.icon} ${folderLabel(INBOX_FOLDER)} — ${folderShortHint(INBOX_FOLDER)}</option>`,
    ...FOLDERS.map(f => `<option value="${f.id}">${f.icon} ${folderLabel(f)} — ${folderShortHint(f)}</option>`)
  ].join('');
  folderSelect.value = currentValue;
}

/**
 * Switch language at runtime: persist, re-apply i18n, re-render dynamic UI.
 */
async function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'th') lang = 'en';
  if (lang === currentLang) return;

  currentLang = lang;

  try { localStorage.setItem('a2nd_lang', lang); } catch (_) { }

  // 1) Static DOM (data-i18n / -placeholder / -title)
  applyI18nToDom();

  // 2) Toggle button label
  updateLangToggleButton();

  // 3) Folder select options
  refreshFolderSelectOptions();

  // 4) Dynamically-created buttons
  if (btnExportVault) btnExportVault.textContent = t('exportVault');
  if (btnImportVault) btnImportVault.textContent = t('importVault');
  if (btnAttachFile) btnAttachFile.textContent = t('attachFile');
  if (viewToggleLabel) {
    viewToggleLabel.textContent = viewMode === 'preview' ? t('write') : t('read');
  }

  // 5) Note title — only if user hasn't customised it
  const curTitle = (noteTitleInput.value || '').trim();
  const isDefaultTitle =
    curTitle === '' ||
    curTitle === I18N.en.welcomeTitle ||
    curTitle === I18N.th.welcomeTitle;
  if (isDefaultTitle) {
    noteTitleInput.value = t('welcomeTitle');
  }

  // 6) Re-render dynamic content
  await loadNotesList();
  await renderBacklinksUI();
  await runRAGCrossReferencing();
  refreshPreview();

  // 7) Persist any title change
  if (isDefaultTitle) {
    await saveCurrentNote();
  }
}
// ==========================================
// 🧠 Brain-Based Folder System
// ==========================================
const FOLDERS = [
  { id: 'executive', icon: '⚡', i18nKey: 'executive' },
  { id: 'intention', icon: '🎯', i18nKey: 'intention' },
  { id: 'associative', icon: '🔗', i18nKey: 'associative' },
  { id: 'consolidated', icon: '💎', i18nKey: 'consolidated' }
];

const INBOX_FOLDER = { id: 'inbox', icon: '📥', i18nKey: 'inbox' };

function folderLabel(f) { return t(`folders.${f.i18nKey}.label`); }
function folderHint(f) { return t(`folders.${f.i18nKey}.hint`); }
function folderShortHint(f) { return t(`folders.${f.i18nKey}.shortHint`); }
function folderBrainPart(f) { return t(`folders.${f.i18nKey}.brainPart`); }

function getFolderDef(folderId) {
  if (!folderId) return INBOX_FOLDER;
  return FOLDERS.find(f => f.id === folderId) || INBOX_FOLDER;
}

let expandedFolders = new Set([INBOX_FOLDER.id, ...FOLDERS.map(f => f.id)]);

// ==========================================
// Runtime state
// ==========================================
let selectedText = '';
let selectedRange = { start: 0, end: 0 };

let historyStack = [];
let historyIndex = -1;
const maxHistory = 30;

let wikilinkDropdown = null;
let activeWikilinkIndex = 0;

let autoFormatDebounce;
let ragSuggestDebounce;
let lastAutoFormattedContent = '';
const AUTO_FORMAT_IDLE_MS = 3500;
const AUTO_FORMAT_MIN_LENGTH = 30;

let backlinksCollapsed = false;
let legendCollapsed = false;
let viewMode = 'edit'; // 'edit' | 'preview'

// UI elements (created dynamically)
let folderSelect = null;
let btnExportVault = null;
let btnImportVault = null;
let fileImportInput = null;

let btnAttachFile = null;
let fileAttachInput = null;
let attachmentListContainer = null;

// DOM elements
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
const notePreviewEl = document.getElementById('note-preview');
const btnToggleView = document.getElementById('btn-toggle-view');
const viewToggleIcon = document.getElementById('view-toggle-icon');
const viewToggleLabel = document.getElementById('view-toggle-label');

let currentAttachments = [];

// ==========================================
// Bootstrap
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // 1) Detect & apply language first
  currentLang = detectLanguage();
  applyI18nToDom();
  updateLangToggleButton();
  // 2) Initialize default note title if empty
  if (!noteTitleInput.value) {
    noteTitleInput.value = t('welcomeTitle');
  }

  // 3) Connect to Anna Runtime
  try {
    anna = await AnnaAppRuntime.connect();
  } catch (e) {
    console.error('AnnaAppRuntime.connect() failed:', e);
  }

  injectStyles();
  ensureFolderSelectUI();
  ensureBackupUI();
  ensureAttachmentUI();
  initEventListeners();

  await loadNotesList();
  await renderBacklinksUI();
  await runRAGCrossReferencing();
});

// ==========================================
// Styles
// ==========================================
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
    .backup-btn-group { display: flex; gap: 6px; margin-top: 6px; }
    .btn-export-vault, .btn-import-vault, .btn-attach-file {
      flex: 1;
      padding: 8px 6px;
      font-size: 12px;
      cursor: pointer;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
      color: inherit;
      text-align: center;
    }
    .btn-export-vault:hover, .btn-import-vault:hover, .btn-attach-file:hover { background: rgba(255,255,255,0.1); }
    .btn-export-vault:disabled, .btn-import-vault:disabled, .btn-attach-file:disabled { opacity: 0.6; cursor: not-allowed; }
    .folder-group { margin-bottom: 4px; }
    .folder-header {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 4px; cursor: pointer; font-size: 13px;
      border-radius: 4px; user-select: none;
    }
    .folder-header:hover { background: rgba(255,255,255,0.06); }
    .folder-count { opacity: 0.6; font-size: 11px; margin-left: auto; }
    .folder-empty { padding-left: 24px; font-size: 12px; opacity: 0.5; }
    .folder-group .note-item { padding-left: 20px; }

    .attachment-section {
      margin: 12px 0; padding: 8px;
      background: rgba(255,255,255,0.03);
      border: 1px dashed rgba(255,255,255,0.15);
      border-radius: 6px;
    }
    .attachment-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .attachment-card {
      position: relative; display: flex; align-items: center; gap: 6px;
      padding: 6px 10px; background: rgba(255,255,255,0.08);
      border-radius: 4px; font-size: 11px; max-width: 200px;
    }
    .attachment-preview-img { width: 28px; height: 28px; object-fit: cover; border-radius: 3px; }
    .attachment-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
    .btn-remove-attachment { cursor: pointer; color: #ff6b6b; font-weight: bold; margin-left: auto; }

    .connections-container { margin-top: 16px; padding-top: 8px; }
    .section-divider {
      border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 12px 0;
    }
    .backlink-item, .rag-suggestion-item {
      display: flex; flex-direction: column; gap: 2px;
      padding: 6px 8px; font-size: 12px; border-radius: 6px;
      cursor: pointer; color: var(--text-muted);
      transition: all 0.2s; margin-bottom: 4px;
      background: rgba(255,255,255,0.02);
    }
    .backlink-item:hover, .rag-suggestion-item:hover {
      background: rgba(138, 180, 248, 0.15); color: #fff;
    }
    .rag-item-header {
      display: flex; align-items: center; justify-content: space-between; font-weight: 500;
    }
    .rag-reason { font-size: 10px; opacity: 0.75; line-height: 1.3; }
    .btn-insert-link {
      font-size: 10px; padding: 2px 6px; border-radius: 3px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;
    }
    .btn-insert-link:hover { background: var(--accent-color, #4f46e5); }
    /* Language toggle button */
    .lang-toggle-btn {
      margin-left: auto;
      padding: 4px 8px;
      font-size: 11px;
      cursor: pointer;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.06);
      color: inherit;
      white-space: nowrap;
    }
    .lang-toggle-btn:hover { background: rgba(255,255,255,0.14); }
  `;
  document.head.appendChild(style);
}

// ==========================================
// Folder Select UI
// ==========================================
function ensureFolderSelectUI() {
  if (folderSelect) return;
  folderSelect = document.createElement('select');
  folderSelect.id = 'note-folder-select';
  folderSelect.className = 'note-folder-select';
  folderSelect.title = t('folderSelectTitle');

  folderSelect.innerHTML = [
    `<option value="">${INBOX_FOLDER.icon} ${folderLabel(INBOX_FOLDER)} — ${folderShortHint(INBOX_FOLDER)}</option>`,
    ...FOLDERS.map(f => `<option value="${f.id}">${f.icon} ${folderLabel(f)} — ${folderShortHint(f)}</option>`)
  ].join('');

  folderSelect.addEventListener('change', async () => {
    await setCurrentNoteFolder(folderSelect.value || null);
  });

  if (noteTitleInput && noteTitleInput.parentElement) {
    noteTitleInput.parentElement.insertBefore(folderSelect, noteTitleInput.nextSibling);
  }
}

// ==========================================
// Backup UI
// ==========================================
function ensureBackupUI() {
  if (btnExportVault && btnImportVault) return;

  const container = document.createElement('div');
  container.className = 'backup-btn-group';

  btnExportVault = document.createElement('button');
  btnExportVault.id = 'btn-export-vault';
  btnExportVault.className = 'btn-export-vault';
  btnExportVault.textContent = t('exportVault');
  btnExportVault.addEventListener('click', exportVaultAsZip);

  btnImportVault = document.createElement('button');
  btnImportVault.id = 'btn-import-vault';
  btnImportVault.className = 'btn-import-vault';
  btnImportVault.textContent = t('importVault');
  btnImportVault.addEventListener('click', () => fileImportInput.click());

  fileImportInput = document.createElement('input');
  fileImportInput.type = 'file';
  fileImportInput.accept = '.zip';
  fileImportInput.style.display = 'none';
  fileImportInput.addEventListener('change', handleImportZip);

  container.appendChild(btnExportVault);
  container.appendChild(btnImportVault);
  container.appendChild(fileImportInput);

  if (btnNewNote && btnNewNote.parentElement) {
    btnNewNote.parentElement.insertBefore(container, btnNewNote.nextSibling);
  }
}

// ==========================================
// Attachment UI
// ==========================================
function ensureAttachmentUI() {
  if (btnAttachFile) return;

  const section = document.createElement('div');
  section.className = 'attachment-section';

  btnAttachFile = document.createElement('button');
  btnAttachFile.id = 'btn-attach-file';
  btnAttachFile.className = 'btn-attach-file';
  btnAttachFile.textContent = t('attachFile');
  btnAttachFile.addEventListener('click', () => fileAttachInput.click());

  fileAttachInput = document.createElement('input');
  fileAttachInput.type = 'file';
  fileAttachInput.accept = 'image/*,application/pdf';
  fileAttachInput.style.display = 'none';
  fileAttachInput.addEventListener('change', handleFileUpload);

  attachmentListContainer = document.createElement('div');
  attachmentListContainer.id = 'attachment-list';
  attachmentListContainer.className = 'attachment-list';

  section.appendChild(btnAttachFile);
  section.appendChild(fileAttachInput);
  section.appendChild(attachmentListContainer);

  if (noteContentInput && noteContentInput.parentElement) {
    noteContentInput.parentElement.insertBefore(section, noteContentInput);
  }
}

// ==========================================
// Event listeners
// ==========================================
function initEventListeners() {
  let saveTimeout;
  let historyDebounce;

  const triggerAutoSave = () => {
    saveStatus.textContent = t('saving');
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      await saveCurrentNote();
      saveStatus.textContent = t('saved');
      await loadNotesList();
      await renderBacklinksUI();
      refreshPreview();
    }, 800);
  };

  noteContentInput.addEventListener('input', (e) => {
    triggerAutoSave();

    clearTimeout(historyDebounce);
    historyDebounce = setTimeout(() => {
      saveState(noteContentInput.value);
    }, 400);

    handleWikilinkInput(e);

    clearTimeout(autoFormatDebounce);
    autoFormatDebounce = setTimeout(async () => {
      await autoLinkKeywordsInContent();
      await autoFormatNoteWithAI();
      await runRAGCrossReferencing();
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
  const btnLangToggle = document.getElementById('btn-lang-toggle');
  if (btnLangToggle) {
    btnLangToggle.addEventListener('click', () => {
      setLanguage(currentLang === 'en' ? 'th' : 'en');
    });
  }
  if (btnToggleView) btnToggleView.addEventListener('click', toggleViewMode);
  if (notePreviewEl) notePreviewEl.addEventListener('click', handlePreviewClick);

  document.addEventListener('click', (e) => {
    if (wikilinkDropdown && !wikilinkDropdown.contains(e.target) && e.target !== noteContentInput) {
      removeWikilinkDropdown();
    }
  });
}

// ==========================================
// Attachment & Text Extraction Engine
// ==========================================
async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  saveStatus.textContent = t('attaching');

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const fileData = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        extractedText: ''
      };

      if (file.type.startsWith('image/')) {
        saveStatus.textContent = t('readingImage');
        fileData.extractedText = await extractTextFromImage(dataUrl);
      } else if (file.type === 'application/pdf') {
        saveStatus.textContent = t('readingPdf');
        fileData.extractedText = t('pdfReference', file.name);
      }

      currentAttachments.push(fileData);
      renderAttachments();

      if (fileData.extractedText) {
        saveState(noteContentInput.value);
        const appendHeader = t('extractedHeader', file.name) + fileData.extractedText + '\n';
        noteContentInput.value += appendHeader;
        saveState(noteContentInput.value);
      }

      await saveCurrentNote();
      saveStatus.textContent = t('attachSuccess');
      await runRAGCrossReferencing();
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error('File upload error:', err);
    saveStatus.textContent = t('attachFailed');
  } finally {
    fileAttachInput.value = '';
  }
}

async function extractTextFromImage(dataUrl) {
  const annaLLM = anna?.llm;
  if (!annaLLM || typeof annaLLM.complete !== 'function') return '';

  const aiPrompt = t('prompts.visionOcr');

  try {
    const response = await annaLLM.complete({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: aiPrompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ]
    });
    return parseLLMResponse(response).trim();
  } catch (err) {
    console.warn('Vision OCR failed:', err);
    return '';
  }
}

function renderAttachments() {
  if (!attachmentListContainer) return;
  attachmentListContainer.innerHTML = '';

  if (currentAttachments.length === 0) {
    attachmentListContainer.style.display = 'none';
    return;
  }

  attachmentListContainer.style.display = 'flex';

  currentAttachments.forEach((att) => {
    const card = document.createElement('div');
    card.className = 'attachment-card';

    if (att.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = att.dataUrl;
      img.className = 'attachment-preview-img';
      card.appendChild(img);
    } else {
      const icon = document.createElement('span');
      icon.textContent = '📄';
      card.appendChild(icon);
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'attachment-name';
    nameSpan.textContent = att.name;
    nameSpan.title = att.name;
    card.appendChild(nameSpan);

    const btnRemove = document.createElement('span');
    btnRemove.className = 'btn-remove-attachment';
    btnRemove.textContent = '✕';
    btnRemove.title = t('removeAttachment');
    btnRemove.onclick = async () => {
      currentAttachments = currentAttachments.filter(a => a.id !== att.id);
      renderAttachments();
      await saveCurrentNote();
    };
    card.appendChild(btnRemove);

    attachmentListContainer.appendChild(card);
  });
}

// ==========================================
// Undo / Redo
// ==========================================
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
    refreshPreview();
  }
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    noteContentInput.value = historyStack[historyIndex];
    saveCurrentNote();
    updateUndoRedoButtons();
    renderBacklinksUI();
    refreshPreview();
  }
}

// ==========================================
// Storage
// ==========================================
const NOTES_KEY = 'a2nd_notes_list';
async function getNotesFromStorage() {
  // 1) Anna storage
  if (typeof anna?.storage?.get === 'function') {
    const result = await anna.storage.get({ key: NOTES_KEY }); // ไม่ catch -> ให้ผู้เรียกรู้ว่าอ่านพลาด
    const raw = typeof result === 'string' ? result : result?.value;
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed;
    }
  }
  // 2) fallback: สำเนาใน localStorage
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  } catch { return []; }
}

async function saveNotesToStorage(notes) {
  const json = JSON.stringify(notes);
  try { localStorage.setItem(NOTES_KEY, json); } catch (e) { console.warn('local mirror failed', e); }
  if (typeof anna?.storage?.set === 'function') {
    await anna.storage.set({ key: NOTES_KEY, value: json });
    console.log('[storage] saved', notes.length, 'notes to anna.storage');
  } else {
    console.warn('[storage] anna.storage unavailable, using localStorage only');
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
    title: noteTitleInput.value || t('untitled'),
    content: noteContentInput.value,
    folder: existingFolder,
    attachments: currentAttachments,
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

// ==========================================
// Render Brain Folder Tree
// ==========================================
async function loadNotesList() {
  const notes = await getNotesFromStorage();
  folderTree.innerHTML = `<p class="section-title">${t('brainStructureTitle')}</p>`;

  // Legend
  const legendEl = document.createElement('div');
  legendEl.className = 'brain-legend';
  legendEl.innerHTML = `
    <div class="brain-legend-title">
      <span>${t('brainLegendTitle')}</span>
      <button class="toggle-legend" title="${legendCollapsed ? 'Show' : 'Hide'}">${legendCollapsed ? '▶' : '▼'}</button>
    </div>
    <div class="brain-legend-body ${legendCollapsed ? 'collapsed' : ''}">
      <div class="brain-legend-item">
        <span class="brain-legend-icon">⚡</span>
        <span class="brain-legend-text"><strong>${folderLabel(FOLDERS[0])}</strong> — ${folderShortHint(FOLDERS[0])}</span>
      </div>
      <div class="brain-legend-item">
        <span class="brain-legend-icon">🎯</span>
        <span class="brain-legend-text"><strong>${folderLabel(FOLDERS[1])}</strong> — ${folderShortHint(FOLDERS[1])}</span>
      </div>
      <div class="brain-legend-item">
        <span class="brain-legend-icon">🔗</span>
        <span class="brain-legend-text"><strong>${folderLabel(FOLDERS[2])}</strong> — ${folderShortHint(FOLDERS[2])}</span>
      </div>
      <div class="brain-legend-item">
        <span class="brain-legend-icon">💎</span>
        <span class="brain-legend-text"><strong>${folderLabel(FOLDERS[3])}</strong> — ${folderShortHint(FOLDERS[3])}</span>
      </div>
    </div>
  `;
  folderTree.appendChild(legendEl);

  legendEl.querySelector('.toggle-legend').addEventListener('click', (e) => {
    e.stopPropagation();
    legendCollapsed = !legendCollapsed;
    const body = legendEl.querySelector('.brain-legend-body');
    const btn = legendEl.querySelector('.toggle-legend');
    body.classList.toggle('collapsed', legendCollapsed);
    btn.textContent = legendCollapsed ? '▶' : '▼';
  });

  if (notes.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'empty-msg';
    emptyMsg.textContent = t('noNotes');
    folderTree.appendChild(emptyMsg);
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
    folderHeader.title = `${folderHint(folderDef)}\n(Brain region: ${folderBrainPart(folderDef)})`;
    folderHeader.innerHTML = `
      <span class="folder-toggle">${isExpanded ? '▾' : '▸'}</span>
      <span class="folder-icon">${folderDef.icon}</span>
      <span class="folder-label">${folderLabel(folderDef)}</span>
      <span class="folder-count">(${notesInFolder.length})</span>
    `;
    folderHeader.addEventListener('click', () => {
      if (expandedFolders.has(folderDef.id)) expandedFolders.delete(folderDef.id);
      else expandedFolders.add(folderDef.id);
      loadNotesList();
    });
    folderEl.appendChild(folderHeader);

    if (isExpanded && folderHint(folderDef)) {
      const hintEl = document.createElement('div');
      hintEl.className = 'folder-hint';
      hintEl.textContent = `↳ ${folderShortHint(folderDef)} · ${folderBrainPart(folderDef)}`;
      hintEl.title = folderHint(folderDef);
      folderEl.appendChild(hintEl);
    }

    if (isExpanded) {
      if (notesInFolder.length === 0) {
        const emptyItem = document.createElement('p');
        emptyItem.className = 'empty-msg folder-empty';
        emptyItem.textContent = t('folderEmpty');
        folderEl.appendChild(emptyItem);
      } else {
        notesInFolder.forEach(note => {
          const item = document.createElement('div');
          item.classList.add('note-item');
          if (note.id === currentId) item.classList.add('active');

          const hasAtt = note.attachments && note.attachments.length > 0;
          item.innerHTML = `
            <span class="note-item-title">${hasAtt ? '📎' : '📄'} ${note.title || t('untitled')}</span>
            <button class="btn-delete-note" title="Delete note">✕</button>
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
  noteTitleInput.value = note.title || t('untitled');
  noteContentInput.value = note.content || '';

  currentAttachments = note.attachments || [];
  renderAttachments();

  historyStack = [note.content || ''];
  historyIndex = 0;
  updateUndoRedoButtons();

  clearTimeout(autoFormatDebounce);
  lastAutoFormattedContent = note.content || '';

  if (folderSelect) folderSelect.value = note.folder || '';

  clearSelectionContext();
  removeWikilinkDropdown();
  saveStatus.textContent = t('saved');

  refreshPreview();

  await loadNotesList();
  await renderBacklinksUI();
  await runRAGCrossReferencing();

  refreshPreview();
}

async function createNewNote() {
  const newNote = {
    id: Date.now().toString(),
    title: t('newNoteTitle'),
    content: '',
    folder: null,
    attachments: [],
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
    if (notes.length > 0) await switchNote(notes[0]);
    else await createNewNote();
  } else {
    await loadNotesList();
    await renderBacklinksUI();
  }
}

// ==========================================
// Selection Context
// ==========================================
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

// ==========================================
// Wikilinks Auto-complete
// ==========================================
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

// ==========================================
// Backlinks Engine
// ==========================================
async function getBacklinksForNote(targetTitle) {
  if (!targetTitle || targetTitle === t('untitled')) return [];

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

    if (folderTree && folderTree.parentNode) {
      folderTree.parentNode.appendChild(backlinksContainer);
    }
  }

  const currentTitle = noteTitleInput.value;
  const backlinks = await getBacklinksForNote(currentTitle);

  backlinksContainer.innerHTML = `
    <hr class="section-divider" />
    <div class="collapsible-header" id="backlinks-toggle">
      <p class="section-title">${t('backlinks', backlinks.length)}</p>
      <button class="collapse-toggle-btn" title="Show/Hide">
        ${backlinksCollapsed ? t('show') : t('hide')}
      </button>
    </div>
    <div class="collapsible-body ${backlinksCollapsed ? 'collapsed' : ''}" id="backlinks-body">
      <div class="backlinks-list">
        ${backlinks.length === 0
      ? `<p class="empty-msg" style="font-size:11px; opacity:0.6;">${t('noBacklinks')}</p>`
      : backlinks.map(bNote => `
            <div class="backlink-item" data-id="${bNote.id}">
              <span class="backlink-title">${t('backlinkTitle', bNote.title || t('untitled'))}</span>
            </div>
          `).join('')
    }
      </div>
      <div id="rag-suggestions-wrapper"></div>
    </div>
  `;

  backlinksContainer.querySelector('#backlinks-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    backlinksCollapsed = !backlinksCollapsed;
    const body = backlinksContainer.querySelector('#backlinks-body');
    const btn = backlinksContainer.querySelector('.collapse-toggle-btn');
    body.classList.toggle('collapsed', backlinksCollapsed);
    btn.textContent = backlinksCollapsed ? t('show') : t('hide');
  });

  backlinksContainer.querySelectorAll('.backlink-item').forEach(item => {
    item.addEventListener('click', async () => {
      const allNotes = await getNotesFromStorage();
      const targetNote = allNotes.find(n => n.id === item.dataset.id);
      if (targetNote) switchNote(targetNote);
    });
  });
}

// ==========================================
// RAG Cross-Referencing
// ==========================================
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

  const notesContext = otherNotes.map(n => ({
    title: n.title,
    snippet: n.content.substring(0, 180)
  }));

  const aiPrompt = t('prompts.ragEngine', currentTitle, currentContent, notesContext);

  try {
    const annaLLM = anna?.llm;
    if (!annaLLM || typeof annaLLM.complete !== 'function') return;

    const response = await annaLLM.complete({
      messages: [{ role: 'user', content: aiPrompt }]
    });

    const rawResult = parseLLMResponse(response).trim();
    const cleanJsonStr = rawResult.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const suggestions = JSON.parse(cleanJsonStr);

    if (Array.isArray(suggestions) && suggestions.length > 0) {
      wrapper.innerHTML = `
        <hr class="section-divider" />
        <p class="section-title">${t('ragTitle')}</p>
        <div class="rag-list">
          ${suggestions.map(item => `
            <div class="rag-suggestion-item">
              <div class="rag-item-header">
                <span>🧠 [[${item.title}]]</span>
                <button class="btn-insert-link" data-title="${item.title}">${t('ragInsert')}</button>
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

// ==========================================
// Deterministic Auto Keyword Linking Engine
// ==========================================
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
    saveStatus.textContent = t('autoLinked');
    refreshPreview();
  }
}

// ==========================================
// AI Integration & Auto-Format
// ==========================================
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
      btnReplace.innerHTML = currentLang === 'th' ? '🔄 แทนที่ข้อความที่ไฮไลต์' : '🔄 Replace highlighted text';
      btnReplace.onclick = () => applyToNote('replace', rawAiText);
      actionBox.appendChild(btnReplace);
    }

    const btnAppend = document.createElement('button');
    btnAppend.className = 'ai-action-btn';
    btnAppend.innerHTML = currentLang === 'th' ? '➕ ต่อท้ายโน้ต' : '➕ Append to note';
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
  saveStatus.textContent = t('saved');
  clearSelectionContext();
  renderBacklinksUI();
  refreshPreview();
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

  const aiPrompt = t('prompts.autoFormat', otherTitles, content);

  try {
    const response = await annaLLM.complete({
      messages: [{ role: 'user', content: aiPrompt }]
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
    saveStatus.textContent = t('autoFormatted');
    refreshPreview();
  } catch (err) {
    console.error('Auto-format AI error:', err);
  }
}

async function handleSendToAI() {
  const userMessage = aiInput.value.trim();
  if (!userMessage) return;

  appendChatBubble('user', userMessage);
  aiInput.value = '';

  const loadingBubble = appendChatBubble('ai', t('aiAnalyzing'));

  try {
    let aiResponseText = '';
    let contextPrompt = selectedText
      ? (currentLang === 'th'
        ? `ข้อความที่ผู้ใช้ไฮไลต์: "${selectedText}"\n`
        : `Text highlighted by user: "${selectedText}"\n`)
      : '';

    const aiPrompt = t('prompts.chat',
      contextPrompt,
      noteTitleInput.value,
      noteContentInput.value,
      userMessage
    );

    const annaLLM = anna?.llm;
    if (annaLLM && typeof annaLLM.complete === 'function') {
      const response = await annaLLM.complete({
        messages: [{ role: 'user', content: aiPrompt }]
      });
      aiResponseText = parseLLMResponse(response);
    } else {
      aiResponseText = t('aiConnectionMissing');
    }

    loadingBubble.remove();
    appendChatBubble('ai', aiResponseText, aiResponseText);
  } catch (error) {
    console.error('AI Error:', error);
    loadingBubble.textContent = t('aiError');
  }
}

// ==========================================
// Zip Export & Import Backup Engine (Pure JS)
// ==========================================
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
    saveStatus.textContent = t('exportEmpty');
    return;
  }

  const validFolderIds = new Set(FOLDERS.map(f => f.id));
  const usedPaths = new Set();

  // Archive always uses English folder labels for portability.
  const folderArchiveLabel = (id) => {
    const def = FOLDERS.find(f => f.id === id);
    if (!def) return I18N.en.folders.inbox.label;
    return I18N.en.folders[def.i18nKey].label;
  };

  const files = notes.map(note => {
    const folderId = validFolderIds.has(note.folder) ? note.folder : 'inbox';
    const folderLabelStr = folderArchiveLabel(folderId);
    const safeTitle = sanitizeFilename(note.title);
    let path = `${folderLabelStr}/${safeTitle}.md`;
    let counter = 2;
    while (usedPaths.has(path)) {
      path = `${folderLabelStr}/${safeTitle} (${counter}).md`;
      counter++;
    }
    usedPaths.add(path);

    return { path, content: note.content || '' };
  });

  try {
    btnExportVault.disabled = true;
    btnExportVault.textContent = t('exportingVault');

    const blob = buildZipBlob(files);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `a2nd-brain-backup-${dateStr}.zip`);

    saveStatus.textContent = t('exportSuccess', notes.length);
  } catch (err) {
    console.error('Export vault error:', err);
    saveStatus.textContent = t('exportFailed');
  } finally {
    btnExportVault.disabled = false;
    btnExportVault.textContent = t('exportVault');
  }
}

// ==========================================
// ZIP Unpacker / Parser for Restore
// ==========================================
async function parseZipArchive(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder('utf-8');
  const files = [];

  let eocdOffset = -1;
  for (let i = arrayBuffer.byteLength - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP format');
  }

  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);

  let cursor = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;

    const compressionMethod = view.getUint16(cursor + 10, true);
    const filenameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const nameBuffer = new Uint8Array(arrayBuffer, cursor + 46, filenameLen);
    const filename = decoder.decode(nameBuffer);

    cursor += 46 + filenameLen + extraLen + commentLen;

    if (filename.endsWith('/') || compressionMethod !== 0) continue;

    const localFilenameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localFilenameLen + localExtraLen;
    const compressedSize = view.getUint32(localHeaderOffset + 18, true);

    const contentBuffer = new Uint8Array(arrayBuffer, dataOffset, compressedSize);
    const content = decoder.decode(contentBuffer);

    files.push({ path: filename, content });
  }

  return files;
}

async function handleImportZip(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    btnImportVault.disabled = true;
    btnImportVault.textContent = t('importingVault');
    saveStatus.textContent = t('importingVaultRestore');

    const arrayBuffer = await file.arrayBuffer();
    const files = await parseZipArchive(arrayBuffer);

    if (files.length === 0) {
      saveStatus.textContent = t('importNoMarkdown');
      return;
    }

    const existingNotes = await getNotesFromStorage();
    let importedCount = 0;

    // Build a set of {lang, label} pairs for folder matching
    const labelLookup = new Map();
    ['en', 'th'].forEach(lang => {
      const dict = I18N[lang].folders;
      Object.keys(dict).forEach(key => {
        const label = dict[key].label.toLowerCase();
        labelLookup.set(label, key);
      });
    });

    files.forEach(file => {
      if (!file.path.endsWith('.md')) return;

      const pathParts = file.path.split('/');
      let folderId = null;
      const filename = pathParts[pathParts.length - 1];

      if (pathParts.length > 1) {
        const folderName = pathParts[0].toLowerCase();
        const matchedKey = labelLookup.get(folderName);
        if (matchedKey && matchedKey !== 'inbox') {
          const matchedFolder = FOLDERS.find(f => f.i18nKey === matchedKey || f.id === matchedKey);
          if (matchedFolder) folderId = matchedFolder.id;
        }
      }

      const noteTitle = filename.replace(/\.md$/i, '').replace(/\s\(\d+\)$/, '').trim();
      const existingIndex = existingNotes.findIndex(n =>
        (n.title || '').toLowerCase() === noteTitle.toLowerCase()
      );

      if (existingIndex >= 0) {
        existingNotes[existingIndex].content = file.content;
        existingNotes[existingIndex].folder = folderId;
        existingNotes[existingIndex].updatedAt = new Date().toISOString();
      } else {
        existingNotes.unshift({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          title: noteTitle || t('untitled'),
          content: file.content,
          folder: folderId,
          attachments: [],
          updatedAt: new Date().toISOString()
        });
      }
      importedCount++;
    });

    await saveNotesToStorage(existingNotes);
    await loadNotesList();

    if (existingNotes.length > 0) await switchNote(existingNotes[0]);

    saveStatus.textContent = t('importSuccess', importedCount);
  } catch (err) {
    console.error('Import backup error:', err);
    saveStatus.textContent = t('importFailed');
  } finally {
    btnImportVault.disabled = false;
    btnImportVault.textContent = t('importVault');
    fileImportInput.value = '';
  }
}

// ==========================================
// 📖 Markdown Preview Mode
// ==========================================
function toggleViewMode() {
  viewMode = viewMode === 'edit' ? 'preview' : 'edit';

  if (viewMode === 'preview') {
    renderPreview();
    noteContentInput.classList.add('hidden');
    notePreviewEl.classList.remove('hidden');
    viewToggleIcon.textContent = '📝';
    viewToggleLabel.textContent = t('write');
    btnToggleView.classList.add('preview-active');
    btnToggleView.title = t('toggleViewTitle');
  } else {
    noteContentInput.classList.remove('hidden');
    notePreviewEl.classList.add('hidden');
    viewToggleIcon.textContent = '👁';
    viewToggleLabel.textContent = t('read');
    btnToggleView.classList.remove('preview-active');
    btnToggleView.title = t('toggleViewTitle');
    noteContentInput.focus();
  }
}

function refreshPreview() {
  if (viewMode !== 'preview') return;
  if (!notePreviewEl) return;

  if (notePreviewEl.classList.contains('hidden')) {
    notePreviewEl.classList.remove('hidden');
    noteContentInput.classList.add('hidden');
  }

  renderPreview();
}

function renderPreview() {
  if (!notePreviewEl) return;

  const raw = noteContentInput.value || '';
  if (!raw.trim()) {
    notePreviewEl.innerHTML = `<p class="empty-preview">${t('emptyPreview')}</p>`;
    return;
  }

  notePreviewEl.innerHTML = renderMarkdown(raw);
}

/**
 * Vanilla Markdown Renderer
 */
function renderMarkdown(md) {
  if (!md) return '';

  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const codeBlocks = [];
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (m, lang, code) => {
    const idx = codeBlocks.length;
    const langClass = lang ? ` class="lang-${lang}"` : '';
    codeBlocks.push(`<pre><code${langClass}>${code.replace(/\n$/, '')}</code></pre>`);
    return `\n\u0001CB${idx}\u0001\n`;
  });

  const inlineCodes = [];
  html = html.replace(/`([^`\n]+)`/g, (m, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code>${code}</code>`);
    return `\u0001IC${idx}\u0001`;
  });

  html = html.replace(/\[\[([^\]\n]+?)\]\]/g, (m, title) => {
    const clean = title.trim();
    return `<a class="wikilink" data-title="${clean}">🔗 ${clean}</a>`;
  });

  html = html.replace(/\[([^\]\n]+?)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');

  html = html.replace(/\*\*\*([^*\n]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  html = html.replace(/___([^_\n]+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>');
  html = html.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');

  const lines = html.split('\n');
  const out = [];
  let inUl = false, inOl = false, inBq = false;

  const closeList = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  const closeBq = () => {
    if (inBq) { out.push('</blockquote>'); inBq = false; }
  };

  for (const rawLine of lines) {
    const line = rawLine;

    if (/^\u0001CB\d+\u0001$/.test(line.trim())) {
      closeList(); closeBq();
      out.push(line.trim());
      continue;
    }

    const hMatch = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (hMatch) {
      closeList(); closeBq();
      const lvl = hMatch[1].length;
      out.push(`<h${lvl}>${hMatch[2]}</h${lvl}>`);
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      closeList(); closeBq();
      out.push('<hr>');
      continue;
    }

    const bqMatch = line.match(/^>\s?(.*)$/);
    if (bqMatch) {
      closeList();
      if (!inBq) { out.push('<blockquote>'); inBq = true; }
      out.push(`<p>${bqMatch[1] || '&nbsp;'}</p>`);
      continue;
    } else if (inBq) closeBq();

    const ulMatch = line.match(/^\s*[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${ulMatch[1]}</li>`);
      continue;
    } else if (inUl && !ulMatch) { out.push('</ul>'); inUl = false; }

    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${olMatch[1]}</li>`);
      continue;
    } else if (inOl && !olMatch) { out.push('</ol>'); inOl = false; }

    if (line.trim() === '') { out.push(''); continue; }
    out.push(`<p>${line}</p>`);
  }

  closeList();
  closeBq();

  html = out.join('\n');

  html = html.replace(/\u0001CB(\d+)\u0001/g, (m, i) => codeBlocks[parseInt(i)]);
  html = html.replace(/\u0001IC(\d+)\u0001/g, (m, i) => inlineCodes[parseInt(i)]);

  return html;
}

async function handlePreviewClick(e) {
  const link = e.target.closest('.wikilink');
  if (!link) return;

  const title = link.dataset.title;
  if (!title) return;

  const allNotes = await getNotesFromStorage();
  const target = allNotes.find(n => (n.title || '').trim() === title);

  if (target) {
    if (viewMode === 'preview') toggleViewMode();
    await switchNote(target);
  } else {
    saveStatus.textContent = t('noteNotFound', title);
    setTimeout(() => { saveStatus.textContent = t('saved'); }, 2200);
  }
}