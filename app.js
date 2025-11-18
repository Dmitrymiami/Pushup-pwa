
const STORAGE_KEY = 'pushup_challenge_web_v2';
const DEFAULT_START = '2025-11-17';
let state = {
  startDate: DEFAULT_START,
  completed: Array(100).fill(false)
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const p = JSON.parse(raw);
      state.startDate = p.startDate || DEFAULT_START;
      if (Array.isArray(p.completed)) {
        state.completed = p.completed.slice(0,100);
        if (state.completed.length < 100) state.completed = state.completed.concat(Array(100 - state.completed.length).fill(false));
      }
    } catch(e) {
      console.error('load parse', e);
    }
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dateForIndex(i) {
  const sd = new Date(state.startDate + 'T00:00:00');
  return new Date(sd.getTime() + i*24*60*60*1000);
}

function indexForDate(date) {
  const sd = new Date(state.startDate + 'T00:00:00');
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((d - sd)/(24*60*60*1000));
}

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function render() {
  document.getElementById('startDateText').textContent = formatDate(new Date(state.startDate));
  document.getElementById('endDateText').textContent = formatDate(dateForIndex(99));
  const todayIdx = indexForDate(new Date());
  const inChallenge = todayIdx >=0 && todayIdx < 100;
  const doneCount = state.completed.filter(Boolean).length;
  const percent = Math.round((doneCount/100)*100);
  document.getElementById('completedCount').textContent = `${doneCount} / 100`;
  document.getElementById('percentDone').textContent = `${percent}%`;
  document.getElementById('progressText').textContent = `${doneCount} / 100`;
  document.getElementById('percentText').textContent = `${percent}%`;
  const circle = document.getElementById('progressCircle');
  const dash = Math.round((percent/100)*100);
  circle.setAttribute('stroke-dasharray', `${dash}, 100`);
  const dayTitle = document.getElementById('dayTitle');
  const toggle = document.getElementById('toggleToday');
  const todayDate = document.getElementById('todayDate');
  if (inChallenge) {
    dayTitle.textContent = `День ${todayIdx+1} из 100`;
    toggle.disabled = false;
    toggle.textContent = state.completed[todayIdx] ? 'Отменить отметку за сегодня' : 'Отметить как выполнено';
    todayDate.textContent = formatDate(dateForIndex(todayIdx));
    toggle.onclick = () => {
      state.completed[todayIdx] = !state.completed[todayIdx];
      saveState();
      render();
    }
  } else {
    toggle.disabled = true;
    if (todayIdx < 0) dayTitle.textContent = 'Челлендж ещё не начался';
    else dayTitle.textContent = 'Челлендж завершён';
    todayDate.textContent = '';
  }
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  for (let i=0;i<100;i++) {
    const d = dateForIndex(i);
    const div = document.createElement('div');
    div.className = 'day' + (state.completed[i] ? ' done' : '') + (i===todayIdx ? ' today' : '');
    div.innerHTML = `<div class="label">D${i+1}</div><div class="date">${d.getDate()}.${d.getMonth()+1}</div>`;
    div.onclick = () => {
      state.completed[i] = !state.completed[i];
      saveState();
      render();
    };
    grid.appendChild(div);
  }
  let streak = 0;
  let endIdx = todayIdx;
  if (endIdx >= 100) endIdx = 99;
  if (endIdx < 0) {
    let last = -1;
    for (let i=99;i>=0;i--) if (state.completed[i]) { last = i; break; }
    endIdx = last;
  }
  if (endIdx >= 0) {
    for (let i=endIdx;i>=0;i--) {
      if (state.completed[i]) streak++;
      else break;
    }
  }
  document.getElementById('streak').textContent = String(streak);
}

function exportJson() {
  const data = JSON.stringify(state);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pushup-challenge-export.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.startDate) state.startDate = parsed.startDate;
      if (Array.isArray(parsed.completed)) {
        state.completed = parsed.completed.slice(0,100);
        if (state.completed.length < 100) state.completed = state.completed.concat(Array(100-state.completed.length).fill(false));
      }
      saveState();
      render();
      alert('Импорт выполнен');
    } catch(err) {
      alert('Ошибка импорта: ' + err);
    }
  };
  reader.readAsText(file);
}

function markAll() {
  if (!confirm('Отметить все 100 дней как выполненные?')) return;
  state.completed = Array(100).fill(true);
  saveState();
  render();
}

function clearAll() {
  if (!confirm('Сбросить все отметки?')) return;
  state.completed = Array(100).fill(false);
  saveState();
  render();
}

function init() {
  loadState();
  document.getElementById('exportBtn').onclick = exportJson;
  document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
  document.getElementById('importFile').onchange = e => {
    if (e.target.files.length) importJson(e.target.files[0]);
    e.target.value = '';
  };
  document.getElementById('markAll').onclick = markAll;
  document.getElementById('clearAll').onclick = clearAll;
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(()=>console.log('sw registered')).catch(e=>console.log('sw fail',e));
  }
}

window.addEventListener('load', init);
