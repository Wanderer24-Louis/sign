// 🔐 未登入就導回
if (sessionStorage.getItem("authorized") !== "1") {
  window.location.href = "index.html";
}

// 📝 全域
let members = [];

// 🚀 初始化
document.addEventListener('DOMContentLoaded', init);

function init() {
  // UI 綁定
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('generateBtn').addEventListener('click', generateReport);
  document.getElementById('copyBtn').addEventListener('click', copyResult);
  document.getElementById('clearBtn').addEventListener('click', clearAll);

  // 預設今天日期
  document.getElementById('dateInput').valueAsDate = new Date();

  // 載入名單
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

  // 任一輸入變更就存檔
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', saveCurrentData);
  });
}

// 💾 存資料到 localStorage
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

// 📥 載入上次填寫
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

// 🧮 產生報告（日期必填 & 每人需單選）
function generateReport() {
  const date = document.getElementById('dateInput').value;
  if (!date) return alert("請先填寫日期！");

  const present = [], off = [], train = [], duty = [];

  for (const name of members) {
    const selected = document.querySelector(`input[name="${name}-status"]:checked`);
    if (!selected) return alert(`請為 ${name} 選擇狀態！`);
    const status = selected.value;
    const trainTime = document.querySelector(`.trainTime[data-name="${name}"]`).value.trim();
    const dutyLoc = document.querySelector(`.dutyLoc[data-name="${name}"]`).value.trim();

    if (status === "在營") present.push(name);
    else if (status === "休假") off.push(name);
    else if (status === "受訓") train.push({ name, time: trainTime });
    else if (status === "公勤") duty.push({ name, loc: dutyLoc });
  }

  const total = members.length;
  const absent = off.length + train.length + duty.length;
  const real = present.length;

  let result = `專案作業組${new Date(date).getMonth()+1}月${new Date(date).getDate()}日出勤統計：\n`;
  result += `應到${total}、事故${absent}、實到${real}\n`;
  if (present.length) result += `在營(${present.length})：${present.join("、")}\n\n`;

  result += `事故(${absent})：\n`;
  let count = 1;
  if (off.length)  result += `${count++}.休假：${off.join("、")}\n`;
  if (train.length) result += `${count++}.受訓：${train.map(t => `${t.name}${t.time ? `(${t.time})` : ""}`).join("、")}\n`;
  if (duty.length)  result += `${count++}.公勤：${duty.map(d => `${d.name}${d.loc ? `(${d.loc})` : ""}`).join("、")}\n`;

  document.getElementById('result').textContent = result.trim();
}

// 📋 一鍵複製
function copyResult() {
  const text = document.getElementById('result').textContent;
  if (!text) return alert("請先產生結果！");
  navigator.clipboard.writeText(text);
  alert("✅ 已複製到剪貼簿！");
}

// 🧹 清除所有填寫
function clearAll() {
  if (!confirm("確定要清除所有填寫資料嗎？")) return;
  localStorage.removeItem('attendanceData');
  members.forEach(name => {
    document.querySelector(`input[name="${name}-status"]:checked`)?.checked = false;
    document.querySelector(`.trainTime[data-name="${name}"]`).value = '';
    document.querySelector(`.dutyLoc[data-name="${name}"]`).value = '';
  });
  document.getElementById('result').textContent = '';
}
