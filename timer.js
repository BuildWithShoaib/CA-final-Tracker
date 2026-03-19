// timer.js — CA Final Study Tracker
// Focus timer: state, timestamp logic, persistence, wake lock, focus mode

function fmtFlip(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sc = s%60;
  return { h: String(h).padStart(2,'0'), m: String(m).padStart(2,'0'), s: String(sc).padStart(2,'0') };
}
function _timerSync() {
  if (!flipTimerRunning) return;
  const nowElapsed = _timerElapsed + (Date.now() - _timerStartTs);
  flipTimerRemain = Math.max(0, flipTimerGoal - Math.floor(nowElapsed / 1000));
}
function saveTimerState() {
  try {
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify({
      startTs:  _timerStartTs,
      elapsed:  _timerElapsed,
      running:  flipTimerRunning,
      goal:     flipTimerGoal,
      label:    flipTimerLabel
    }));
  } catch(x) {}
}
function loadTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_STATE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s || !s.goal) return;
    flipTimerGoal  = s.goal  || 0;
    flipTimerLabel = s.label || "";
    flipTimerSetMode = false;
    if (s.running && s.startTs) {
      _timerStartTs = s.startTs;
      _timerElapsed = s.elapsed || 0;
      const nowElapsed = _timerElapsed + (Date.now() - _timerStartTs);
      flipTimerRemain = Math.max(0, flipTimerGoal - Math.floor(nowElapsed / 1000));
      if (flipTimerRemain > 0) {
        flipTimerRunning = true;
        clearInterval(flipTimerInterval);
        flipTimerInterval = setInterval(flipTick, 500);
      } else {
        flipTimerRunning = false;
        flipTimerRemain = 0;
      }
    } else {
      _timerElapsed  = s.elapsed || 0;
      _timerStartTs  = 0;
      flipTimerRunning = false;
      flipTimerRemain = Math.max(0, flipTimerGoal - Math.floor(_timerElapsed / 1000));
    }
  } catch(x) {}
}
function flipStart() {
  if(!flipTimerGoal){alert("Set duration first");return;}
  _timerElapsed = 0;
  _timerStartTs = Date.now();
  flipTimerRemain = flipTimerGoal;
  flipTimerRunning = true;
  flipTimerSetMode = false;
  clearInterval(flipTimerInterval);
  flipTimerInterval = setInterval(flipTick, 500);
  saveTimerState();
  render();
}
function flipPause() {
  _timerElapsed += Date.now() - _timerStartTs;
  clearInterval(flipTimerInterval);
  flipTimerRunning = false;
  saveTimerState();
  render();
}
function flipResume() {
  _timerStartTs = Date.now();
  flipTimerRunning = true;
  clearInterval(flipTimerInterval);
  flipTimerInterval = setInterval(flipTick, 500);
  saveTimerState();
  render();
}
function flipReset() {
  clearInterval(flipTimerInterval);
  flipTimerRunning = false;
  _timerElapsed = 0;
  _timerStartTs = 0;
  flipTimerRemain = flipTimerGoal;
  flipTimerSetMode = true;
  try { localStorage.removeItem(TIMER_STATE_KEY); } catch(x) {}
  render();
}
function flipSetGoal(m) { flipTimerGoal=m*60; flipTimerRemain=flipTimerGoal; _timerElapsed=0; }
function flipSaveSession() {
  const totalElapsedMs = flipTimerRunning
    ? _timerElapsed + (Date.now() - _timerStartTs)
    : _timerElapsed;
  const elapsed = Math.min(flipTimerGoal, Math.floor(totalElapsedMs / 1000));
  const hrs = Math.round((elapsed / 3600) * 10) / 10;
  if(hrs < 0.05){alert("Session too short"); return;}
  studySessions.push({date:todayStr(), duration:hrs, label:(flipTimerLabel||"Focus Session").trim().slice(0,50)});
  if(hrs >= 10/60) recordActivity();
  saveVB();
  clearInterval(flipTimerInterval);
  flipTimerRunning = false;
  flipTimerSetMode = true;
  flipTimerGoal = 0;
  flipTimerRemain = 0;
  _timerElapsed = 0;
  try { localStorage.removeItem(TIMER_STATE_KEY); } catch(x) {}
  render();
}
function deleteSession(idx) { studySessions.splice(idx,1);saveVB();render(); }
let _wakeLock = null;
async function requestWakeLock() {
  try { if('wakeLock' in navigator){ _wakeLock = await navigator.wakeLock.request('screen'); } } catch(x){}
}
async function releaseWakeLock() {
  try { if(_wakeLock){ await _wakeLock.release(); _wakeLock=null; } } catch(x){}
}
let focusModeActive = false;
function enterFocusMode() {
  focusModeActive = true;
  const el = document.getElementById('focus-overlay');
  if(el){ el.style.display='flex'; updateFocusDisplay(); }
  try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); } catch(x){}
  requestWakeLock();
}
function exitFocusMode() {
  focusModeActive = false;
  const el = document.getElementById('focus-overlay');
  if(el) el.style.display='none';
  try { document.fullscreenElement && document.exitFullscreen && document.exitFullscreen(); } catch(x){}
  releaseWakeLock();
}
function updateFocusDisplay() {
  const f = fmtFlip(flipTimerRemain);
  const timeStr = flipTimerGoal>=3600 ? `${f.h}:${f.m}:${f.s}` : `${f.m}:${f.s}`;
  const el = document.getElementById('focus-time');
  if(el) el.textContent = timeStr;
  const sl = document.getElementById('focus-status');
  if(sl) sl.textContent = flipTimerRemain<=0?'Done! 🎉':flipTimerRunning?'':flipTimerSetMode?'':('Paused');
}
function flipTick() {
  _timerSync();
  if(flipTimerRemain<=0){
    clearInterval(flipTimerInterval);
    flipTimerRunning=false;
    releaseWakeLock();
    try{const c=new AudioContext();[0,0.15,0.3].forEach(t=>{const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.setValueAtTime(0.3,c.currentTime+t);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+t+0.4);o.start(c.currentTime+t);o.stop(c.currentTime+t+0.4);});}catch(x){}
    render(); if(focusModeActive)updateFocusDisplay(); return;
  }
  const f=fmtFlip(flipTimerRemain);
  const timeStr = flipTimerGoal>=3600 ? `${f.h}:${f.m}:${f.s}` : `${f.m}:${f.s}`;
  const mainTime = document.getElementById('main-timer-display');
  if(mainTime) mainTime.textContent = timeStr;
  const lbl = document.getElementById('flip-lbl');
  if(lbl) lbl.textContent = flipTimerRemain<3600 ? `${Math.ceil(flipTimerRemain/60)}m left` : `${Math.floor(flipTimerRemain/3600)}h ${Math.ceil((flipTimerRemain%3600)/60)}m`;
  if(focusModeActive) updateFocusDisplay();
}

