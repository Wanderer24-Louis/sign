let members = [];

async function loadMembers() {
  try {
    const res = await fetch('list.json');
    const data = await res.json();
    members = data.members;
    renderMemberList();
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
      <label><input type="checkbox" class="present" data-name="${name}"> ${name} 在營</label>
      <label><input type="checkbox" class="off" data-name="${name}"> 休假</label>
      <label><input type="checkbox" class="train" data-name="${name}"> 受訓</label>
      <input type="text" class="trainTime" data-name="${name}" placeholder="ex: 7/28-11/14">
      <label><input type="checkbox" class="duty" data-name="${name}"> 公勤</label>
      <input type="text" class="dutyLoc" data-name="${name}" placeholder="ex: 台北10/1-10/10">
    `;
    container.appendChild(div);
  });
}

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
    const trainTime = document.querySelector(`.trainTime[data-name="${name}"]`).value;
    const dutyLoc = document.querySelector(`.dutyLoc[data-name="${name}"]`).value;

    if (isPresent) present.push(name);
    if (isOff) off.push(name);
    if (isTrain) train.push({ name, time: trainTime });
    if (isDuty) duty.push({ name, loc: dutyLoc });
  });

  const total = members.length;
  const absent = off.length + train.length + duty.length;
  const real = present.length;

  let result = `專案作業${date ? new Date(date).getMonth()+1 + "月" + new Date(date).getDate() + "日" : ""}出勤統計：\n`;
  result += `應到${total}、事故${absent}、實到${real}\n`;

  if (present.length) {
    result += `在營(${present.length})：${present.join("、")}\n\n`;
  }

  result += `事故(${absent})：\n`;

  let count = 1;
  if (off.length) {
    result += `${count++}.休假：${off.join("、")}\n`;
  }
  if (train.length) {
    result += `${count++}.受訓：${train.map(t => `${t.name}${t.time ? `(${t.time})` : ""}`).join("、")}\n`;
  }
  if (duty.length) {
    result += `${count++}.公勤：${duty.map(d => `${d.name}${d.loc ? `(${d.loc})` : ""}`).join("、")}\n`;
  }

  document.getElementById('result').textContent = result;
}

document.getElementById('generateBtn').addEventListener('click', generateReport);

document.getElementById('copyBtn').addEventListener('click', () => {
  const text = document.getElementById('result').textContent;
  navigator.clipboard.writeText(text);
  alert("✅ 已複製到剪貼簿！");
});

document.addEventListener('DOMContentLoaded', loadMembers);
