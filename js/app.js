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
  else if (D[tab])           content = renderSubjectsHub();

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
