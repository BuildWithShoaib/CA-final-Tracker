// app.js — CA Final Study Tracker
// Main render loop, event handlers, actions, init

function render() {
  // Run risk engine on every render
  runRiskEngine();

  const M = computeMetrics();
  const dl = M.dl;
  const warMode = isWarMode();

  // ── Content routing ──
  let content = "";
  if (tab==="dashboard")  content = renderDash();
  else if (tab==="subjects") content = renderSubjectsHub();
  else if (tab==="vision")   content = renderVision();
  else if (tab==="timer")    content = renderTimer();
  else if (tab==="planner")  content = renderPlanner();
  else if (tab==="mocks")    content = renderMocks();
  else if (tab==="diary")    content = renderDiary();
  else if (tab==="strategy") content = renderExamStrategy();
  else if (tab==="calendar") content = renderCalendar();
  else if (tab==="settings") content = renderSettings();
  else if (tab==="about")    content = renderAbout();
  else if (D[tab])           content = renderSubjectsHub(); // legacy subject tab links → hub

  // ── Sidebar items ──
  const dlCol = dl<=30?"#dc2626":dl<=60?"#d97706":"#16a34a";
  const dlUrgency = dl<=14?"critical":dl<=30?"danger":dl<=60?"warn":"ok";
  const dlPal = {
    critical:{bg:"linear-gradient(90deg,#fee2e2,#fff1f2)",border:"#fca5a5",tc:"#dc2626"},
    danger:{bg:"linear-gradient(90deg,#fff1f2,#fff7ed)",border:"#fca5a5",tc:"#dc2626"},
    warn:{bg:"linear-gradient(90deg,#fffbeb,#fefce8)",border:"#fcd34d",tc:"#d97706"},
    ok:{bg:"linear-gradient(90deg,#f0fdf4,#f8fafc)",border:"#bbf7d0",tc:"#16a34a"},
  }[dlUrgency];
  const wks = Math.floor(dl/7), ext = dl%7;

  const sbItems = [
    { id:"dashboard", icon:"🏠", lbl:"Dashboard" },
    { id:"subjects",  icon:"📚", lbl:"Subjects" },
    { id:"planner",   icon:"📅", lbl:"Planner" },
    { id:"timer",     icon:"⏱",  lbl:"Focus Timer" },
    { id:"mocks",     icon:"📝", lbl:"Test Series" },
    { id:"diary",     icon:"📔", lbl:"Diary" },
    { id:"strategy",  icon:"🎯", lbl:"Exam Strategy" },
    { id:"calendar",  icon:"📆", lbl:"Study Calendar" },
    { id:"vision",    icon:"🌟", lbl:"Vision Board" },
    { id:"settings",  icon:"⚙",  lbl:"Settings" },
    { id:"about",     icon:"ℹ️", lbl:"About" },
  ];

  const sidebarHtml = `
  <div id="sb-overlay" class="${sidebarOpen?"open":""}" onclick="sidebarOpen=false;render()" style="touch-action:none"></div>
  <div id="sidebar" class="${sidebarOpen?"open":""}" style="touch-action:pan-y">
    <div class="sb-header">
      <div class="hdr-logo-icon" style="flex-shrink:0">📚</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:800;font-size:13px;color:var(--text);letter-spacing:-0.2px">CA Final</div>
        <div style="font-size:10px;color:var(--text3)">Performance Tracker</div>
      </div>
      <button class="hbg" onclick="sidebarOpen=false;render()" style="flex-shrink:0">
        <span></span><span></span><span></span>
      </button>
    </div>

    <div class="sb-section-label">Navigation</div>
    ${sbItems.map(({id,icon,lbl}) => {
      const isActive = tab===id || (id==="subjects" && D[tab]);
      const subRisk = D[id] ? M.subMetrics[id]?.avgRisk : 0;
      return `<button class="sb-item ${isActive?"active":""}"
        onclick="tab='${id}';${id==="subjects"?"activeSubjectHub=null;":""}sidebarOpen=false;expCh=null;editNotes=null;addChSub=null;render()">
        <span class="sb-icon">${icon}</span>
        <span>${lbl}</span>
        ${D[id]&&subRisk>=60?`<span class="sb-risk-dot"></span>`:""}
      </button>`;
    }).join("")}

    <div class="sb-section-label">Subjects</div>
    ${order.map(k=>{
      const s=D[k]; const sm=M.subMetrics[k];
      const isAct = (tab==="subjects"&&activeSubjectHub===k);
      return `<button class="sb-item ${isAct?"active":""}"
        onclick="tab='subjects';activeSubjectHub='${k}';sidebarOpen=false;expCh=null;editNotes=null;addChSub=null;render()"
        style="padding-left:28px">
        <span style="width:7px;height:7px;border-radius:50%;background:${s.color};flex-shrink:0"></span>
        <span style="flex:1">${s.short}</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text3)">${sm.r1p}%</span>
        ${sm.avgRisk>=60?`<span class="sb-risk-dot"></span>`:""}
      </button>`;
    }).join("")}
    <button class="sb-item" onclick="addSubModal=true;sidebarOpen=false;render()" style="padding-left:28px;color:var(--text3)">
      <span class="sb-icon">＋</span><span>Add Subject</span>
    </button>

    <div class="sb-footer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span>${dl} days to exam</span>
        <span style="color:${dlPal.tc};font-weight:700">${wks}w ${ext}d</span>
      </div>
      <div style="margin-top:4px;color:#2563eb;font-weight:600">${M.rev1Pct}% Rev 1 complete</div>
    </div>
  </div>`;

  // ── Countdown banner ──
  const countdownBanner = `<div class="countdown-banner no-print" style="background:${dlPal.bg};border-bottom:1px solid ${dlPal.border}">
    <div class="countdown-inner">
      <span style="font-size:16px">${dlUrgency==="critical"?"🚨":"🎯"}</span>
      <span style="color:var(--text);font-weight:700;font-size:13px">CA Final Exam</span>
      <span style="color:var(--text3)">·</span>
      <span style="color:var(--text2);font-size:12px">2 May 2026 (Saturday)</span>
      <span style="color:var(--text3)">·</span>
      <span style="font-size:12px;display:flex;align-items:center;gap:6px">
        <strong style="color:${dlPal.tc};animation:${dlUrgency==="critical"?"countdownPop 2s ease-in-out infinite":"none"}">${dl} days</strong>
        <span style="color:var(--text2)">· ${wks}w ${ext}d remaining</span>
        ${dlUrgency==="critical"?`<span style="background:#dc2626;color:#fff;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:800;animation:pulseOpacity 1.5s ease-in-out infinite">EXAM VERY CLOSE!</span>`:""}
      </span>
      <div style="margin-left:auto;display:flex;gap:10px">
        ${[{label:"Weeks",value:wks},{label:"Days",value:dl}].map(({label,value})=>`
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:6px 18px;text-align:center">
            <div style="color:${dlPal.tc};font-size:20px;font-weight:800;line-height:1">${value}</div>
            <div style="color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:2px">${label}</div>
          </div>`).join("")}
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:6px 18px;text-align:center">
          <div style="color:#2563eb;font-size:20px;font-weight:800;line-height:1">${M.rev1Pct}%</div>
          <div style="color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:2px">Rev 1</div>
        </div>
      </div>
    </div>
  </div>`;

  // ── Motivational quote bar ──
  const q = QUOTES[quoteIdx];
  const icon = CAT_ICON[q.cat] || "✨";
  const quoteBar = quoteVisible ? `<div class="quote-bar no-print">
    <div class="quote-inner">
      <div style="background:linear-gradient(100deg,#4c1d95 0%,#6d28d9 35%,#7c3aed 60%,#8b5cf6 100%);border-radius:12px;padding:12px 16px 12px 12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 20px rgba(109,40,217,0.3);position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.04) 50%,transparent 100%);background-size:400px 100%;animation:mqShimmer 4s ease-in-out infinite;"></div>
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid rgba(255,255,255,0.18);flex-shrink:0">${icon}</div>
        <div style="flex:1;min-width:0">
          <div style="color:rgba(255,255,255,0.6);font-size:9.5px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:3px">✦ Today's Motivation</div>
          <div style="color:#fff;font-size:13px;font-weight:600;font-style:italic;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">"${q.text}"</div>
          <div style="margin-top:4px;display:flex;align-items:center;gap:7px">
            <div style="width:20px;height:1.5px;background:rgba(255,255,255,0.5);border-radius:99px"></div>
            <span style="color:rgba(255,255,255,0.75);font-size:11px;font-weight:700">${q.author}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
          <button onclick="quoteIdx=(quoteIdx+1)%${QUOTES.length};render()" style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">⇄</button>
          <button onclick="quoteVisible=false;render()" style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.55);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center">×</button>
        </div>
      </div>
    </div>
  </div>` : "";

  // ── Streak badge ──
  const streakBadge = M.streak >= 1 ? (()=>{
    const se = M.streak>=7?"🔥":M.streak>=3?"⚡":"✨";
    const sg = M.streak>=7?"linear-gradient(135deg,#f59e0b,#d97706)":M.streak>=3?"linear-gradient(135deg,#fb923c,#f59e0b)":"linear-gradient(135deg,#fbbf24,#f59e0b)";
    return `<div style="background:${sg};border-radius:20px;padding:5px 13px;display:flex;align-items:center;gap:5px;flex-shrink:0;box-shadow:${M.streak>=3?"0 0 12px rgba(251,146,60,0.4)":"none"};animation:${M.streak>=3?"streakGlow 2.5s ease-in-out infinite":"none"}"><span style="font-size:14px">${se}</span><span style="color:#fff;font-size:12px;font-weight:800">${M.streak}d streak</span></div>`;
  })() : "";

  // ── Current tab label for header ──
  const tabLabel = {
    dashboard:"Dashboard", subjects:"Subjects", vision:"Vision", timer:"Timer",
    planner:"Planner", mocks:"Test Series", diary:"Diary",
    strategy:"Exam Strategy", calendar:"Study Calendar", settings:"Settings", about:"About"
  }[tab] || (D[tab]?D[tab].name:"");

  // ── Modals ──
  const addSubMod = addSubModal ? `<div class="ov" onclick="if(event.target===this){addSubModal=false;render()}">
    <div class="mbox">
      <div style="font-weight:800;font-size:18px;margin-bottom:16px;color:var(--text)">Add Subject</div>
      <div style="margin-bottom:12px"><div style="font-size:10px;color:var(--text3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;font-weight:600">Subject Name</div><input class="inp" placeholder="Strategic Management" value="${esc(newSubName)}" oninput="newSubName=this.value"/></div>
      <div style="margin-bottom:18px"><div style="font-size:10px;color:var(--text3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;font-weight:600">Short Code</div><input class="inp" placeholder="SM" value="${esc(newSubShort)}" oninput="newSubShort=this.value"/></div>
      <div style="display:flex;gap:8px"><button class="btn b-blue" onclick="addSub()">Add Subject</button><button class="btn b-ghost" onclick="addSubModal=false;render()">Cancel</button></div>
    </div>
  </div>` : "";

  const delModal = deletePlanModal ? renderDelPlanModal() : "";

  document.getElementById("app").innerHTML = `
    ${sidebarHtml}
    <div class="hdr">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="hbg no-print" onclick="sidebarOpen=true;render()">
          <span></span><span></span><span></span>
        </button>
        <div class="hdr-logo">
          <div class="hdr-logo-icon">📚</div>
          <span class="no-print">CA Final</span>
          <span style="color:var(--text3);font-weight:500;font-size:14px" class="no-print">/ ${tabLabel}</span>
          ${warMode?`<div class="war-badge">⚡ War Mode</div>`:""}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        ${streakBadge}
        <button class="quicktab no-print ${tab==="dashboard"?"active":""}" onclick="tab='dashboard';render()">🏠 Dashboard</button>
        <button class="quicktab no-print ${tab==="subjects"||D[tab]?"active":""}" onclick="tab='subjects';activeSubjectHub=null;render()">📚 Subjects</button>
        <div class="hdr-pill">
          <span style="color:#2563eb;font-weight:700">${M.rev1Pct}%</span><span style="color:var(--text3)">R1</span>
          <span style="color:var(--text3)">|</span>
          <span style="color:${dlCol};font-weight:700">${dl}</span><span style="color:var(--text3)">d left</span>
        </div>
        <div class="hdr-pill no-print">⏱ <span style="font-weight:600">${todayHrs()}h</span><span style="color:var(--text3)"> today</span></div>
      </div>
    </div>
    ${countdownBanner}
    ${quoteBar}
    <div class="content">${content}</div>
    ${addSubMod}${delModal}`;

  // Fix contenteditable
  if (tab==="vision") {
    const el = document.getElementById("vb-mantra");
    if (el && !el.innerText.trim()) el.innerText = visionBoard.mantra || "";
  }
}