function renderTimer() {
  const r = flipTimerRemain;
  const f = fmtFlip(r);
  const timeStr = flipTimerGoal>=3600 ? `${f.h}:${f.m}:${f.s}` : `${f.m}:${f.s}`;
  const week = [];
  for (let i=6;i>=0;i--) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    const hrs=Math.round(studySessions.filter(s=>s.date===ds).reduce((a,s)=>a+s.duration,0)*10)/10;
    week.push({ds,hrs,day:d.toLocaleDateString('en-IN',{weekday:'short'})});
  }
  const maxH = Math.max(...week.map(d=>d.hrs),1);
  const todayH = todayHrs();
  const totalH = Math.round(studySessions.reduce((a,s)=>a+s.duration,0)*10)/10;

  const setup = `<div style="text-align:center;padding:20px 0">
    <div style="font-size:11px;color:var(--text3);letter-spacing:2px;text-transform:uppercase;margin-bottom:20px">Set Duration</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:20px">
      ${[15,25,30,45,60,90,120].map(p => `<button class="btn b-surface btn-sm" style="border-radius:30px" onclick="flipSetGoal(${p});document.getElementById('flip-ci').value='${p}'">${p<60?p+'m':p/60+'h'}</button>`).join("")}
    </div>
    <input id="flip-ci" type="number" min="1" max="480" placeholder="mins"
      style="width:80px;text-align:center;border:1px solid var(--border2);border-radius:7px;padding:8px;font-size:18px;font-weight:700;color:var(--text);background:var(--surface2);outline:none;margin-bottom:14px"
      oninput="if(this.value)flipSetGoal(parseInt(this.value))"/>
    <input class="inp" placeholder="What are you studying?" value="${esc(flipTimerLabel)}"
      style="max-width:320px;text-align:center;margin:0 auto 20px;display:block"
      oninput="flipTimerLabel=this.value"/>
    <button class="btn b-blue" style="border-radius:30px;padding:12px 36px;font-size:14px" onclick="flipStart()">▶ Start Focus</button>
    ${flipTimerGoal?`<div style="font-size:11px;color:var(--text3);margin-top:10px">${Math.floor(flipTimerGoal/60)} minutes set</div>`:""}
  </div>`;

  const timerCol = r<=0?"#16a34a":flipTimerRunning?"#0891b2":"#d97706";
  const timerFontSize = mob() ? "56px" : "72px";
  const running = `<div style="text-align:center">
    <div style="font-size:11px;color:var(--text3);margin-bottom:16px;font-style:italic">${esc(flipTimerLabel||'Focus Session')}</div>
    <div style="display:flex;justify-content:center;align-items:center;height:120px;margin-bottom:6px">
      <div id="main-timer-display" style="font-family:'JetBrains Mono',monospace;font-size:${timerFontSize};font-weight:800;letter-spacing:2px;color:${timerCol};line-height:1;transition:color .5s">${timeStr}</div>
    </div>
    <div id="flip-lbl" style="font-size:13px;color:var(--text3);margin-bottom:20px;min-height:20px">
      ${r<=0?"Done!":r<3600?Math.ceil(r/60)+"m left":Math.floor(r/3600)+"h "+Math.ceil((r%3600)/60)+"m"}
    </div>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:8px">
      ${r<=0 ? `
        <button class="btn b-green" style="border-radius:30px;padding:10px 24px" onclick="flipSaveSession()">💾 Save Session</button>
        <button class="btn b-surface" style="border-radius:30px;padding:10px 20px" onclick="flipReset()">↺ New</button>
      ` : flipTimerRunning ? `
        <button class="btn b-amber" style="border-radius:30px;padding:10px 24px" onclick="flipPause()">⏸ Pause</button>
        <button class="btn b-ghost" style="border-radius:30px;padding:10px 20px" onclick="flipSaveSession()">💾 Save</button>
        <button class="btn b-ghost" style="border-radius:30px;padding:10px 20px" onclick="flipReset()">✕ Cancel</button>
        <button class="btn b-surface" style="border-radius:30px;padding:10px 20px;background:#1a1a2e;color:#a78bfa;border-color:rgba(167,139,250,0.3)" onclick="enterFocusMode()">⛶ Focus Mode</button>
      ` : `
        <button class="btn b-blue" style="border-radius:30px;padding:10px 24px" onclick="flipResume()">▶ Resume</button>
        <button class="btn b-green" style="border-radius:30px;padding:10px 20px" onclick="flipSaveSession()">💾 Save</button>
        <button class="btn b-ghost" style="border-radius:30px;padding:10px 20px" onclick="flipReset()">↺ Reset</button>
        <button class="btn b-surface" style="border-radius:30px;padding:10px 20px;background:#1a1a2e;color:#a78bfa;border-color:rgba(167,139,250,0.3)" onclick="enterFocusMode()">⛶ Focus Mode</button>
      `}
    </div>
  </div>`;

  const weekChart = `<div class="card" style="margin-bottom:14px;margin-top:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div>
        <div class="panel-label" style="margin-bottom:2px">📊 Weekly Hours</div>
        <div class="mono" style="font-size:24px;font-weight:700">${Math.round(week.reduce((a,d)=>a+d.hrs,0)*10)/10}h</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;color:var(--text3)">Today</div>
        <div class="mono" style="font-size:22px;color:${todayH>=6?"#16a34a":todayH>=3?"#d97706":"#dc2626"}">${todayH}h</div>
      </div>
    </div>
    <div style="display:flex;align-items:flex-end;gap:6px;height:80px">
      ${week.map(d => {
        const barH = Math.max(0, Math.round(d.hrs/maxH*100));
        const isT = d.ds===todayStr();
        const col = isT?"#2563eb":d.hrs>=6?"#16a34a":d.hrs>=3?"#d97706":"rgba(148,163,184,0.15)";
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
          <div class="mono" style="font-size:8px;color:${col}">${d.hrs>0?d.hrs:"—"}</div>
          <div style="width:100%;flex:1;background:var(--surface2);border-radius:3px 3px 0 0;display:flex;align-items:flex-end;overflow:hidden">
            <div style="width:100%;height:${Math.max(barH,d.hrs>0?5:0)}%;background:${col};border-radius:3px 3px 0 0;transition:height .5s"></div>
          </div>
          <div style="font-size:9px;color:${isT?"#2563eb":"var(--text3)"};font-weight:${isT?700:400}">${d.day}</div>
        </div>`;
      }).join("")}
    </div>
  </div>`;

  const todaySessions = studySessions.filter(s => s.date === todayStr());
  const log = `<div class="card">
    <div class="panel-label">Session Log — Today</div>
    ${todaySessions.length ? todaySessions.slice().reverse().map((s, i) => {
      const gi = studySessions.length - 1 - i;
      return `<div style="display:flex;align-items:center;gap:8px;padding:7px;border-radius:6px;background:var(--surface2);border:1px solid var(--border);margin-bottom:4px">
        <div style="width:3px;height:28px;border-radius:2px;background:${s.duration>=2?"#2563eb":"#d97706"};flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.label)}</div>
          <div style="font-size:10px;color:var(--text3)">${s.duration}h</div>
        </div>
        <button onclick="deleteSession(${gi})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;flex-shrink:0">×</button>
      </div>`;
    }).join("") : `<div style="text-align:center;padding:20px;color:var(--text3)">No sessions yet today</div>`}
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between">
      <span style="font-size:10px;color:var(--text3)">All-time total</span>
      <span class="mono" style="font-size:12px;font-weight:700">${totalH}h</span>
    </div>
  </div>`;

  // FIX 5: Timer outer grid — mobile: single col (stacked), desktop: 2-col side-by-side
  const timerGridCols = mob()
    ? "grid-template-columns:1fr"
    : "grid-template-columns:1fr 1fr;gap:18px";

  return `
  <div style="font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-bottom:18px;color:var(--text)">⏱ Focus Timer</div>
  <div style="display:grid;${timerGridCols};align-items:start">
    <div style="background:var(--surface);border:1.5px solid var(--border2);border-radius:16px;padding:28px">
      <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--text3);margin-bottom:${flipTimerSetMode?20:0}px;text-align:center">
        ${flipTimerSetMode?"CONFIGURE":flipTimerRunning?"● RECORDING":"⏸ PAUSED"}
      </div>
      ${flipTimerSetMode ? setup : running}
    </div>
    <div style="margin-top:${mob()?"16px":"0"}">${weekChart}${log}</div>
  </div>`;
}
