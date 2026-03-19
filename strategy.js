// strategy.js — CA Final Study Tracker
// Exam strategy, blueprint planner, calendar, settings

const STRATEGY_KEY = "ca-v6-strategy";
let strategyItems = [];
let strategyForm  = { subject:"", chapter:"", question:"" };

let bpGroup = "both";
let bpDays  = { r1: 10, r2: 7, r3: 3 };
let bpFinal = {};
let bpFirstPaperDays = parseInt(localStorage.getItem('ca-v6-bpFirstPaper')||'5');

const BP_TASKS_KEY = "ca-v6-bptasks";
let bpTasks = [];
function loadBpTasks() { try { const r=localStorage.getItem(BP_TASKS_KEY); if(r) bpTasks=JSON.parse(r)||[]; } catch(x){} }
function saveBpTasks() { try { localStorage.setItem(BP_TASKS_KEY, JSON.stringify(bpTasks)); } catch(x){} }

function generateBpTasks() {
  const G1_KEYS = order.filter(k=>["FR","AFM","Audit","AUDIT"].includes(D[k]?.short));
  const G2_KEYS = order.filter(k=>["DT","IDT","IBS"].includes(D[k]?.short));
  const half = Math.ceil(order.length/2);
  const g1 = G1_KEYS.length?G1_KEYS:order.slice(0,half);
  const g2 = G2_KEYS.length?G2_KEYS:order.slice(half);
  const subs = bpGroup==="g1"?g1:bpGroup==="g2"?g2:order;

  const r1=parseInt(bpDays.r1)||0, r2=parseInt(bpDays.r2)||0, r3=parseInt(bpDays.r3)||0;
  const activeRounds = [
    {days:r3, lbl:"Revision 3", type:"revision"},
    {days:r2, lbl:"Revision 2", type:"revision"},
    {days:r1, lbl:"Revision 1", type:"study"},
  ].filter(rd => rd.days > 0);

  const examDateStr = getExamDateStr();
  const startDate = new Date(examDateStr+"T09:00:00");
  const usedDates = new Set();
  function nextFreeDate(cursor) {
    let d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    let ds = d.toISOString().slice(0,10);
    while (usedDates.has(ds)) {
      d.setDate(d.getDate() - 1);
      ds = d.toISOString().slice(0,10);
    }
    usedDates.add(ds);
    return { date: ds, cursor: d };
  }

  function spreadChapters(subKey, days, type, revLbl, cursorDate) {
    const s = D[subKey]; if(!s||!days) return {tasks:[], cursor:new Date(cursorDate)};
    const chs = s.chapters || [];
    const col = s.color;
    const tasks = [];
    const sorted = [...chs].sort((a,b)=>{
      const aDone = type==="study" ? a.revisions[0].done : type==="revision" ? a.revisions[1].done : a.revisions[2].done;
      const bDone = type==="study" ? b.revisions[0].done : type==="revision" ? b.revisions[1].done : b.revisions[2].done;
      if(aDone!==bDone) return aDone?1:-1;
      return (b.riskScore||0)-(a.riskScore||0);
    });
    let cursor = new Date(cursorDate);
    if(chs.length===0) {
      for(let d=0;d<days;d++){
        const slot = nextFreeDate(cursor);
        tasks.push({date:slot.date,subKey,label:`${s.short} — ${revLbl}`,type,col,chapter:""});
        cursor = slot.cursor;
      }
    } else {
      const chsPerDay = Math.ceil(sorted.length/days);
      for(let d=0;d<days;d++){
        const dayChaps = sorted.slice(d*chsPerDay,(d+1)*chsPerDay);
        const slot = nextFreeDate(cursor);
        if(dayChaps.length===0){
          tasks.push({date:slot.date,subKey,label:`${s.short} — ${revLbl}`,type,col,chapter:""});
        } else if(dayChaps.length===1){
          tasks.push({date:slot.date,subKey,label:`${s.short} — ${dayChaps[0].name||dayChaps[0].id}`,type,col,chapter:dayChaps[0].name||dayChaps[0].id});
        } else {
          const names = dayChaps.map(c=>c.name||c.id);
          tasks.push({date:slot.date,subKey,label:`${s.short} — ${names[0]}${names.length>1?" +"+(names.length-1):""}`,type,col,chapter:names.join(", ")});
        }
        cursor = slot.cursor;
      }
    }
    return {tasks, cursor};
  }

  const allTasks = [];
  let cursor = new Date(startDate);
  const firstPaperDays = Math.max(0, parseInt(bpFirstPaperDays)||0);
  if(firstPaperDays > 0) {
    for(let d=0;d<firstPaperDays;d++){
      const slot = nextFreeDate(cursor);
      allTasks.push({date:slot.date, subKey:"", label:"📚 First Paper Prep", type:"final", col:"#dc2626", chapter:"Reserved — First Paper Revision"});
      cursor = slot.cursor;
    }
  }
  activeRounds.forEach(({days,lbl,type})=>{
    [...subs].reverse().forEach(k=>{
      const result = spreadChapters(k, days, type, lbl, cursor);
      allTasks.push(...result.tasks);
      cursor = result.cursor;
    });
  });
  bpTasks = allTasks.sort((a,b)=>a.date.localeCompare(b.date));
  saveBpTasks();
}

const CAL_KEY = "ca-v6-calendar";
let calData = { breaks: {} };
let calViewYear  = new Date().getFullYear();
let calViewMonth = new Date().getMonth();
let calAddMode   = false;
let calAddDate   = "";
let calAddType   = "break";
let calAddLabel  = "";
let calSelectedDate = "";