// ══════════════════════════════════════════════════════
// ACTIONS
// ══════════════════════════════════════════════════════
function setTab(t) {
  // Subject keys go to the hub with that subject pre-selected
  if (D[t]) { tab="subjects"; activeSubjectHub=t; }
  else { tab=t; if(t==="subjects") activeSubjectHub=null; }
  expCh=null; editNotes=null; addChSub=null; render();
}
function toggleExpand(id) { expCh=expCh===id?null:id;editNotes=null;render(); }

function toggleRev(sk, chId, ri) {
  const c = D[sk]?.chapters.find(x=>x.id===chId); if(!c) return;
  c.revisions[ri].done = !c.revisions[ri].done;
  c.revisions[ri].date = c.revisions[ri].done ? todayStr() : null;
  if(c.revisions[ri].done) recordActivity(); // streak: chapter completed
  saveD(); render();
}
function changeCat(sk, chId, cat) {
  const c = D[sk]?.chapters.find(x=>x.id===chId); if(!c) return;
  c.category = cat; saveD(); render();
}
function setConfidence(sk, chId, val) {
  const c = D[sk]?.chapters.find(x=>x.id===chId); if(!c) return;
  c.confidenceScore = val; saveD();
  // Update display without full render
  const el = document.querySelector(`input[oninput*="${chId}"]`);
  const next = el?.nextElementSibling;
  if (next) next.textContent = val + "%";
  runRiskEngine();
}
function setMockScore(sk, chId, val) {
  const c = D[sk]?.chapters.find(x=>x.id===chId); if(!c) return;
  c.mockAverage = val; saveD();
}
function saveNotes(sk, chId) {
  const c = D[sk]?.chapters.find(x=>x.id===chId); if(!c) return;
  const el = document.getElementById("na_"+chId);
  if(el) c.notes = el.value;
  editNotes=null; saveD(); render();
}
function delCh(sk, chId) {
  if(!confirm("Delete this chapter?")) return;
  D[sk].chapters = D[sk].chapters.filter(c=>c.id!==chId);
  expCh=null; saveD(); render();
}
function addCh(sk) {
  const nm = (newChName||"").trim(); if(!nm){alert("Enter name");return;}
  D[sk].chapters.push({
    id:sk+"_"+Date.now(),name:nm,category:newChCat,
    revisions:[{done:false,date:null,retentionScore:0},{done:false,date:null,retentionScore:0},{done:false,date:null,retentionScore:0},{done:false,date:null,retentionScore:0}],
    mockAverage:null,mockAttempts:0,confidenceScore:50,notes:"",riskScore:0,priorityIndex:0,daysSinceTouch:999
  });
  newChName=""; addChSub=null; saveD(); render();
}
function addSub() {
  const nm=(newSubName||"").trim(), sh=(newSubShort||"").trim();
  if(!nm||!sh){alert("Fill both fields");return;}
  const k = sh.toUpperCase().replace(/\s/g,"").slice(0,6);
  if(D[k]){alert("Code already exists");return;}
  const cols=["#7c83ff","#26c6da","#4db6ac","#ff8a65","#f06292","#aed581"];
  D[k]={name:nm,short:k,color:cols[Math.floor(Math.random()*cols.length)],chapters:[]};
  order.push(k); newSubName=""; newSubShort=""; addSubModal=false; saveD(); setTab(k);
}
function markTodayCh(sk, chId) {
  const c = D[sk]?.chapters.find(x=>x.id===chId); if(!c) return;
  const done = !c.revisions[0].done;
  c.revisions[0].done = done;
  c.revisions[0].date = done ? todayStr() : null;
  if(done) recordActivity(); // streak: chapter marked done
  saveD(); render();
}

