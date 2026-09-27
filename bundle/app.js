// ตรวจสอบและอิมพอร์ต anna SDK (รองรับการรันบน Anna Platform)
let annaHost = window.anna;

// สถิติและ State เบื้องต้นของแอป
const state = {
  currentNote: {
    title: 'ยินดีต้อนรับสู่ A 2ND Brain',
    content: 'พิมพ์ไอเดีย บันทึก หรือข้อความของคุณลงในพื้นที่นี้...'
  },
  chatHistory: []
};

// UI Elements
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const chatHistoryContainer = document.getElementById('ai-chat-history');
const aiInput = document.getElementById('ai-input');
const btnSendAi = document.getElementById('btn-send-ai');
const btnNewNote = document.getElementById('btn-new-note');

// เริ่มต้นการทำงานเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  // 1. ส่งข้อความหา AI
  btnSendAi.addEventListener('click', handleSendToAI);
  aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendToAI();
  });

  // 2. ปุ่มเพิ่มโน้ตใหม่
  btnNewNote.addEventListener('click', () => {
    noteTitleInput.value = 'โน้ตใหม่ที่ยังไม่มีชื่อ';
    noteContentInput.value = '';
    noteTitleInput.focus();
  });
}

// ฟังก์ชันเพิ่ม Bubble ข้อความในแชท
function appendChatBubble(sender, text) {
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', sender);
  bubble.textContent = text;
  chatHistoryContainer.appendChild(bubble);
  chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
  return bubble;
}

// ฟังก์ชันส่งคำถามไปหา Anna AI LLM
async function handleSendToAI() {
  const userMessage = aiInput.value.trim();
  if (!userMessage) return;

  // แสดงข้อความของผู้ใช้
  appendChatBubble('user', userMessage);
  aiInput.value = '';

  // แสดงสถานะ AI กำลังคิด
  const loadingBubble = appendChatBubble('ai', '🧠 AI กำลังคิดวิเคราะห์โครงสร้างสมอง...');

  try {
    let aiResponseText = '';

    // ตรวจสอบว่ามี Anna SDK หรือไม่
    if (window.anna && window.anna.llm) {
      const prompt = `
        คุณคือ AI Architect ของแอปบันทึกความรู้ชื่อ A2ND Brain
        เป้าหมายของคุณคือคอยเป็นโค้ชช่วย Onboard ผู้ใช้ใหม่ในการจัดระเบียบความคิด
        
        ข้อความจากผู้ใช้: "${userMessage}"
        เนื้อหาโน้ตปัจจุบันที่ผู้ใช้เปิดอยู่: "${noteContentInput.value}"

        คำแนะนำ: ตอบสั้นกระชับ เป็นกันเอง ให้คำแนะนำเรื่องการตั้งโฟลเดอร์ หรือการตั้ง Tag ที่เหมาะสม
      `;

      const response = await window.anna.llm.complete({ prompt });
      aiResponseText = response.text || response;
    } else {
      // Mockup Response หากรันใน Browser แบบไม่ได้ต่อกับ Anna Host SDK
      aiResponseText = `(Dev Mock) ผมได้รับข้อความ "${userMessage}" แล้วครับ! เมื่อแอปของคุณรันบน Anna OS ระบบจะวิเคราะห์และแนะนำการจัดโฟลเดอร์สำหรับ "${userMessage}" ให้อัตโนมัติทันทีครับ`;
    }

    loadingBubble.textContent = aiResponseText;
  } catch (error) {
    console.error('AI Error:', error);
    loadingBubble.textContent = 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI';
  }
}