function loadCal() { try { const r=localStorage.getItem(CAL_KEY); if(r){const p=JSON.parse(r);calData=p||{breaks:{}};if(!calData.breaks)calData.breaks={};} } catch(x){} }
function saveCal() { try { localStorage.setItem(CAL_KEY, JSON.stringify(calData)); } catch(x){} }

function loadStrategy() {
  try { const r=localStorage.getItem(STRATEGY_KEY); if(r) strategyItems=JSON.parse(r); } catch(x){}
}
function saveStrategy() { try { localStorage.setItem(STRATEGY_KEY, JSON.stringify(strategyItems)); } catch(x){} }
function addStrategyItem() {
  const q = (strategyForm.question||"").trim(); if(!q) return;
  strategyItems.unshift({ id:Date.now().toString(), subject:strategyForm.subject, chapter:(strategyForm.chapter||"").trim(), question:q, done:false, date:todayStr() });
  strategyForm = { subject:"", chapter:"", question:"" };
  saveStrategy(); render();
}
function toggleStrategyItem(id) {
  strategyItems = strategyItems.map(it => it.id===id ? {...it,done:!it.done} : it);
  saveStrategy(); render();
}
function delStrategyItem(id) { strategyItems = strategyItems.filter(it=>it.id!==id); saveStrategy(); render(); }

function renderExamStrategy() {
  return `
  <div style="font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-bottom:6px;color:var(--text)">🎯 Exam Strategy</div>
  <div style="font-size:13px;color:var(--text3);margin-bottom:20px">Plan your revision schedule. Blueprint output populates the Calendar automatically.</div>
  ${renderBlueprintPlanner()}`;
}

function renderAbout() {
  const steps = [
    { n:1, icon:"📚", title:"Track Chapters",   desc:"Go to any Subject tab. Mark chapters as you complete Revision 1, 2, 3, and 4. The risk engine auto-updates." },
    { n:2, icon:"🏠", title:"Follow the Dashboard", desc:"Your dashboard shows today's required chapters, high-risk areas, and your study streak. Check it daily." },
    { n:3, icon:"📔", title:"Write in Diary",    desc:"After each study session, jot a quick note. Log any mistakes from mock tests in the Mistake Log." },
    { n:4, icon:"🚨", title:"Track Mistakes",    desc:"Every time you get something wrong in a mock, RTP, or MTP — log it. Patterns will emerge." },
    { n:5, icon:"🎯", title:"Build Your 1.5 Day Plan", desc:"Use Exam Strategy to curate the exact topics you'll revise in the final 36 hours before each paper." },
    { n:6, icon:"📝", title:"Log Tests",          desc:"Record every mock, RTP attempt, and practice test in the Test Series tab to track your score trend." },
  ];
  const features = [
    { icon:"⚡", title:"Risk Engine",         desc:"Auto-calculates chapter risk based on revision recency, retention, and category weight." },
    { icon:"📊", title:"Progress Tracking",   desc:"4-level revision model (R1–R4) with visual progress across all 5 CA Final subjects." },
    { icon:"🔥", title:"Streak Tracking",     desc:"Tracks daily study streaks to keep you consistent." },
    { icon:"⏱",  title:"Focus Timer",         desc:"Pomodoro-style timer that logs your study hours directly into the session tracker." },
    { icon:"📅", title:"Auto Scheduler",      desc:"Calculates exactly how many chapters you need daily to finish Rev 1 before the exam." },
    { icon:"📔", title:"Study Diary",         desc:"Personal journal, chapter notes, and mistake log in one place." },
    { icon:"📝", title:"Test Series",         desc:"Track scores, pass rates, and score trends across all your mock tests and RTPs." },
    { icon:"🎯", title:"Exam Strategy",       desc:"Build your final 1.5-day revision checklist from weak chapters identified by the risk engine." },
  ];
  return `
  <div style="font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-bottom:6px;color:var(--text)">ℹ️ About This Tracker</div>
  <div style="font-size:13px;color:var(--text3);margin-bottom:24px">Everything you need to know about how to use this tracker effectively.</div>
  <div class="card fu" style="margin-bottom:16px;background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-color:rgba(37,99,235,0.2)">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;flex-wrap:wrap">
      <div style="width:48px;height:48px;border-radius:13px;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">📚</div>
      <div>
        <div style="font-size:18px;font-weight:800;color:var(--text)">CA Final Performance OS</div>
        <div style="font-size:12px;color:var(--text3);margin-top:2px">A complete study command centre for CA Final aspirants</div>
      </div>
    </div>
    <div style="font-size:13px;color:var(--text2);line-height:1.8">
      This tracker is built around one idea: <strong>most CA students don't fail because they don't study — they fail because they don't study the <em>right things</em> at the <em>right time</em>.</strong>
    </div>
  </div>
  <div class="card fu" style="margin-bottom:16px">
    <div class="panel-label">✨ Features</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${mob()?"150px":"220px"},1fr));gap:12px">
      ${features.map(f=>`
        <div style="background:var(--surface2);border-radius:12px;padding:14px">
          <div style="font-size:18px;margin-bottom:6px">${f.icon}</div>
          <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">${f.title}</div>
          <div style="font-size:12px;color:var(--text3);line-height:1.6">${f.desc}</div>
        </div>`).join("")}
    </div>
  </div>
  <div class="card fu" style="margin-bottom:16px">
    <div class="panel-label">🚀 How to Use</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${steps.map(s=>`
        <div style="display:flex;align-items:flex-start;gap:14px;padding:12px 14px;background:var(--surface2);border-radius:12px">
          <div style="width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;font-weight:800">${s.n}</div>
          <div style="min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:3px">${s.icon} ${s.title}</div>
            <div style="font-size:12px;color:var(--text3);line-height:1.6">${s.desc}</div>
          </div>
        </div>`).join("")}
    </div>
  </div>
  <div class="card" style="margin-bottom:0;background:linear-gradient(135deg,#f0fdf4,#f5f3ff);border-color:rgba(124,58,237,0.2)">
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:24px;margin-bottom:10px">💬</div>
      <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:8px">Feedback & Suggestions</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.8;margin-bottom:16px">If you have suggestions, found a bug, or want a new feature, connect on LinkedIn.</div>
      <a href="https://linkedin.com/in/" target="_blank" style="display:inline-flex;align-items:center;gap:8px;background:#0a66c2;color:#fff;border-radius:10px;padding:11px 22px;font-size:13px;font-weight:700;text-decoration:none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        Connect on LinkedIn
      </a>
    </div>
  </div>`;
}

