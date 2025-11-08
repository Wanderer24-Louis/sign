let members = [];

async function loadMembers() {
  try {
    const res = await fetch('list.json');
    const data = await res.json();
    members = data.members;
    renderMemberList();
    loadPreviousData(); // 載入上次資料
  } catch (e) {
    document.getElementById('memberContainer').textContent = '❌ 名單載入失敗';
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
      <label><input type="checkbox" class="present" data-name="${name}"> 在營</label>
      <label><input type="checkbox" class="off" data-name="${name}"> 休假</label>
      <label><input type="checkbox" class="train" data-name="${name}"> 受訓</label>
      <input type="text" class="trainTime" data-name="${name}" placeholder="ex: 7/28-11/14">
      <label><input type="checkbox" class="duty" data-name="${name}"> 公勤</label>
      <input type="text" class="dutyLoc" data-name="${name}" placeholder="ex: 台北10/1-10/10">
    `;
    container.appendChild(div);
  });

  // 每次勾選或修改文字欄時自動儲存
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', saveCurrentData);
  });
}

// 保存當前填寫資料到 localStorage
function saveCurrentData() {
  const data = {};
  members.forEach(name => {
    data[name] = {
      present: document.querySelector(`.present[data-name="${name}"]`).checked,
      off: document.querySelector(`.off[data-name="${name}"]`).checked,
      train: document.querySelector(`.train[data-name="${name}"]`).checked,
      trainTime: document.querySelector(`.trainTime[data-name="${name}"]`).value,
      duty: document.querySelector(`.duty[data-name="${name}"]`).checked,
      dutyLoc: document.querySelector(`.dutyLoc[data-name="${name}"]`).value
    };
  });
  localStorage.setItem('attendanceData', JSON.stringify(data));
}

// 載入上次填寫資料
function loadPreviousData() {
  const saved = localStorage.getItem('attendanceData');
  if (!saved) return;
  const data = JSON.parse(saved);
  members.forEach(name => {
    if (!data[name]) return;
    document.querySelector(`.present[data-name="${name}"]`).checked = data[name].present;
    document.querySelector(`.off[data-name="${name}"]`).checked = data[name].off;
    document.querySelector(`.train[data-name="${name}"]`).checked = data[name].train;
    document.querySelector(`.trainTime[data-name="${name}"]`).value = data[name].trainTime || '';
    document.querySelector(`.duty[data-name="${name}"]`).checked = data[name].duty;
    document.querySelector(`.dutyLoc[data-name="${name}"]`).value = data[name].dutyLoc || '';
  });
}

// 彙整統計
function generateReport() {
  const date = document.getElementById('dateInput').value;
  const present = [];
  const off = [];
  const train = [];
  const duty = [];

  members.forEach(name => {
    const isPresent = document.querySelector(`.present[data-name="${name}"]`).checked;
    const isOff = document.querySelector(`.off[data-name="${name}"]`).checked;
    const isTrain = document.querySelector(`.train[data-name="${name}"]`).checked;
    const isDuty = document.querySelector(`.duty[data-name="${name}"]`).checked;
    const trainTime = document.querySelector(`.trainTime[data-name="${name}"]`).value.trim();
    const dutyLoc = document.querySelector(`.dutyLoc[data-name="${name}"]`).value.trim();

    if (isPresent) present.push(name);
    if (isOff) off.push(name);
    if (isTrain) train.push({ name, time: trainTime });
    if (isDuty) duty.push({ name, loc: dutyLoc });
  });

  const total = members.length;
  const absent = off.length + train.length + duty.length;
  const real = present.length;

  let result = `專案作業組${date ? new Date(date).getMonth()+1 + "月" + new Date(date).getDate() + "日" : ""}出勤統計：\n`;
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
document.getElementById('generateBtn').addEventListener('click', generateReport);
document.getElementById('copyBtn').addEventListener('click', () => {
  const text = document.getElementById('result').textContent;
  if (!text) return alert("請先產生結果！");
  navigator.clipboard.writeText(text);
  alert("✅ 已複製到剪貼簿！");
});

document.addEventListener('DOMContentLoaded', loadMembers);
