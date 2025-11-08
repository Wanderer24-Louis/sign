/**********************
 * 🔐 簡易密碼驗證設定
 **********************/
const PASSWORD_HASH = "fb351106dcf8005ace790cd95144020e255af13443c5298fb585c9696cce173e"; 
// ↑ 這是空字串的 SHA-256，請換成你的密碼 SHA-256（下方教你怎麼生）

// 產生 SHA-256(hex)
async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// 驗證流程
async function tryUnlock() {
  const pwd = document.getElementById('pwd').value;
  const msg = document.getElementById('lockmsg');
  const hash = await sha256Hex(pwd);

  if (hash === PASSWORD_HASH) {
    sessionStorage.setItem("authed", "1"); // 本次瀏覽器分頁記住
    document.getElementById('lockscreen').style.display = "none";
    document.getElementById('app').style.display = "block";
    initApp();
  } else {
    msg.textContent = "密碼錯誤，請再試一次。";
  }
}

// 綁定按鈕 / Enter
document.addEventListener('DOMContentLoaded', () => {
  const authed = sessionStorage.getItem("authed") === "1";
  if (authed) {
    document.getElementById('lockscreen').style.display = "none";
    document.getElementById('app').style.display = "block";
    initApp();
  } else {
    document.getElementById('unlockBtn').addEventListener('click', tryUnlock);
    document.getElementById('pwd').addEventListener('keydown', (e) => {
      if (e.key === "Enter") tryUnlock();
    });
  }
});

/**********************
 * ✅ 你的原本應用程式
 **********************/
let members = [];

async function loadMembers() {
  try {
    const res = await fetch('./list.json');
    const data = await res.json();
    members = data.members;
    renderMemberList();
    loadPreviousData(); // 載入上次資料
  } catch (e) {
    document.getElementById('memberContainer').textContent = '❌ 名單載入失敗';
    console.error(e);
  }
}

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

  // 自動儲存資料
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', saveCurrentData);
  });
}

// 儲存資料到 localStorage
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

// 載入上次資料
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

// 生成統計報告（日期必填 + 單選檢查）
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
  if (off.length) result += `${count++}.休假：${off.join("、")}\n`;
  if (train.length) result += `${count++}.受訓：${train.map(t => `${t.name}${t.time ? `(${t.time})` : ""}`).join("、")}\n`;
  if (duty.length) result += `${count++}.公勤：${duty.map(d => `${d.name}${d.loc ? `(${d.loc})` : ""}`).join("、")}\n`;

  document.getElementById('result').textContent = result.trim();
}

// 一鍵複製
function copyResult() {
  const text = document.getElementById('result').textContent;
  if (!text) return alert("請先產生結果！");
  navigator.clipboard.writeText(text);
  alert("✅ 已複製到剪貼簿！");
}

// 清除所有填寫資料
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

// 綁定 App 事件並預設日期
function initApp() {
  // 預設今天日期
  document.getElementById('dateInput').valueAsDate = new Date();

  // 綁定按鈕
  document.getElementById('generateBtn').addEventListener('click', generateReport);
  document.getElementById('copyBtn').addEventListener('click', copyResult);
  document.getElementById('clearBtn').addEventListener('click', clearAll);

  // 載入名單
  loadMembers();
}
