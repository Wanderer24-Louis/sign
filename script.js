// 🔐 未登入就導回
if (sessionStorage.getItem("authorized") !== "1") {
  window.location.href = "index.html";
}

// 📝 全域
let members = [];

// 🚀 初始化
document.addEventListener('DOMContentLoaded', init);

function init() {
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('generateBtn').addEventListener('click', generateReport);
  document.getElementById('copyBtn').addEventListener('click', copyResult);
  document.getElementById('clearBtn').addEventListener('click', clearAll);

  document.getElementById('dateInput').valueAsDate = new Date();
  loadMembers();
}

// 🔚 登出
function logout() {
  sessionStorage.removeItem('authorized');
  window.location.href = "index.html";
}

// 👥 讀取名單
async function loadMembers() {
  const container = document.getElementById('memberContainer');
  try {
    const res = await fetch('./list.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.members || !Array.isArray(data.members)) {
      throw new Error('JSON 結構錯誤，需有 members 陣列');
    }
    members = data.members;
    renderMemberList();
    loadPreviousData();
  } catch (e) {
    console.error('名單載入失敗：', e);
    container.textContent = '❌ 名單載入失敗（請檢查 list.json 路徑/格式與大小寫）';
  }
}

// 🧱 畫面：成員列
function renderMemberList() {
  const container = document.getElementById('memberContainer');
  container.innerHTML = '';
  members.forEach(name => {
    const div = document.createElement('div');
    div.className = 'member';
    div.innerHTML = `
      <span>${name}</span>
      <label><input type="radio" name="${name}-status" class="status" data-name="${name}" value="在營"> 在營</label>
      <label><input type="radio" name="${name}-status" class="status" data-name="${name}" value="休假"> 休假</label>
      <label><input type="radio" name="${name}-status" class="status" data-name="${name}" value="受訓"> 受訓</label>
      <input type="text" class="trainTime" data-name="${name}" placeholder="ex: 7/28-11/14">
      <label><input type="radio" name="${name}-status" class="status" data-name="${name}" value="公勤"> 公勤</label>
      <input type="text" class="dutyLoc" data-name="${name}" placeholder="ex: 台北10/1-10/10">
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', saveCurrentData);
  });
}

// 💾 存資料
function saveCurrentData() {
  const data = {};
  members.forEach(name => {
    const selected = document.querySelector(`input[name="${name}-status"]:checked`);
    const status = selected ? selected.value : "";
    const trainTime = document.querySelector(`.trainTime[data-name="${name}"]`).value;
    const dutyLoc = document.querySelector(`.dutyLoc[data-name="${name}"]`).value;
    data[name] = { status, trainTime, dutyLoc };
  });
  localStorage.setItem('attendanceData', JSON.stringify(data));
}

// 📥 載入上次資料
function loadPreviousData() {
  const saved = localStorage.getItem('attendanceData');
  if (!saved) return;
  const data = JSON.parse(saved);
  members.forEach(name => {
    const info = data[name];
    if (!info) return;
    if (info.status) {
      const radio = document.querySelector(`input[name="${name}-status"][value="${info.status}"]`);
      if (radio) radio.checked = true;
    }
    document.querySelector(`.trainTime[data-name="${name}"]`).value = info.trainTime || '';
    document.querySelector(`.dutyLoc[data-name="${name}"]`).value = info.dutyLoc || '';
  });
}

// 🧮 產生報告
function generateReport() {
  const date = document