function renderSubjectsHub() {
  // This function is in ui-dash.js — stub here for file completeness
  // (actual implementation is in ui-dash.js)
}

function renderBlueprintPlanner() {
  const dl = daysLeft();
  const G1_KEYS = order.filter(k => ["FR","AFM","Audit","AUDIT"].includes(D[k]?.short));
  const G2_KEYS = order.filter(k => ["DT","IDT","IBS"].includes(D[k]?.short));
  const half = Math.ceil(order.length / 2);
  const g1 = G1_KEYS.length ? G1_KEYS : order.slice(0, half);
  const g2 = G2_KEYS.length ? G2_KEYS : order.slice(half);
  const selectedSubs = bpGroup === "g1" ? g1 : bpGroup === "g2" ? g2 : order;

  selectedSubs.forEach(k => { if (bpFinal[k] === undefined) bpFinal[k] = 1; });

  const r1 = parseInt(bpDays.r1) || 0;
  const r2 = parseInt(bpDays.r2) || 0;
  const r3 = parseInt(bpDays.r3) || 0;
  const revPerSub = r1 + r2 + r3;
  const n = selectedSubs.length;
  const totalRevDays = revPerSub * n;
  const totalRequired = totalRevDays + (parseInt(bpFirstPaperDays)||0);
  const surplus = dl - totalRequired;
  const feasible = surplus >= 0;
  const statusCls = surplus >= 10 ? "bp-feasible" : surplus >= 0 ? "bp-warn" : "bp-danger";
  const statusMsg = surplus >= 10
    ? `✅ Feasible — ${surplus} buffer days`
    : surplus >= 0
    ? `⚠️ Tight — only ${surplus} buffer days`
    : `🚨 Not feasible — need ${Math.abs(surplus)} fewer days`;

  let day = 1;
  const timeline = [];
  [
    { lbl:"Revision 1", days: r1, col:"#2563eb" },
    { lbl:"Revision 2", days: r2, col:"#7c3aed" },
    { lbl:"Revision 3", days: r3, col:"#d97706" },
  ].forEach(({ lbl, days, col }) => {
    if (!days) return;
    selectedSubs.forEach(k => {
      const s = D[k]; if (!s) return;
      timeline.push({ label:`${s.short} — ${lbl}`, days, start:day, col, subCol: s.color });
      day += days;
    });
  });
  const fpDays = parseInt(bpFirstPaperDays)||0;
  if(fpDays > 0) {
    timeline.push({ label:"📌 First Paper Prep", days: fpDays, start: day, col:"#dc2626", subCol:"#dc2626" });
    day += fpDays;
  }

  // FIX 7: Blueprint summary grid — mobile: 2-col, desktop: auto-fit minmax(140px)
  const bpSumGrid = mob()
    ? "display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px"
    : "display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px";

  return `
  <div class="card fu" style="margin-bottom:16px">
    <div class="panel-label" style="margin-bottom:14px">🗓 Revision Blueprint Planner</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:18px">Plan if your revision schedule fits within the available days before the exam.</div>

    <div style="margin-bottom:18px">
      <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.8px">Group Selection</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${[
          { v:"g1",   lbl:"Group 1", sub: g1.map(k=>D[k]?.short).join(", ") },
          { v:"g2",   lbl:"Group 2", sub: g2.map(k=>D[k]?.short).join(", ") },
          { v:"both", lbl:"Both Groups", sub: order.map(k=>D[k]?.short).join(", ") },
        ].map(({v,lbl,sub})=>`
          <button onclick="bpGroup='${v}';render()"
            style="background:${bpGroup===v?"#eff6ff":"var(--surface2)"};border:1.5px solid ${bpGroup===v?"#2563eb":"var(--border2)"};color:${bpGroup===v?"#2563eb":"var(--text2)"};border-radius:11px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;text-align:left">
            <div>${lbl}</div>
            <div style="font-size:10px;font-weight:500;opacity:0.7;margin-top:2px">${sub}</div>
          </button>`).join("")}
      </div>
    </div>

    <div style="margin-bottom:18px">
      <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.8px">Days per Subject per Revision Round</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end">
        ${[
          { key:"r1", lbl:"Revision 1", col:"#2563eb" },
          { key:"r2", lbl:"Revision 2", col:"#7c3aed" },
          { key:"r3", lbl:"Revision 3", col:"#d97706" },
        ].map(({key,lbl,col})=>`
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <label style="font-size:11px;color:${col};font-weight:700">${lbl}</label>
            <input class="bp-input" type="number" min="0" max="60"
              value="${bpDays[key]}"
              oninput="bpDays['${key}']=this.value;render()"/>
            <span style="font-size:10px;color:var(--text3)">days/subj</span>
          </div>`).join("")}
        <div style="background:var(--surface2);border-radius:12px;padding:12px 18px;text-align:center;border:1.5px solid var(--border)">
          <div style="font-size:10px;color:var(--text3);margin-bottom:4px">Per Subject Total</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:800;color:var(--text)">${revPerSub}</div>
          <div style="font-size:10px;color:var(--text3)">days</div>
        </div>
        <div style="background:var(--surface2);border-radius:12px;padding:12px 18px;text-align:center;border:1.5px solid var(--border)">
          <div style="font-size:10px;color:var(--text3);margin-bottom:4px">${n} subjects × ${revPerSub}d</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:800;color:#2563eb">${totalRevDays}</div>
          <div style="font-size:10px;color:var(--text3)">revision days</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:18px">
      <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.8px">📌 Days Before First Paper</div>
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
          <label style="font-size:11px;color:#dc2626;font-weight:700">Reserve Days</label>
          <input class="bp-input" type="number" min="0" max="14" step="1"
            value="${bpFirstPaperDays}"
            oninput="bpFirstPaperDays=parseInt(this.value)||0;localStorage.setItem('ca-v6-bpFirstPaper',bpFirstPaperDays);render()"/>
          <span style="font-size:9px;color:var(--text3)">days blocked</span>
        </div>
        <div style="background:#fff5f5;border:1.5px solid rgba(220,38,38,0.2);border-radius:12px;padding:12px 16px;flex:1;min-width:180px">
          <div style="font-size:11px;font-weight:700;color:#dc2626;margin-bottom:4px">🚫 Blocked Period</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.6">
            ${bpFirstPaperDays > 0
              ? (() => {
                  const examDs = getExamDateStr();
                  const d1 = new Date(examDs+'T00:00:00');
                  d1.setDate(d1.getDate()-bpFirstPaperDays);
                  const d2 = new Date(examDs+'T00:00:00');
                  d2.setDate(d2.getDate()-1);
                  return d1.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+' → '+d2.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+' ('+bpFirstPaperDays+' days)';
                })()
              : 'Set days above to block this period'}
          </div>
        </div>
      </div>
    </div>

    <!-- FIX 7: Summary grid — mobile 2-col, desktop auto-fit -->
    <div style="${bpSumGrid}">
      <div style="background:var(--surface2);border-radius:13px;padding:14px;text-align:center">
        <div style="font-size:10px;color:var(--text3);margin-bottom:5px;font-weight:700;text-transform:uppercase">Revision Days</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:900;color:#2563eb">${totalRevDays}</div>
      </div>
      <div style="background:var(--surface2);border-radius:13px;padding:14px;text-align:center">
        <div style="font-size:10px;color:var(--text3);margin-bottom:5px;font-weight:700;text-transform:uppercase">First Paper Block</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:900;color:#dc2626">${bpFirstPaperDays}d</div>
      </div>
      <div style="background:var(--surface2);border-radius:13px;padding:14px;text-align:center">
        <div style="font-size:10px;color:var(--text3);margin-bottom:5px;font-weight:700;text-transform:uppercase">Total Required</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:900;color:var(--text)">${totalRequired}</div>
      </div>
      <div style="background:var(--surface2);border-radius:13px;padding:14px;text-align:center">
        <div style="font-size:10px;color:var(--text3);margin-bottom:5px;font-weight:700;text-transform:uppercase">Days Available</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:900;color:${dl<=30?"#dc2626":dl<=60?"#d97706":"#16a34a"}">${dl}</div>
      </div>
    </div>

    <div style="border-radius:13px;padding:16px 18px;border:1.5px solid;font-weight:700;font-size:14px;margin-bottom:16px;text-align:center" class="${statusCls}">
      ${statusMsg}
      ${!feasible?`<div style="font-size:12px;font-weight:500;margin-top:4px;opacity:0.85">Tip: reduce revision days by ${Math.abs(surplus)} days total.</div>`:""}
    </div>

    ${timeline.length ? `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.8px">📅 Revision Timeline Preview</div>
        <button onclick="generateBpTasks();setTab('calendar');render()"
          style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;border:none;border-radius:10px;padding:8px 18px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:7px;box-shadow:0 2px 12px rgba(37,99,235,0.3)">
          📆 Push to Calendar
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;max-height:300px;overflow-y:auto">
        ${timeline.map(t=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);border-radius:9px;border-left:3px solid ${t.subCol}">
            <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text3);min-width:90px;flex-shrink:0">
              Day ${t.start}–${t.start+t.days-1}
            </span>
            <div style="width:8px;height:8px;border-radius:50%;background:${t.col};flex-shrink:0"></div>
            <span style="font-size:12px;font-weight:600;color:var(--text);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.label}</span>
            <span style="margin-left:auto;font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;flex-shrink:0">${t.days}d</span>
          </div>`).join("")}
      </div>
    </div>` : ""}
  </div>`;
}

function renderCalendar() {
  const today = todayStr();
  const sched = getExamSchedule();

  const events = {};
  function addEv(ds, type, label, col, detail) {
    if (!events[ds]) events[ds] = [];
    events[ds].push({ type, label, col, detail: detail||"" });
  }

  Object.entries(calData.breaks||{}).forEach(([ds, ev]) => {
    const col = ev.type==="festival"?"#d97706":ev.type==="holiday"?"#7c3aed":ev.type==="event"?"#0891b2":"#94a3b8";
    addEv(ds, ev.type, ev.label||ev.type, col);
  });

  plans.forEach(plan => {
    plan.days.forEach((d, di) => {
      const sd = new Date(plan.startDate||today); sd.setDate(sd.getDate()+di);
      const ds = sd.toISOString().slice(0,10);
      if (d.chapters.length > 0) {
        const allDone = d.chapters.every(c=>c.done);
        const overdue = ds < today && !allDone;
        const col = allDone?"#16a34a":overdue?"#dc2626":"#2563eb";
        const detail = d.chapters.map(c=>`${D[c.sub]?.short||c.sub}: ${c.name||c.id}`).join(", ");
        addEv(ds, "plan", `Plan: ${d.chapters.length}ch`, col, detail);
      }
    });
  });

  bpTasks.forEach(t => {
    const s = D[t.subKey];
    const col = s?.color || "#2563eb";
    const typeIcon = t.type==="final"?"🔴":t.type==="revision"?"🔵":"🟢";
    addEv(t.date, t.type, t.label, col, `${typeIcon} ${t.label}`);
  });

  tsTests.forEach(t => {
    if (t.date) addEv(t.date, "test", `${t.name||"Mock"}`, "#7c3aed", `Score: ${t.score!==null?t.score+"/"+t.maxScore:"Pending"}`);
  });

  Object.entries(sched.dates||{}).forEach(([short, ds]) => {
    if (!ds) return;
    const subKey = order.find(k=>D[k]?.short===short);
    const col = D[subKey]?.color || "#dc2626";
    addEv(ds, "exam", `📝 ${short}`, col, `${short} Exam Day`);
  });

  const yr = calViewYear, mo = calViewMonth;
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo+1, 0).getDate();
  const monthName = new Date(yr, mo, 1).toLocaleDateString("en-IN",{month:"long", year:"numeric"});
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);
  while (cells.length%7!==0) cells.push(null);

  const breakTypes = [
    { v:"break",   icon:"☕", lbl:"Break Day",     col:"#94a3b8" },
    { v:"festival",icon:"🎉", lbl:"Festival",      col:"#d97706" },
    { v:"holiday", icon:"🏖", lbl:"Holiday",       col:"#7c3aed" },
    { v:"event",   icon:"📌", lbl:"Personal Event",col:"#0891b2" },
  ];

  const selEvs = calSelectedDate ? (events[calSelectedDate]||[]) : [];
  const selFmt = calSelectedDate
    ? new Date(calSelectedDate+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})
    : "";

  const detailPanel = calSelectedDate ? `
  <div style="background:var(--surface2);border-radius:14px;padding:16px;margin-bottom:16px;border:1.5px solid var(--border2)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="font-size:14px;font-weight:800;color:var(--text)">${selFmt}</div>
      <button onclick="calSelectedDate='';render()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;line-height:1">×</button>
    </div>
    ${selEvs.length===0
      ? `<div style="font-size:12px;color:var(--text3);padding:8px 0">No tasks or events on this day.</div>
         <button onclick="calAddDate='${calSelectedDate}';calAddMode=true;calSelectedDate='';render()"
           style="background:#2563eb;color:#fff;border:none;border-radius:9px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;margin-top:8px">+ Add Event</button>`
      : `<div style="display:flex;flex-direction:column;gap:6px">
          ${selEvs.map(ev=>{
            const typeLabel = ev.type==="study"?"Study":ev.type==="revision"?"Revision":ev.type==="final"?"Final Rev":ev.type==="plan"?"Planner":ev.type==="test"?"Test":ev.type==="exam"?"📝 Exam":ev.type;
            return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;background:${ev.col}0f;border-left:3px solid ${ev.col}">
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:var(--text)">${esc(ev.label)}</div>
                ${ev.detail?`<div style="font-size:11px;color:var(--text3);margin-top:2px">${esc(ev.detail)}</div>`:""}
              </div>
              <span style="background:${ev.col}22;color:${ev.col};font-size:9px;font-weight:800;padding:2px 7px;border-radius:20px;white-space:nowrap;flex-shrink:0;text-transform:uppercase;margin-top:2px">${typeLabel}</span>
            </div>`;
          }).join("")}
          <button onclick="calAddDate='${calSelectedDate}';calAddMode=true;calSelectedDate='';render()"
            style="background:var(--surface);border:1.5px solid var(--border2);border-radius:9px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;color:var(--text2);margin-top:4px;width:100%">+ Add Break / Event</button>
        </div>`}
  </div>` : "";

  const addForm = calAddMode ? `
  <div style="background:var(--surface2);border-radius:13px;padding:14px;margin-bottom:16px">
    <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px">Add Break / Event</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <div>
        <label style="display:block;font-size:10px;font-weight:700;color:var(--text3);margin-bottom:4px;text-transform:uppercase">Date</label>
        <input type="date" value="${calAddDate}" class="inp" style="min-width:140px" onchange="calAddDate=this.value"/>
      </div>
      <div>
        <label style="display:block;font-size:10px;font-weight:700;color:var(--text3);margin-bottom:4px;text-transform:uppercase">Type</label>
        <select class="inp" onchange="calAddType=this.value" style="cursor:pointer">
          ${breakTypes.map(t=>`<option value="${t.v}" ${calAddType===t.v?"selected":""}>${t.icon} ${t.lbl}</option>`).join("")}
        </select>
      </div>
      <div style="flex:1;min-width:140px">
        <label style="display:block;font-size:10px;font-weight:700;color:var(--text3);margin-bottom:4px;text-transform:uppercase">Label</label>
        <input class="inp" placeholder="e.g. Diwali, Family event…" value="${esc(calAddLabel)}" oninput="calAddLabel=this.value"/>
      </div>
      <div style="display:flex;gap:7px">
        <button onclick="if(calAddDate){calData.breaks[calAddDate]={type:calAddType,label:calAddLabel};saveCal();calAddMode=false;render()}"
          style="background:#2563eb;color:#fff;border:none;border-radius:9px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer">Save</button>
        <button onclick="calAddMode=false;render()"
          style="background:var(--surface);border:1px solid var(--border2);color:var(--text2);border-radius:9px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer">Cancel</button>
      </div>
    </div>
  </div>` : "";

  const legend = `
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
    ${[
      {col:"#16a34a", lbl:"Complete"}, {col:"#2563eb", lbl:"Plan"},
      {col:"#7c3aed", lbl:"Test"}, {col:"#dc2626", lbl:"Exam"},
      {col:"#d97706", lbl:"Festival"}, {col:"#94a3b8", lbl:"Break"},
    ].map(({col,lbl})=>`<div style="display:flex;align-items:center;gap:5px">
      <div style="width:9px;height:9px;border-radius:2px;background:${col};flex-shrink:0"></div>
      <span style="font-size:10px;color:var(--text3)">${lbl}</span>
    </div>`).join("")}
    ${bpTasks.length?`<span style="margin-left:auto;font-size:10px;font-weight:700;color:#7c3aed">${bpTasks.length} Blueprint tasks</span>`:""}
  </div>`;

  // FIX 9: Wrap calendar grid in overflow-x:auto so it scrolls instead of overflowing
  // Reduce min-width from 420px → 320px (7 cols × ~46px minimum)
  const calGrid = `
  <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
    <div style="min-width:320px">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:2px">
        ${DAYS.map(d=>`<div style="text-align:center;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;padding:5px 0">${d}</div>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">
        ${cells.map(d => {
          if (!d) return `<div style="height:74px"></div>`;
          const ds = `${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const isToday = ds===today;
          const isSelected = ds===calSelectedDate;
          const evs = events[ds]||[];
          const hasBreak = calData.breaks?.[ds];
          const hasExam = evs.some(e=>e.type==="exam");
          const hasBp = evs.some(e=>["study","revision","final"].includes(e.type));
          const border = isSelected?"2px solid #7c3aed":hasExam?"2px solid #dc2626":isToday?"2px solid #2563eb":"1px solid var(--border)";
          const bg = hasBreak?"rgba(148,163,184,0.08)":isSelected?"#f5f3ff":hasBp?"rgba(37,99,235,0.04)":isToday?"#eff6ff":"var(--surface)";
          return `<div style="height:74px;border-radius:8px;border:${border};background:${bg};padding:4px 5px;position:relative;cursor:pointer;overflow:hidden"
            onclick="calSelectedDate=calSelectedDate==='${ds}'?'':'${ds}';calAddMode=false;render()">
            <div style="font-size:11px;font-weight:${isToday||hasExam?"800":"600"};color:${hasExam?"#dc2626":isToday?"#2563eb":isSelected?"#7c3aed":"var(--text)"};margin-bottom:2px;line-height:1">${d}</div>
            <div style="display:flex;flex-direction:column;gap:1px;overflow:hidden">
              ${evs.slice(0,4).map(ev=>`
                <div style="background:${ev.col}22;border-radius:2px;padding:1px 3px;border-left:2px solid ${ev.col}">
                  <span style="font-size:8px;font-weight:700;color:${ev.col};white-space:nowrap;overflow:hidden;display:block;text-overflow:ellipsis">${esc(ev.label)}</span>
                </div>`).join("")}
              ${evs.length>4?`<div style="font-size:8px;color:var(--text3);padding:0 2px;font-weight:600">+${evs.length-4}</div>`:""}
            </div>
            ${hasBreak?`<button onclick="event.stopPropagation();delete calData.breaks['${ds}'];saveCal();render()"
              style="position:absolute;top:1px;right:1px;background:none;border:none;color:var(--text3);cursor:pointer;font-size:10px;padding:0 2px;line-height:1">×</button>`:""}
          </div>`;
        }).join("")}
      </div>
    </div>
  </div>`;

  const bpSummary = bpTasks.length ? `
  <div class="card fu" style="margin-bottom:16px;border-left:4px solid #7c3aed">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      <div>
        <div class="panel-label" style="color:#7c3aed;margin-bottom:2px">🗓 Blueprint Study Plan</div>
        <div style="font-size:11px;color:var(--text3)">${bpTasks.length} tasks</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="setTab('strategy')" style="background:#f5f3ff;border:1.5px solid #7c3aed44;color:#7c3aed;border-radius:9px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer">Edit Blueprint →</button>
        <button onclick="bpTasks=[];saveBpTasks();render()" style="background:none;border:1.5px solid rgba(220,38,38,0.25);color:#dc2626;border-radius:9px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer">Clear</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${[
        {type:"study",   lbl:"Study",    col:"#16a34a"},
        {type:"revision",lbl:"Revision", col:"#2563eb"},
        {type:"final",   lbl:"First Paper",col:"#dc2626"},
      ].map(({type,lbl,col})=>{
        const cnt = bpTasks.filter(t=>t.type===type).length;
        return cnt?`<div style="background:${col}12;border:1px solid ${col}33;border-radius:9px;padding:6px 12px;display:flex;align-items:center;gap:6px">
          <div style="width:7px;height:7px;border-radius:50%;background:${col}"></div>
          <span style="font-size:11px;font-weight:700;color:${col}">${lbl}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text3)">${cnt}d</span>
        </div>`:"";
      }).join("")}
    </div>
  </div>` : `
  <div class="card fu" style="margin-bottom:16px;background:linear-gradient(135deg,#f5f3ff,#eff6ff);border:1.5px solid #7c3aed33">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:32px">📅</div>
      <div style="min-width:0">
        <div style="font-size:14px;font-weight:800;color:#7c3aed">No Blueprint Plan Yet</div>
        <div style="font-size:12px;color:var(--text3);margin-top:3px">Go to Exam Strategy → Blueprint Planner → Push to Calendar</div>
      </div>
      <button onclick="setTab('strategy')" style="margin-left:auto;background:#7c3aed;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0">Create Plan →</button>
    </div>
  </div>`;

  return `
  <div style="font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-bottom:6px;color:var(--text)">📆 Study Calendar</div>
  <div style="font-size:13px;color:var(--text3);margin-bottom:18px">Full preparation timeline. Blueprint tasks, planner tasks, and exam dates all in one view.</div>
  ${bpSummary}
  <div class="card fu" style="margin-bottom:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <button onclick="calViewMonth--;if(calViewMonth<0){calViewMonth=11;calViewYear--;}render()"
          style="background:var(--surface2);border:1.5px solid var(--border2);border-radius:9px;padding:6px 12px;font-size:16px;cursor:pointer;font-weight:700;color:var(--text2);line-height:1">‹</button>
        <span style="font-size:15px;font-weight:800;color:var(--text);min-width:130px;text-align:center">${monthName}</span>
        <button onclick="calViewMonth++;if(calViewMonth>11){calViewMonth=0;calViewYear++;}render()"
          style="background:var(--surface2);border:1.5px solid var(--border2);border-radius:9px;padding:6px 12px;font-size:16px;cursor:pointer;font-weight:700;color:var(--text2);line-height:1">›</button>
        <button onclick="calViewYear=new Date().getFullYear();calViewMonth=new Date().getMonth();calSelectedDate='';render()"
          style="background:var(--surface2);border:1.5px solid var(--border2);border-radius:9px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;color:var(--text2)">Today</button>
      </div>
      <button onclick="calAddDate=todayStr();calAddMode=!calAddMode;calSelectedDate='';render()"
        style="background:${calAddMode?'var(--surface2)':'#2563eb'};color:${calAddMode?'var(--text2)':'#fff'};border:${calAddMode?'1.5px solid var(--border2)':'none'};border-radius:9px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer">
        ${calAddMode?"✕ Cancel":"+ Add Break / Event"}
      </button>
    </div>
    ${addForm}
    ${legend}
    ${calGrid}
    ${detailPanel}
  </div>
  <div class="card fu">
    <div class="panel-label">📋 Upcoming Events & Breaks</div>
    ${Object.entries(calData.breaks||{}).filter(([ds])=>ds>=today).sort(([a],[b])=>a.localeCompare(b)).length===0
      ? `<div style="font-size:13px;color:var(--text3);padding:10px 0">No breaks or events scheduled.</div>`
      : `<div style="display:flex;flex-direction:column;gap:6px;margin-top:4px">
          ${Object.entries(calData.breaks).filter(([ds])=>ds>=today).sort(([a],[b])=>a.localeCompare(b)).slice(0,12).map(([ds,ev])=>{
            const bt = breakTypes.find(t=>t.v===ev.type)||breakTypes[0];
            const dayFmt = new Date(ds+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
            const dlEv = Math.max(0,Math.ceil((new Date(ds+"T09:00:00")-new Date())/86400000));
            return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);border-radius:10px;border-left:3px solid ${bt.col}">
              <span style="font-size:15px">${bt.icon}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(ev.label||bt.lbl)}</div>
                <div style="font-size:11px;color:var(--text3)">${dayFmt} · ${dlEv}d away</div>
              </div>
              <button onclick="delete calData.breaks['${ds}'];saveCal();render()"
                style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;padding:4px 8px">✕</button>
            </div>`;
          }).join("")}
        </div>`}
  </div>`;
}

function renderSettings() {
  const allC = order.flatMap(k=>D[k]?.chapters||[]);
  const p1 = allC.filter(c=>c.revisions[0].done).length;
  let mDone = 0; order.forEach(k=>(D[k]?.chapters||[]).forEach(c=>{if(mocks[c.id]?.done)mDone++;}));
  const dl = daysLeft();
  const sched = getExamSchedule();
  const grp = sched.group || "both";
  const dates = sched.dates || {};

  const showShorts = grp==="g1" ? EXAM_SUBJECTS.g1 : grp==="g2" ? EXAM_SUBJECTS.g2 : [...EXAM_SUBJECTS.g1,...EXAM_SUBJECTS.g2];
  const configuredCount = showShorts.filter(sh=>dates[sh]).length;

  // FIX 8: Paper dates grid — mobile: single col, desktop: auto-fill minmax(200px)
  const datesCols = mob()
    ? "display:grid;grid-template-columns:1fr;gap:10px"
    : "display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px";

  return `<div style="max-width:640px">
    <div style="font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-bottom:18px;color:var(--text)">⚙ Settings</div>

    <div class="card" style="margin-bottom:14px;border-left:4px solid #2563eb">
      <div class="panel-label" style="color:#2563eb">📅 Exam Schedule</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:16px">Set your exam group and individual paper dates.</div>
      <div style="margin-bottom:18px">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text2);margin-bottom:10px">Step 1 — Which group are you writing?</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${[{v:"g1",lbl:"Group 1",sub:"FR · AFM · Audit"},{v:"g2",lbl:"Group 2",sub:"DT · IDT · IBS"},{v:"both",lbl:"Both Groups",sub:"All 6 papers"}].map(({v,lbl,sub})=>`
          <button onclick="(()=>{const s=getExamSchedule();s.group='${v}';saveExamSchedule(s);render()})()"
            style="background:${grp===v?'#eff6ff':'var(--surface2)'};border:1.5px solid ${grp===v?'#2563eb':'var(--border2)'};color:${grp===v?'#2563eb':'var(--text2)'};border-radius:12px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer;text-align:left;min-width:100px">
            <div>${lbl}</div>
            <div style="font-size:10px;font-weight:500;opacity:0.7;margin-top:2px">${sub}</div>
          </button>`).join("")}
        </div>
      </div>

      <div>
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text2);margin-bottom:12px">Step 2 — Enter paper dates</div>
        <!-- FIX 8: Mobile single col, desktop auto-fill -->
        <div style="${datesCols}">
          ${showShorts.map(short => {
            const subKey = order.find(k=>D[k]?.short===short);
            const col = D[subKey]?.color || "#2563eb";
            const val = dates[short] || "";
            const dlP = val ? Math.max(0,Math.ceil((new Date(val+"T09:00:00")-new Date())/86400000)) : null;
            return `<div style="background:var(--surface2);border-radius:12px;padding:12px;border:1.5px solid ${val?col+'44':'var(--border)'}">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px">
                <div style="width:7px;height:7px;border-radius:50%;background:${col}"></div>
                <span style="font-size:12px;font-weight:800;color:${col}">${short}</span>
                ${dlP!==null?`<span style="margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10px;color:${dlP<=14?'#dc2626':dlP<=30?'#d97706':'var(--text3)'};font-weight:700">${dlP}d</span>`:""}
              </div>
              <input type="date" value="${val}"
                style="width:100%;border:1.5px solid ${val?col+'66':'var(--border2)'};border-radius:8px;padding:7px 10px;font-size:13px;font-weight:600;background:var(--surface);color:var(--text);outline:none;cursor:pointer"
                onchange="(()=>{const s=getExamSchedule();s.dates=s.dates||{};s.dates['${short}']=this.value;saveExamSchedule(s);render()})()"/>
            </div>`;
          }).join("")}
        </div>
        <div style="margin-top:14px;padding:12px 14px;background:${configuredCount===showShorts.length?'#f0fdf4':'#fffbeb'};border-radius:10px;border:1.5px solid ${configuredCount===showShorts.length?'rgba(22,163,74,0.3)':'rgba(217,119,6,0.3)'}">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <span style="font-size:12px;font-weight:700;color:${configuredCount===showShorts.length?'#16a34a':'#d97706'}">
              ${configuredCount===showShorts.length ? `✅ All ${configuredCount} paper dates set` : `⚠ ${configuredCount}/${showShorts.length} paper dates set`}
            </span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:900;color:${dl<=30?'#dc2626':dl<=60?'#d97706':'#16a34a'}">${dl}d to first exam</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="panel-label">System</div>
      <div class="sr">
        <div><div style="font-weight:600">War Mode</div><div style="font-size:11px;color:var(--text3)">Auto-activates ≤30 days. Manual override.</div></div>
        <button class="tog ${settings.warMode?"on":""}" onclick="settings.warMode=!settings.warMode;saveSet();render()"></button>
      </div>
      <div class="sr">
        <div><div style="font-weight:600">Compact Mode</div><div style="font-size:11px;color:var(--text3)">Smaller chapter rows</div></div>
        <button class="tog ${settings.compact?"on":""}" onclick="settings.compact=!settings.compact;saveSet();render()"></button>
      </div>
      <div class="sr">
        <div><div style="font-weight:600">Daily Hour Target</div><div style="font-size:11px;color:var(--text3)">Used in execution score</div></div>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="number" min="1" max="16" value="${settings.dailyHourTarget||6}"
            style="width:56px;border:1px solid var(--border2);border-radius:6px;padding:5px;text-align:center;background:var(--surface2);color:var(--text);font-family:'JetBrains Mono';font-size:16px"
            oninput="settings.dailyHourTarget=parseInt(this.value)||6;saveSet()"/>
          <span style="color:var(--text3);font-size:12px">hrs</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="panel-label">Data & Export</div>
      <div class="sr"><div><div style="font-weight:600">Export Excel (.xlsx)</div></div><button class="btn b-green btn-sm" onclick="exportXLSX()">Export</button></div>
      <div class="sr"><div><div style="font-weight:600">Export CSV</div></div><button class="btn b-blue btn-sm" onclick="exportCSV()">CSV</button></div>
      <div class="sr"><div><div style="font-weight:600">Backup JSON</div></div><button class="btn b-surface btn-sm" onclick="backup()">Backup</button></div>
      <div class="sr"><div><div style="font-weight:600">Restore Backup</div></div><label class="btn b-surface btn-sm" style="cursor:pointer">Restore<input type="file" accept=".json" style="display:none" onchange="restoreBackup(this)"/></label></div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="panel-label" style="color:#dc2626">Danger Zone</div>
      <div class="sr"><div><div style="font-weight:600;color:#dc2626">Reset All Revisions</div><div style="font-size:11px;color:var(--text3)">Clear all ticks</div></div>
        <button class="btn btn-sm" style="background:transparent;color:#dc2626;border:1px solid rgba(255,61,61,0.25)" onclick="resetProg()">Reset</button></div>
      <div class="sr"><div><div style="font-weight:600;color:#dc2626">Full Factory Reset</div><div style="font-size:11px;color:var(--text3)">Restore all defaults</div></div>
        <button class="btn btn-sm" style="background:transparent;color:#dc2626;border:1px solid rgba(255,61,61,0.25)" onclick="resetAll()">Full Reset</button></div>
    </div>

    <div class="card">
      <div class="panel-label">System Status</div>
      <div style="line-height:2.2;font-size:13px;color:var(--text2)">
        <div>Group: <span class="mono" style="color:var(--text)">${grp==="both"?"Both":grp==="g1"?"Group 1":"Group 2"}</span> · Next exam: <span style="color:${dl<=30?'#dc2626':dl<=60?'#d97706':'#16a34a'};font-weight:700">${dl}d</span></div>
        <div>Subjects: <span class="mono" style="color:var(--text)">${order.length}</span> · Chapters: <span class="mono" style="color:var(--text)">${allC.length}</span></div>
        <div>Rev 1: <span class="mono" style="color:#2563eb">${p1}</span> done · Mocks: <span class="mono" style="color:#16a34a">${mDone}/${allC.length}</span></div>
        <div>Plans: <span class="mono" style="color:var(--text)">${plans.length}</span> · Sessions: <span class="mono" style="color:var(--text)">${studySessions.length}</span></div>
        <div>Blueprint tasks: <span class="mono" style="color:#7c3aed">${bpTasks.length}</span></div>
      </div>
    </div>
  </div>`;
}