// Planner
function initWiz(){pView="create";wStep=1;wSubs=[];wRev=0;wDays=4;wStart=todayStr();wAssign={};editingPlanId=null;render();}
function addWS(sk){if(wSubs.length<2&&!wSubs.includes(sk))wSubs.push(sk);render();}

function editPlan(planId) {
  const p = plans.find(pl => pl.id === planId);
  if (!p) return;
  editingPlanId = planId;
  // Populate wizard state from real plan schema
  wSubs  = [...(p.subjectKeys || [])];
  wRev   = p.revIndex   || 0;
  wDays  = p.totalDays  || 4;
  wStart = p.startDate  || todayStr();
  // Rebuild wAssign from existing done state so pre-ticked chapters are preserved
  wAssign = {};
  (p.days || []).forEach(day => {
    (day.chapters || []).forEach(ch => {
      // Keep assignment to same day-slot; use "1" as default if not done
      if (!ch.done) wAssign[ch.id] = "1";
    });
  });
  wStep = 1;
  pView = "create";
  render();
}
function rmWS(sk){wSubs=wSubs.filter(s=>s!==sk);render();}
function goStep3(){
  const all=wSubs.flatMap(sk=>(D[sk]?.chapters||[]).map(c=>({...c,_sub:sk,_done:c.revisions[wRev]?.done})));
  const a={};all.forEach(c=>{if(!c._done)a[c.id]="1";});wAssign=a;wStep=3;render();
}
function applyQA(){
  ["A","B","C"].forEach(cat=>{
    const el=document.getElementById("qa"+cat);if(!el||!el.value)return;
    wSubs.flatMap(sk=>(D[sk]?.chapters||[]).map(c=>({...c,_sub:sk,_done:c.revisions[wRev]?.done}))).forEach(c=>{if(!c._done&&c.category===cat)wAssign[c.id]=el.value;});
  });render();
}
function createPlan(){
  const days=Array.from({length:wDays},()=>[]);

  // PART 3 — When editing, preserve completed task ticks from the old plan
  const oldPlan = editingPlanId ? plans.find(p => p.id === editingPlanId) : null;
  const oldDoneIds = new Set(); // chapter ids already marked done in old plan
  if (oldPlan) {
    (oldPlan.days || []).forEach(day =>
      (day.chapters || []).forEach(ch => { if (ch.done) oldDoneIds.add(ch.id); })
    );
  }

  wSubs.flatMap(sk=>(D[sk]?.chapters||[]).map((c,i)=>({...c,_sub:sk,_done:c.revisions[wRev]?.done}))).forEach(c=>{
    if(c._done)return; // already fully revised — skip
    const di=Math.max(0,Math.min(wDays-1,parseInt(wAssign[c.id]||"1",10)-1));
    // Preserve done=true for tasks completed in the old plan (isCompleted guard)
    const wasCompleted = oldDoneIds.has(c.id);
    days[di].push({id:c.id, sub:c._sub, done:wasCompleted});
  });

  const newPlanData = {
    subjectKeys:wSubs, revIndex:wRev, totalDays:wDays,
    startDate:wStart, days:days.map(d=>({chapters:d}))
  };

  if (editingPlanId) {
    // Update existing plan in-place, keep original id and created timestamp
    const idx = plans.findIndex(p => p.id === editingPlanId);
    if (idx !== -1) {
      plans[idx] = { ...plans[idx], ...newPlanData };
      activePlanId = editingPlanId;
    } else {
      // Fallback: old plan somehow gone — push as new
      const plan = { id: Date.now().toString(), created: new Date().toISOString(), ...newPlanData };
      plans.push(plan);
      activePlanId = plan.id;
    }
    editingPlanId = null;
  } else {
    const plan = { id: Date.now().toString(), created: new Date().toISOString(), ...newPlanData };
    plans.push(plan);
    activePlanId = plan.id;
  }

  activeDay=0; pView="active"; saveP(); render();
}
function openPlan(id,td){activePlanId=id;activeDay=isNaN(td)?0:td;pView="active";render();}
function togglePCh(planId,dayIdx,chIdx){
  const plan=plans.find(p=>p.id===planId);if(!plan)return;
  const ch=plan.days[dayIdx]?.chapters[chIdx];if(!ch)return;
  ch.done=!ch.done;
  const sub=D[ch.sub]; if(sub){const c=sub.chapters.find(x=>x.id===ch.id);if(c){c.revisions[plan.revIndex].done=ch.done;c.revisions[plan.revIndex].date=ch.done?todayStr():null;}}
  if(ch.done) recordActivity(); // streak: planner task completed
  saveP();saveD();render();
}
function showDelPlan(id){deletePlanModal=id;render();}
function renderDelPlanModal(){
  const plan=plans.find(p=>p.id===deletePlanModal);if(!plan)return"";
  const dn=plan.days.flatMap(d=>d.chapters.filter(c=>c.done)).length;
  return `<div class="ov" onclick="if(event.target===this){deletePlanModal=null;render()}">
    <div class="mbox">
      <div style="font-weight:700;font-size:16px;margin-bottom:8px">Delete Plan?</div>
      <div style="color:var(--text3);font-size:13px;margin-bottom:16px">${dn} chapter${dn!==1?"s":""} ticked in this plan.</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        <button class="btn b-green" onclick="delPlanKeep('${plan.id}')">Delete — keep ticks</button>
        <button class="btn b-red" onclick="delPlanClear('${plan.id}')">Delete + clear ticks</button>
        <button class="btn b-ghost" onclick="deletePlanModal=null;render()">Cancel</button>
      </div>
    </div>
  </div>`;
}
function delPlanKeep(id){plans=plans.filter(p=>p.id!==id);if(activePlanId===id){pView="list";activePlanId=null;}deletePlanModal=null;saveP();render();}
function delPlanClear(id){
  const plan=plans.find(p=>p.id===id);
  if(plan)plan.days.forEach(d=>d.chapters.forEach(ch=>{if(ch.done){const s=D[ch.sub];if(s){const c=s.chapters.find(x=>x.id===ch.id);if(c){c.revisions[plan.revIndex].done=false;c.revisions[plan.revIndex].date=null;}}}}));
  plans=plans.filter(p=>p.id!==id);if(activePlanId===id){pView="list";activePlanId=null;}deletePlanModal=null;saveP();saveD();render();
}

// Mocks
function toggleChMock(chId){if(!mocks[chId])mocks[chId]={};mocks[chId].done=!mocks[chId].done;saveMocks();render();}
function markAllMocks(sk,val){(D[sk]?.chapters||[]).forEach(c=>{if(!mocks[c.id])mocks[c.id]={};mocks[c.id].done=!!val;});saveMocks();render();}
function addFullTest(){
  const name=prompt("Test name:");if(!name)return;
  const date=prompt("Date:",new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}));
  const score=prompt("Score (e.g. 68%):")||"";
  if(!mocks.fullTests)mocks.fullTests=[];
  mocks.fullTests.push({name:name.trim(),date:date||"",score,done:false});
  saveMocks();render();
}
function toggleFullTest(i){if(mocks.fullTests?.[i])mocks.fullTests[i].done=!mocks.fullTests[i].done;saveMocks();render();}
function delFullTest(i){if(!confirm("Delete?"))return;mocks.fullTests.splice(i,1);saveMocks();render();}

// Settings
function resetProg(){if(!confirm("Reset ALL revision ticks?"))return;Object.values(D).forEach(s=>s.chapters.forEach(c=>{c.revisions=[{done:false,date:null,retentionScore:0},{done:false,date:null,retentionScore:0},{done:false,date:null,retentionScore:0},{done:false,date:null,retentionScore:0}];}));saveD();render();}
function resetAll(){if(!confirm("Full reset to defaults?"))return;D=JSON.parse(JSON.stringify(DSUB_DEFAULT));order=Object.keys(D);plans=[];saveD();saveP();render();}
function setTheme(){} // theme handled by CSS now

// Export
function exportCSV(){
  const rows=[["Subject","Chapter","Category","Risk","Rev1","Rev1 Date","Rev2","Rev3","Rev4","Mock Done","Mock Avg","Notes"]];
  order.forEach(k=>{const s=D[k];(s?.chapters||[]).forEach(c=>rows.push([s.name,c.name,c.category,c.riskScore,...[0,1,2,3].map(i=>c.revisions[i]?.done?"Yes":"No"),c.revisions[0]?.date||"",...[1,2,3].map(i=>c.revisions[i]?.done?"Yes":"No"),mocks[c.id]?.done?"Yes":"No",c.mockAverage||"",c.notes||""]));});
  const csv=rows.map(r=>r.map(v=>'"'+String(v||"").replace(/"/g,'""')+'"').join(",")).join("\n");
  dlFile("ca-os-"+todayStr()+".csv",new Blob([csv],{type:"text/csv"}));
}
function exportXLSX(){
  if(typeof XLSX==="undefined"){alert("XLSX not loaded");return;}
  const wb=XLSX.utils.book_new();
  const allC=order.flatMap(k=>D[k]?.chapters||[]);
  const M=computeMetrics();
  const sumData=[["CA Final Performance OS — Export"],["Generated",new Date().toLocaleDateString("en-IN")],["Days Left",daysLeft()],["Predicted Score",M.predictedScore+"/800"],[""],["Subject","Total","Rev1","Rev2","Avg Risk","Mocks"],
    ...order.map(k=>{const s=D[k],c=s?.chapters||[];return[s.name,c.length,c.filter(x=>x.revisions[0].done).length,c.filter(x=>x.revisions[1].done).length,Math.round(c.reduce((a,x)=>a+x.riskScore,0)/Math.max(1,c.length)),c.filter(x=>mocks[x.id]?.done).length];}),
    [""],["TOTAL",allC.length,allC.filter(x=>x.revisions[0].done).length,allC.filter(x=>x.revisions[1].done).length,M.avgRisk,allC.filter(x=>mocks[x.id]?.done).length]
  ];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(sumData),"Summary");
  order.forEach(k=>{
    const s=D[k];
    const rows=[[s.name],["Chapter","Cat","Risk","R1","R1 Date","R2","R3","R4","Mock","Score","Notes"],
      ...(s.chapters||[]).map(c=>[c.name,c.category,c.riskScore,...[0,1,2,3].map(i=>c.revisions[i]?.done?"✓":""),c.revisions[0]?.date||"",mocks[c.id]?.done?"✓":"",c.mockAverage||"",c.notes||""])];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),s.short.slice(0,28));
  });
  XLSX.writeFile(wb,"CA-OS-"+todayStr()+".xlsx");
}
function backup(){
  const b={D,order,plans,mocks,settings,visionBoard,studySessions,ts:new Date().toISOString(),v:DATA_VERSION};
  dlFile("ca-os-backup-"+todayStr()+".json",new Blob([JSON.stringify(b,null,2)],{type:"application/json"}));
}
function restoreBackup(inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    try{
      const b=JSON.parse(ev.target.result);
      if(b.D){D=b.D;order=b.order||Object.keys(D);order.forEach(k=>{if(D[k])D[k].chapters=D[k].chapters.map(migrateChapter);});}
      if(b.plans)plans=b.plans;if(b.mocks)mocks=b.mocks;if(b.settings)Object.assign(settings,b.settings);
      if(b.visionBoard)Object.assign(visionBoard,b.visionBoard);
      if(b.studySessions)studySessions=b.studySessions;
      saveD();saveP();saveMocks();saveSet();saveVB();alert("Restored!");render();
    }catch(x){alert("Invalid file");}
  };r.readAsText(f);
}
function dlFile(name,blob){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);}

// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════
load();
render();
setInterval(()=>{if(tab==="dashboard")render();},60000);

// Visibility API: sync timer display immediately when tab re-focuses
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && flipTimerRunning) {
    _timerSync(); // recompute remain from real elapsed time
    saveTimerState(); // update persisted startTs for next potential refresh
    // Update DOM directly without full re-render
    const f = fmtFlip(flipTimerRemain);
    const timeStr = flipTimerGoal >= 3600 ? `${f.h}:${f.m}:${f.s}` : `${f.m}:${f.s}`;
    const mainTime = document.getElementById("main-timer-display");
    if (mainTime) mainTime.textContent = timeStr;
    if (focusModeActive) updateFocusDisplay();
  }
});

// ─── Focus Mode Overlay Functions ───────────────────────────────
// Focus mode pause/resume from overlay
function focusPauseResume() {
  if(flipTimerRunning){ flipPause(); }
  else { flipResume(); }
  const btn = document.getElementById('focus-pause-btn');
  if(btn) btn.textContent = flipTimerRunning ? '▶ Resume' : '⏸ Pause';
  updateFocusDisplay();
}
// Update focus label when entering
const _origEnterFocusMode = enterFocusMode;
function enterFocusMode() {
  const el = document.getElementById('focus-overlay');
  if(el){ el.style.display='flex'; }
  // Sync label
  const lbl = document.getElementById('focus-label-text');
  if(lbl) lbl.textContent = flipTimerLabel || 'Focus Session';
  // Sync pause button
  const btn = document.getElementById('focus-pause-btn');
  if(btn) btn.textContent = flipTimerRunning ? '⏸ Pause' : '▶ Resume';
  updateFocusDisplay();
  try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); } catch(x){}
  requestWakeLock();
  focusModeActive = true;
}
