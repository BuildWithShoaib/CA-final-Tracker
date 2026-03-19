// ui-dash.js — CA Final Study Tracker
// Dashboard + Subject tab render functions

// ── Mobile layout helper ──────────────────────────────────────────
// Single source of truth for responsive breakpoint in JS.
// Use this everywhere a layout decision depends on screen width.
function mob() { return window.innerWidth < 768; }

function renderDash() {
  const M = computeMetrics();
  const dl = M.dl;
  const warMode = isWarMode();
  const auto = generateAutoSchedule();
  const hrs = todayHrs();
  const examDs = getExamDateStr();
  const examDate = getExamDate();
  const examFmt = examDate.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});

  const urgencyCol    = dl <= 14 ? "#dc2626" : dl <= 30 ? "#d97706" : dl <= 60 ? "#2563eb" : "#16a34a";
  const urgencyBg     = dl <= 14 ? "#fff5f5" : dl <= 30 ? "#fffbeb" : dl <= 60 ? "#eff6ff" : "#f0fdf4";
  const weeksLeft     = Math.floor(dl / 7), daysRem = dl % 7;

  // FIX 1: Stats row grid — mobile: 2-col, desktop: auto-fit minmax(130px)
  const statsGridCols = mob()
    ? "grid-template-columns:1fr 1fr;gap:10px"
    : "grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px";

  const statsRow = `
  <div class="fu" style="display:grid;${statsGridCols};margin-bottom:16px">
    <div style="background:${urgencyBg};border:1.5px solid ${urgencyCol}33;border-radius:14px;padding:14px 16px;position:relative;overflow:hidden">
      ${warMode?`<div style="position:absolute;top:0;left:0;right:0;height:2px;background:${urgencyCol};animation:warPulse 2s infinite"></div>`:""}
      <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${urgencyCol};opacity:0.75;margin-bottom:4px">${examDs?"Exam Date":"⚠ Set Exam Date"}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:${mob()?'28px':'36px'};font-weight:900;color:${urgencyCol};line-height:1">${dl}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px">days · ${weeksLeft}w ${daysRem}d</div>
      <div style="font-size:10px;color:${urgencyCol};font-weight:600;margin-top:2px;opacity:0.8">${examFmt}</div>
    </div>
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:14px 16px">
      <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:4px">Study Streak</div>
      <div style="display:flex;align-items:baseline;gap:5px">
        <span style="font-family:'JetBrains Mono',monospace;font-size:${mob()?'28px':'36px'};font-weight:900;color:${M.streak>=7?"#d97706":M.streak>=3?"#7c3aed":"var(--text)"};line-height:1">${M.streak}</span>
        <span style="font-size:13px;color:var(--text3)">days</span>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px">${M.streak>=7?"🔥 On fire":M.streak>=3?"✨ Consistent":"📅 Keep going"}</div>
    </div>
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:14px 16px">
      <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:4px">Today's Hours</div>
      <div style="display:flex;align-items:baseline;gap:5px">
        <span style="font-family:'JetBrains Mono',monospace;font-size:${mob()?'28px':'36px'};font-weight:900;color:#0891b2;line-height:1">${hrs}</span>
        <span style="font-size:13px;color:var(--text3)">/ ${settings.dailyHourTarget||6}h</span>
      </div>
      <div style="width:100%;height:4px;background:var(--border);border-radius:99px;overflow:hidden;margin-top:8px">
        <div style="width:${Math.min(100,Math.round(hrs/(settings.dailyHourTarget||6)*100))}%;height:100%;background:#0891b2;border-radius:99px;transition:width .5s"></div>
      </div>
    </div>
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:14px 16px">
      <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:4px">Revision 1</div>
      <div style="display:flex;align-items:baseline;gap:5px">
        <span style="font-family:'JetBrains Mono',monospace;font-size:${mob()?'28px':'36px'};font-weight:900;color:#2563eb;line-height:1">${M.rev1Pct}%</span>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px">${M.rev1Done}/${M.total} chapters</div>
      <div style="width:100%;height:4px;background:var(--border);border-radius:99px;overflow:hidden;margin-top:6px">
        <div style="width:${M.rev1Pct}%;height:100%;background:#2563eb;border-radius:99px;transition:width .5s"></div>
      </div>
    </div>
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:14px 16px">
      <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:4px">Cat A Covered</div>
      <div style="display:flex;align-items:baseline;gap:5px">
        <span style="font-family:'JetBrains Mono',monospace;font-size:${mob()?'28px':'36px'};font-weight:900;color:#7c3aed;line-height:1">${M.catAPct}%</span>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px">${M.catADone}/${M.catA.length} chapters</div>
      <div style="width:100%;height:4px;background:var(--border);border-radius:99px;overflow:hidden;margin-top:6px">
        <div style="width:${M.catAPct}%;height:100%;background:#7c3aed;border-radius:99px;transition:width .5s"></div>
      </div>
    </div>
  </div>`;

  const activePlan = plans.find(p => p.id === activePlanId);
  const today = todayStr();
  let plannerTasks = null;
  let plannerDayLabel = "";
  if (activePlan) {
    const startDate = new Date(activePlan.startDate || today);
    const elapsed = Math.floor((new Date(today) - startDate) / 86400000);
    const dayIdx = Math.max(0, Math.min(elapsed, activePlan.days.length - 1));
    const planDay = activePlan.days[dayIdx];
    plannerTasks = planDay?.chapters || [];
    plannerDayLabel = `Day ${dayIdx+1} of ${activePlan.days.length} · ${activePlan.name||"Plan"}`;
  }

  const bpTodayTasks = bpTasks.filter(t => t.date === today && t.subKey);

  const hasPlan = activePlan && plannerTasks !== null;
  const planDone = hasPlan ? plannerTasks.filter(c=>c.done).length : 0;
  const planTotal = hasPlan ? plannerTasks.length : 0;
  const planPct = planTotal > 0 ? Math.round(planDone/planTotal*100) : (hasPlan ? 100 : 0);
  const planProgressCol = planPct >= 100 ? "#16a34a" : planPct >= 50 ? "#d97706" : "#dc2626";

  const todayChs = auto.todays;
  const todayDone = todayChs.filter(c => c.revisions[0].done).length;
  const todayTotal = auto.dailyLoad;
  const todayPct = todayTotal > 0 ? Math.round(todayDone/todayTotal*100) : 100;
  const todayProgressCol = todayPct >= 100 ? "#16a34a" : todayPct >= 50 ? "#d97706" : "#dc2626";
  const nextUp = todayChs.find(c => !c.revisions[0].done);

  const todayCard = `
  <div class="card fu" style="margin-bottom:0${hasPlan&&planPct>=100?";border-color:rgba(22,163,74,0.4);background:linear-gradient(135deg,#f0fdf4,#ffffff)":""}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div class="panel-label" style="margin-bottom:0">📋 ${hasPlan ? "Today's Plan" : "Today's Study Target"}</div>
      <div style="display:flex;align-items:center;gap:8px">
        ${hasPlan
          ? `<span style="font-size:10px;color:var(--text3)">${plannerDayLabel}</span>
             <button onclick="setTab('planner')" style="background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;color:var(--text2);cursor:pointer">Open →</button>`
          : `<span style="font-size:10px;color:var(--text3)">${auto.total} pending · ${dl}d left</span>`
        }
      </div>
    </div>
    ${hasPlan ? `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:12px;font-weight:700;color:${planProgressCol}">${planPct>=100?"✅ Day Complete!":planPct+"% done"}</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text3)">${planDone}/${planTotal}</span>
      </div>
      <div style="width:100%;height:8px;background:var(--border);border-radius:99px;overflow:hidden">
        <div style="width:${Math.min(planPct,100)}%;height:100%;background:${planProgressCol};border-radius:99px;transition:width .5s"></div>
      </div>
    </div>
    ${plannerTasks.length > 0 ? `
    <div style="display:flex;flex-direction:column;gap:4px;max-height:280px;overflow-y:auto;padding-right:2px">
      ${plannerTasks.map((ch,ci) => {
        const s = D[ch.sub]; const col = s?.color || "#94a3b8";
        const chData = s?.chapters?.find(c => c.id === ch.id);
        const chName = chData?.name || ch.id;
        const chCat  = chData?.category || "";
        const catCol = chCat==="A"?"#dc2626":chCat==="B"?"#d97706":"#64748b";
        return `<div style="display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;background:${ch.done?"var(--surface2)":"var(--surface)"};border:1px solid ${ch.done?"var(--border)":"var(--border2)"};opacity:${ch.done?0.6:1};flex-shrink:0"
          onclick="togglePCh('${activePlan.id}',${activePlan.days.findIndex(d=>d.chapters===plannerTasks)||0},${ci})">
          <div class="chkbox ${ch.done?"done":""}" style="flex-shrink:0">${ch.done?chkSvg():""}</div>
          <div style="width:3px;height:16px;border-radius:2px;background:${col};flex-shrink:0"></div>
          <span style="font-size:13px;font-weight:600;color:var(--text);flex:1;text-decoration:${ch.done?"line-through":"none"};line-height:1.4;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span style="color:${col};font-family:'JetBrains Mono',monospace;font-weight:700;font-size:11px">${s?.short||ch.sub}</span><span style="color:var(--text3);margin:0 5px">→</span>${esc(chName)}</span>
          ${chCat?`<span style="background:${catCol}18;color:${catCol};font-size:9px;font-weight:800;padding:2px 6px;border-radius:5px;flex-shrink:0;letter-spacing:0.5px">${chCat}</span>`:""}
        </div>`;
      }).join("")}
    </div>` : `<div style="text-align:center;padding:16px;color:#16a34a;font-weight:700">🎉 No tasks for today!</div>`}
    ` : `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:12px;font-weight:700;color:${todayProgressCol}">${todayPct>=100?"✅ Target Complete!":todayPct+"% of daily target"}</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text3)">${todayDone}/${todayTotal}</span>
      </div>
      <div style="width:100%;height:8px;background:var(--border);border-radius:99px;overflow:hidden">
        <div style="width:${Math.min(todayPct,100)}%;height:100%;background:${todayProgressCol};border-radius:99px;transition:width .5s"></div>
      </div>
    </div>
    ${nextUp?`
    <div style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border:1.5px solid rgba(37,99,235,0.2);border-radius:11px;padding:11px 13px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
      <div style="background:#2563eb;border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;color:#fff;font-weight:700">→</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:9px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin-bottom:1px">Up Next</div>
        <div style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(nextUp.name)}</div>
      </div>
      <div class="chkbox ${nextUp.revisions[0].done?"done":""}" onclick="markTodayCh('${nextUp._sub}','${nextUp.id}')" style="flex-shrink:0">${nextUp.revisions[0].done?chkSvg():""}</div>
    </div>`:""}
    ${todayChs.length>0?`
    <div style="display:flex;flex-direction:column;gap:4px;max-height:260px;overflow-y:auto;padding-right:2px">
      ${todayChs.map(c=>{
        const col=D[c._sub]?.color||"#94a3b8";const done=c.revisions[0].done;
        return `<div style="display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;background:${done?"var(--surface2)":"var(--surface)"};border:1px solid ${done?"var(--border)":"var(--border2)"};opacity:${done?0.6:1};flex-shrink:0">
          <div style="width:3px;height:16px;border-radius:2px;background:${col};flex-shrink:0"></div>
          <span style="font-size:13px;font-weight:600;color:var(--text);flex:1;text-decoration:${done?"line-through":"none"};line-height:1.4;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span style="color:${col};font-family:'JetBrains Mono',monospace;font-weight:700;font-size:11px">${D[c._sub]?.short}</span><span style="color:var(--text3);margin:0 5px">→</span>${esc(c.name)}</span>
          <span class="bdg ${c.category==='A'?'bdg-a':c.category==='B'?'bdg-b':'bdg-c'}" style="flex-shrink:0">${c.category}</span>
          <div class="chkbox ${done?"done":""}" onclick="markTodayCh('${c._sub}','${c.id}')" style="flex-shrink:0">${done?chkSvg():""}</div>
        </div>`;
      }).join("")}
    </div>`:`<div style="text-align:center;padding:16px;color:#16a34a;font-weight:700">🎉 All caught up — start a mock!</div>`}
    ${!hasPlan?`<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:11px;color:var(--text3)">No active plan — using auto schedule</span>
      <button onclick="setTab('planner')" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer">Create Plan →</button>
    </div>`:""}
    `}
  </div>`;

  const bpTodayCard = bpTodayTasks.length > 0 ? (()=>{
    const rows = bpTodayTasks.map(t => {
      const s = D[t.subKey];
      const col = s?.color || '#7c3aed';
      const typeLabel = t.type==='study'?'Rev 1':t.type==='revision'?'Revision':'Final';
      const typeBg = t.type==='study'?'#16a34a':t.type==='revision'?'#2563eb':'#dc2626';
      return '<div style="display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:10px;background:var(--surface2);flex-shrink:0">'
        +'<div style="width:3px;height:16px;border-radius:2px;background:'+col+';flex-shrink:0"></div>'
        +'<span style="font-size:13px;font-weight:600;color:var(--text);flex:1;line-height:1.4;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
        +'<span style="color:'+col+';font-family:\'JetBrains Mono\',monospace;font-weight:700;font-size:11px">'+(s?.short||t.subKey)+'</span>'
        +'<span style="color:var(--text3);margin:0 5px">→</span>'+esc(t.chapter||t.label)
        +'</span>'
        +'<span style="background:'+typeBg+'18;color:'+typeBg+';font-size:9px;font-weight:800;padding:2px 6px;border-radius:5px;flex-shrink:0">'+typeLabel+'</span>'
        +'</div>';
    }).join('');
    return '<div class="card fu" style="margin-top:12px;border-left:4px solid #7c3aed">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">'
      +'<div class="panel-label" style="margin-bottom:0;color:#7c3aed">📅 Blueprint Schedule — Today</div>'
      +'<button onclick="setTab(\'calendar\')" style="background:#f5f3ff;border:1.5px solid #7c3aed44;color:#7c3aed;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer">View Calendar →</button>'
      +'</div>'
      +'<div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">'+rows+'</div>'
      +'</div>';
  })() : '';

  // FIX 2: Progress + Subjects grid — mobile: single col, desktop: 2-col
  const progressGridCols = mob()
    ? "grid-template-columns:1fr"
    : "grid-template-columns:1fr 1fr";

  const progressCard2 = `
  <div style="display:grid;${progressGridCols};gap:14px;margin-top:14px">
    <div class="card fu">
      <div class="panel-label">📊 Overall Progress</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${[
          {lbl:"Revision 1",pct:M.rev1Pct,col:"#2563eb",sub:`${M.rev1Done}/${M.total} chapters`},
          {lbl:"Cat A Coverage",pct:M.catAPct,col:"#7c3aed",sub:`${M.catADone}/${M.catA.length} chapters`},
          {lbl:"Rev 2 Done",pct:M.rev2Pct,col:"#0891b2",sub:`${M.rev2Done}/${M.total} chapters`},
        ].map(({lbl,pct,col,sub})=>`
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px;font-weight:600;color:var(--text2)">${lbl}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${col};font-weight:700">${pct}%</span>
            </div>
            <div class="bar-wrap bar-thick"><div class="bar-fill" style="width:${pct}%;background:${col}"></div></div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${sub}</div>
          </div>`).join("")}
      </div>
    </div>
    <div class="card fu">
      <div class="panel-label">📚 Subjects</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${order.map(sk=>{
          const s=D[sk];const sm=M.subMetrics[sk];
          return `<div style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:6px 8px;border-radius:9px;background:var(--surface2)" onclick="setTab('${sk}')">
            <div style="width:7px;height:7px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
            <span style="font-size:12px;font-weight:700;color:${s.color};min-width:38px">${s.short}</span>
            <div style="flex:1;height:5px;background:var(--border);border-radius:99px;overflow:hidden">
              <div style="width:${sm.r1p}%;height:100%;background:${s.color};border-radius:99px"></div>
            </div>
            <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text3);min-width:30px;text-align:right">${sm.r1p}%</span>
            ${sm.avgRisk>=60?`<span style="width:6px;height:6px;border-radius:50%;background:#dc2626;flex-shrink:0"></span>`:""}
          </div>`;
        }).join("")}
      </div>
    </div>
  </div>`;

  return `
  ${statsRow}
  <div style="margin-bottom:16px">${todayCard}${bpTodayCard}</div>
  ${progressCard2}`;
}

// ══════════════════════════════════════════════════════
// SUBJECT TAB
// ══════════════════════════════════════════════════════
function sortedChs(sk) {
  const s = D[sk]; if (!s) return [];
  const sf = sortBy[sk] || "risk", ff = filterBy[sk] || "all";
  let list = s.chapters.map((c, i) => ({ ...c, _realIdx: i }));
  if (ff === "pending") list = list.filter(c => !c.revisions[0].done);
  else if (ff === "done") list = list.filter(c => c.revisions[0].done);
  else if (ff !== "all") list = list.filter(c => c.category === ff);
  if (sf === "risk") list.sort((a, b) => b.riskScore - a.riskScore);
  else if (sf === "cat") list.sort((a,b) => "ABC".indexOf(a.category) - "ABC".indexOf(b.category));
  else if (sf === "priority") list.sort((a, b) => b.priorityIndex - a.priorityIndex);
  else if (sf === "pending") list.sort((a,b) => (a.revisions[0].done?1:-1)-(b.revisions[0].done?1:-1));
  return list;
}

function renderSub(sk) {
  const s = D[sk]; if (!s) return "";
  const chs = sortedChs(sk);
  const sf = sortBy[sk] || "risk", ff = filterBy[sk] || "all";
  const col = s.color;

  const r1 = s.chapters.filter(c => c.revisions[0].done).length;
  const r2 = s.chapters.filter(c => c.revisions[1].done).length;
  const r3 = s.chapters.filter(c => c.revisions[2].done).length;
  const r4 = s.chapters.filter(c => c.revisions[3].done).length;
  const tot = s.chapters.length;
  const r1p = tot ? Math.round(r1/tot*100) : 0;
  const highR = s.chapters.filter(c => c.riskScore >= 60).length;
  const avgRisk = Math.round(s.chapters.reduce((s2,c) => s2+c.riskScore, 0) / Math.max(1, tot));
  const mDone = s.chapters.filter(c => mocks[c.id]?.done).length;

  const revCols = ["#2563eb","#0891b2","#16a34a","#d97706"];

  const header = `<div class="card" style="border-left:4px solid ${col};margin-bottom:14px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div style="min-width:0;flex:1">
        <div class="mono" style="font-size:10px;color:${col};letter-spacing:2px;margin-bottom:4px;font-weight:700">${s.short} SUBJECT</div>
        <div style="font-size:20px;font-weight:800;color:var(--text)">${s.name}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:3px">${tot} chapters · ${r1} done (Rev 1) · ${highR} high-risk · ${mDone} tested</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        ${[0,1,2,3].map(i => `<div style="text-align:center">
          ${ringW([r1,r2,r3,r4][i]/tot*100|0, revCols[i], 44, 3)}
          <div style="font-size:9px;color:var(--text3);margin-top:3px">R${i+1}</div>
        </div>`).join("")}
        <div style="text-align:center">
          <div class="mono" style="font-size:22px;font-weight:700;color:${avgRisk>=60?"#dc2626":avgRisk>=40?"#d97706":"#16a34a"}">${avgRisk}</div>
          <div style="font-size:9px;color:var(--text3)">Avg Risk</div>
        </div>
      </div>
    </div>
  </div>`;

  const controls = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
    <select class="sel" onchange="sortBy['${sk}']=this.value;render()">
      <option value="risk" ${sf==="risk"?"selected":""}>Sort: Risk Score ↓</option>
      <option value="priority" ${sf==="priority"?"selected":""}>Sort: Priority Index ↓</option>
      <option value="cat" ${sf==="cat"?"selected":""}>Sort: A → B → C</option>
      <option value="pending" ${sf==="pending"?"selected":""}>Sort: Pending First</option>
    </select>
    <select class="sel" onchange="filterBy['${sk}']=this.value;render()">
      <option value="all" ${ff==="all"?"selected":""}>All (${tot})</option>
      <option value="A" ${ff==="A"?"selected":""}>Cat A (${s.chapters.filter(c=>c.category==='A').length})</option>
      <option value="B" ${ff==="B"?"selected":""}>Cat B (${s.chapters.filter(c=>c.category==='B').length})</option>
      <option value="C" ${ff==="C"?"selected":""}>Cat C (${s.chapters.filter(c=>c.category==='C').length})</option>
      <option value="pending" ${ff==="pending"?"selected":""}>Pending Rev 1</option>
      <option value="done" ${ff==="done"?"selected":""}>Done Rev 1</option>
    </select>
    <div style="flex:1"></div>
    <button class="btn b-surface btn-sm" onclick="addChSub='${sk}';newChName='';render()">+ Chapter</button>
  </div>`;

  const addForm = addChSub === sk ? `<div class="card card-sm" style="margin-bottom:10px;border-color:var(--border2)">
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <input class="inp" style="flex:1;min-width:140px" placeholder="Chapter name…" value="${esc(newChName)}" oninput="newChName=this.value" onkeydown="if(event.key==='Enter')addCh('${sk}')"/>
      <select class="sel" onchange="newChCat=this.value">
        <option value="A" ${newChCat==="A"?"selected":""}>Cat A</option>
        <option value="B" ${newChCat==="B"?"selected":""}>Cat B</option>
        <option value="C" ${newChCat==="C"?"selected":""}>Cat C</option>
      </select>
      <button class="btn b-green btn-sm" onclick="addCh('${sk}')">✓ Add</button>
      <button class="b-ghost btn btn-sm" onclick="addChSub=null;newChName='';render()">✕</button>
    </div>
  </div>` : "";

  const rows = chs.map(ch => {
    const ex = expCh === ch.id;
    const rev0done = ch.revisions[0].done;
    const rc = riskBarColor(ch.riskScore);
    const mDoneC = mocks[ch.id]?.done;

    const revBtns = [0,1,2,3].map(i => {
      const rd = ch.revisions[i].done;
      const c2 = revCols[i];
      return `<div class="rev-btn" style="border-color:${rd?c2:"var(--border2)"};background:${rd?c2+"20":"transparent"};color:${rd?c2:"var(--text3)"}"
        onclick="event.stopPropagation();toggleRev('${sk}','${ch.id}',${i})">R${i+1}</div>`;
    }).join("");

    const expanded = ex ? `<div style="padding:16px;border-top:1px solid var(--border);display:flex;gap:14px;flex-wrap:wrap">
      <div>
        <div style="font-size:9px;color:var(--text3);letter-spacing:2px;font-weight:700;text-transform:uppercase;margin-bottom:6px">Risk Breakdown</div>
        <div class="mono" style="font-size:32px;font-weight:700;color:${rc}">${ch.riskScore}</div>
        <div style="font-size:10px;color:var(--text3)">Priority: ${ch.priorityIndex}</div>
        <div style="font-size:10px;color:var(--text3)">Days since: ${ch.daysSinceTouch < 999 ? ch.daysSinceTouch+"d" : "Never"}</div>
        <div style="font-size:10px;color:var(--text3)">Retention: ${ch.revisions[0].done ? calcRetentionScore(ch.revisions[0])+"%" : "—"}</div>
      </div>
      <div>
        <div style="font-size:9px;color:var(--text3);letter-spacing:2px;font-weight:700;text-transform:uppercase;margin-bottom:6px">Category</div>
        <div style="display:flex;gap:5px">${["A","B","C"].map(cat => {
          const cc = {A:"#dc2626",B:"#d97706",C:"var(--text3)"}[cat];
          return `<button class="btn btn-sm" style="background:${ch.category===cat?cc+"22":"transparent"};border:1px solid ${cc};color:${cc};border-radius:5px" onclick="changeCat('${sk}','${ch.id}','${cat}')">${cat}</button>`;
        }).join("")}</div>
        <div style="margin-top:10px">
          <div style="font-size:9px;color:var(--text3);letter-spacing:2px;font-weight:700;text-transform:uppercase;margin-bottom:6px">Confidence</div>
          <input type="range" min="0" max="100" value="${ch.confidenceScore||50}"
            style="width:120px;accent-color:#2563eb"
            oninput="setConfidence('${sk}','${ch.id}',parseInt(this.value))"/>
          <span class="mono" style="font-size:11px;color:#2563eb;margin-left:6px">${ch.confidenceScore||50}%</span>
        </div>
        <div style="margin-top:10px">
          <div style="font-size:9px;color:var(--text3);letter-spacing:2px;font-weight:700;text-transform:uppercase;margin-bottom:6px">Mock Score</div>
          <input type="number" min="0" max="100" value="${ch.mockAverage||""}" placeholder="0-100"
            style="width:70px;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;padding:4px 7px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px"
            oninput="setMockScore('${sk}','${ch.id}',parseInt(this.value)||null)"/>
        </div>
      </div>
      <div style="flex:1;min-width:140px">
        <div style="font-size:9px;color:var(--text3);letter-spacing:2px;font-weight:700;text-transform:uppercase;margin-bottom:6px">Notes</div>
        ${editNotes === ch.id
          ? `<div style="display:flex;gap:7px"><textarea class="inp" style="flex:1;min-height:60px;resize:vertical;font-size:12px" id="na_${ch.id}">${esc(ch.notes||"")}</textarea>
              <div style="display:flex;flex-direction:column;gap:5px">
                <button class="btn b-green btn-sm" onclick="saveNotes('${sk}','${ch.id}')">Save</button>
                <button class="b-ghost btn btn-sm" onclick="editNotes=null;render()">✕</button>
              </div></div>`
          : `<div style="display:flex;gap:8px;align-items:flex-start">
              <div style="flex:1;font-size:12px;color:${ch.notes?"var(--text2)":"var(--text3)"};font-style:${ch.notes?"normal":"italic"};min-height:24px">${esc(ch.notes||"No notes…")}</div>
              <button class="b-ghost btn btn-sm" onclick="editNotes='${ch.id}';render()">Edit</button>
            </div>`
        }
      </div>
      <div style="display:flex;align-items:flex-end;gap:8px;margin-left:auto">
        <div class="chkbox ${mDoneC?"done":""}" onclick="toggleChMock('${ch.id}')" title="Toggle mock test">${mDoneC?chkSvg():""}</div>
        <span style="font-size:11px;color:${mDoneC?"#16a34a":"var(--text3)"}">Tested</span>
        <button class="btn btn-sm" style="background:transparent;color:#dc2626;border:1px solid rgba(255,61,61,0.2);margin-left:12px" onclick="delCh('${sk}','${ch.id}')">Delete</button>
      </div>
    </div>` : "";

    return `<div class="ch-row ${ex?"expanded":riskClass(ch.riskScore)}" style="margin-bottom:5px">
      <div class="ch-h" onclick="toggleExpand('${ch.id}')">
        <div class="risk-bar" style="background:${rc};opacity:${Math.max(0.3, ch.riskScore/100)}"></div>
        <span class="mono" style="font-size:9px;min-width:22px;color:${rc};flex-shrink:0">${ch.riskScore}</span>
        <span style="flex:1;font-size:${settings.compact?11:12.5}px;font-weight:${rev0done?400:500};color:${rev0done?"var(--text3)":"var(--text)"};text-decoration:${rev0done?"line-through":"none"};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ch.name)}</span>
        ${mDoneC?`<span style="font-size:9px;color:#16a34a;background:rgba(22,163,74,0.10);padding:1px 6px;border-radius:3px;flex-shrink:0">🧪</span>`:""}
        <div style="display:flex;gap:3px;flex-shrink:0" onclick="event.stopPropagation()">${revBtns}</div>
        <span class="bdg ${ch.category==='A'?'bdg-a':ch.category==='B'?'bdg-b':'bdg-c'}" style="flex-shrink:0">${ch.category}</span>
        <span style="color:var(--text3);font-size:10px;flex-shrink:0">${ex?"▲":"▼"}</span>
      </div>
      ${expanded}
    </div>`;
  }).join("");

  return header + controls + addForm + rows +
    (!chs.length ? `<div style="text-align:center;padding:40px;color:var(--text3)">No chapters match this filter</div>` : "");
}

// ══════════════════════════════════════════════════════
// VISION BOARD
// ══════════════════════════════════════════════════════
function renderVision() {
  const M = computeMetrics();
  const subColors = { FR:"#7c83ff",AFM:"#ffb324",DT:"#ff5252",IDT:"#b388ff",Audit:"#00e676" };
  const subBg = { FR:"rgba(124,131,255,0.06)",AFM:"rgba(255,179,36,0.06)",DT:"rgba(255,82,82,0.06)",IDT:"rgba(179,136,255,0.06)",Audit:"rgba(0,230,118,0.06)" };

  // FIX 3: Target grid — mobile: 2-col (was repeat(5,1fr) which is ~90px each)
  const targetGridCols = mob()
    ? "grid-template-columns:1fr 1fr;gap:8px"
    : "grid-template-columns:repeat(5,1fr);gap:10px";

  const targetGrid = `<div class="card fu" style="margin-bottom:14px">
    <div class="panel-label">🎯 Target Marks per Subject</div>
    <div style="display:grid;${targetGridCols}">
      ${order.map(sk => {
        const col = D[sk]?.color || "#fff";
        const sm = M.subMetrics[sk];
        const val = visionBoard.targets?.[sk] || "";
        const tgtN = parseInt(val) || 0;
        const onTrack = tgtN > 0 && sm.r1p >= tgtN * 0.7;
        return `<div style="background:${subBg[sk]||"var(--surface2)"};border:1px solid ${col}22;border-radius:8px;padding:14px 10px;text-align:center">
          <div class="mono" style="font-size:9px;color:${col};letter-spacing:1.5px;margin-bottom:8px">${D[sk]?.short}</div>
          <input type="number" min="0" max="100" placeholder="—"
            style="width:60px;border:1px solid ${val?col+"66":"var(--border2)"};border-radius:6px;padding:5px;color:${col};font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;text-align:center;background:transparent;outline:none"
            value="${esc(val)}"
            oninput="visionBoard.targets['${sk}']=this.value;saveVB();"/>
          <div style="font-size:9px;color:var(--text3);margin-top:4px">/100</div>
          <div class="bar-wrap" style="margin-top:8px"><div class="bar-fill" style="width:${sm.r1p}%;background:${col}"></div></div>
          <div style="font-size:9px;color:var(--text3);margin-top:3px">Rev1: ${sm.r1p}%</div>
          ${tgtN ? `<div style="font-size:9px;font-weight:700;margin-top:4px;color:${onTrack?"#16a34a":"#dc2626"}">${onTrack?"✅ On track":"⚠ Gap"}</div>` : ""}
        </div>`;
      }).join("")}
    </div>
  </div>`;

  const mantra = `<div class="card fu" style="margin-bottom:14px;border-left:3px solid #7c3aed">
    <div class="panel-label">✦ Daily Mantra</div>
    <div contenteditable="true" id="vb-mantra"
      style="font-size:18px;font-style:italic;color:var(--text);line-height:1.7;outline:none;min-height:28px"
      oninput="visionBoard.mantra=this.innerText;saveVB()">${esc(visionBoard.mantra)}</div>
    <div style="font-size:10px;color:var(--text3);margin-top:8px">Click to edit</div>
  </div>`;

  const lacking = [], strong = [];
  order.forEach(sk => {
    const sm = M.subMetrics[sk];
    if (sm.r1p < 40 || sm.catA2P < 50) lacking.push({ sk, ...sm });
    else if (sm.r1p >= 70 && sm.catA2P >= 70) strong.push({ sk, ...sm });
  });

  // FIX 4: Coach grid — mobile: single col, desktop: 1fr 1fr
  const coachGridCols = mob()
    ? "grid-template-columns:1fr"
    : "grid-template-columns:1fr 1fr;gap:14px";

  const coach = `<div class="card fu" style="margin-bottom:14px;border-left:3px solid #2563eb">
    <div class="panel-label">🤖 AI Coach Analysis</div>
    <div style="display:grid;${coachGridCols}">
      <div>
        <div style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:14px;padding:12px;background:var(--surface2);border-radius:7px;border-left:3px solid #2563eb">
          ${lacking.length === 0
            ? `🌟 All subjects on track! Focus on Rev 2 and mock tests now.`
            : M.dl <= 14
              ? `⚡ FINAL STRETCH. ${M.dl} days. STOP new chapters. Only revise Cat A + mock test. Every minute counts.`
              : M.dl <= 30
                ? `🔥 ${M.dl} days. Shift to revision-only mode. ${lacking[0] ? D[lacking[0].sk]?.short + " is most at risk." : ""} Push Cat A hard.`
                : `📊 Velocity: ${M.velocity} chapters/day. ${M.daysToFinish ? `Est. ${M.daysToFinish} days to finish Rev 1.` : ""} ${lacking.length} subject${lacking.length>1?"s":""} need attention.`
          }
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:${mob()?"6px":"8px"}">
          ${[
            {v:M.sessHrs+"h",l:"Total Hours"},
            {v:M.velocity+"/d",l:"Velocity"},
            {v:M.streak+"d",l:"Streak"},
          ].map(({v,l}) => `<div class="score-card"><div class="mono" style="font-size:${mob()?"15px":"18px"};font-weight:700;color:var(--text)">${v}</div><div style="font-size:9px;color:var(--text3);margin-top:2px">${l}</div></div>`).join("")}
        </div>
      </div>
      <div style="margin-top:${mob()?"14px":"0"}">
        <div style="font-size:10px;color:var(--text3);margin-bottom:8px;letter-spacing:1.5px;text-transform:uppercase">Subject Progress</div>
        ${order.map(sk => {
          const col = D[sk]?.color; const sm = M.subMetrics[sk];
          return `<div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
              <span class="mono" style="font-size:10px;color:${col}">${D[sk]?.short}</span>
              <span class="mono" style="font-size:10px;color:var(--text3)">R1:${sm.r1p}% R2:${sm.r2p}%</span>
            </div>
            <div class="bar-wrap bar-thick"><div class="bar-fill" style="width:${sm.r1p}%;background:${col}"></div></div>
          </div>`;
        }).join("")}
        ${lacking.length ? `<div style="margin-top:10px;padding:10px;background:rgba(220,38,38,0.10);border-radius:6px;border:1px solid rgba(255,61,61,0.2)">
          <div style="font-size:9px;color:#dc2626;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px">⚠ Risk Zones</div>
          ${lacking.map(l => `<div style="font-size:11px;color:var(--text2);margin-bottom:2px">• ${D[l.sk]?.short}: Rev1 ${l.r1p}%, CatA ${l.catA2P}%</div>`).join("")}
        </div>` : ""}
      </div>
    </div>
  </div>`;

  return `<div style="font-family:'Sora',sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-bottom:18px;color:var(--text)">🌟 Vision Board & AI Coach</div>
  ${targetGrid}${coach}${mantra}`;
}

// ══════════════════════════════════════════════════════
// SUBJECTS HUB
// ══════════════════════════════════════════════════════
function renderSubjectsHub() {
  const M = computeMetrics();

  if (activeSubjectHub && D[activeSubjectHub]) {
    const s = D[activeSubjectHub];
    const sm = M.subMetrics[activeSubjectHub];
    return `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button onclick="activeSubjectHub=null;render()" style="background:var(--surface2);border:1.5px solid var(--border2);border-radius:10px;padding:7px 14px;font-size:13px;font-weight:700;color:var(--text2);cursor:pointer">← All Subjects</button>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${s.color}"></div>
        <span style="font-size:18px;font-weight:800;color:${s.color}">${s.short}</span>
        <span style="font-size:14px;color:var(--text2)">— ${s.name}</span>
      </div>
      <span style="margin-left:auto;font-size:12px;color:var(--text3)">${sm.r1}/${sm.total} Rev 1 · ${sm.r1p}%</span>
    </div>
    ${renderSub(activeSubjectHub)}`;
  }

  const readiness = (() => {
    const r1w = M.rev1Pct * 0.5;
    const caw = M.catAPct * 0.3;
    const riskw = Math.max(0, (100 - M.avgRisk)) * 0.2;
    return Math.min(100, Math.round(r1w + caw + riskw));
  })();
  const rCol = readiness >= 70 ? "#16a34a" : readiness >= 45 ? "#d97706" : "#dc2626";
  const rMsg = readiness >= 70 ? "Strong — keep the pace 💪" : readiness >= 45 ? "Building momentum ⚡" : "More revision needed 📖";

  return `
  <div style="font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-bottom:6px;color:var(--text)">📚 Subjects</div>

  <div class="card fu" style="margin-bottom:20px;background:linear-gradient(135deg,${rCol}0d,var(--surface));border-color:${rCol}33">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
      <div>
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${rCol};margin-bottom:4px">⚡ Attempt Readiness</div>
        <div style="display:flex;align-items:baseline;gap:8px">
          <span style="font-family:'JetBrains Mono',monospace;font-size:48px;font-weight:900;color:${rCol};line-height:1">${readiness}%</span>
          <span style="font-size:13px;color:var(--text3)">ready for attempt</span>
        </div>
        <div style="font-size:12px;color:${rCol};margin-top:4px;font-weight:600">${rMsg}</div>
      </div>
      <div style="flex:1;min-width:180px;max-width:320px">
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[
            { lbl:"Rev 1 Completion", pct: M.rev1Pct, col:"#2563eb" },
            { lbl:"Cat A Coverage",   pct: M.catAPct, col:"#7c3aed" },
            { lbl:"Risk Control",     pct: Math.max(0,100-M.avgRisk), col:"#16a34a" },
          ].map(({lbl,pct,col})=>`
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:11px;color:var(--text2)">${lbl}</span>
                <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${col};font-weight:700">${pct}%</span>
              </div>
              <div style="width:100%;height:5px;background:var(--border);border-radius:99px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:${col};border-radius:99px;transition:width .6s"></div>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </div>
  </div>

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
    <div style="font-size:13px;color:var(--text3)">Select a subject to view chapters and track revision.</div>
    <button onclick="addSubModal=true;render()" style="background:var(--surface);border:1.5px solid var(--border2);border-radius:10px;padding:7px 14px;font-size:12px;font-weight:700;color:var(--text2);cursor:pointer">+ Add Subject</button>
  </div>

  <div class="sub-hub-grid">
    ${order.map((sk,i)=>{
      const s = D[sk]; const sm = M.subMetrics[sk];
      const riskHigh = sm.avgRisk >= 60;
      return `<div class="sub-hub-card fu fu${Math.min(i+1,5)}" onclick="activeSubjectHub='${sk}';render()" style="border-top:3px solid ${s.color}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div style="min-width:0;flex:1">
            <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:${s.color};text-transform:uppercase">${s.short}</div>
            <div style="font-size:13px;color:var(--text);font-weight:700;margin-top:2px;line-height:1.3">${s.name}</div>
          </div>
          ${ringW(sm.r1p, s.color, 44, 4)}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <span style="background:#dc262618;color:#dc2626;border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">A:${s.chapters.filter(c=>c.category==='A').length}</span>
          <span style="background:#d9770618;color:#d97706;border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">B:${s.chapters.filter(c=>c.category==='B').length}</span>
          <span style="background:${riskHigh?"#dc262618":"#16a34a18"};color:${riskHigh?"#dc2626":"#16a34a"};border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">Risk:${sm.avgRisk}</span>
        </div>
        <div style="width:100%;height:6px;background:var(--border);border-radius:99px;overflow:hidden">
          <div style="width:${sm.r1p}%;height:100%;background:${s.color};border-radius:99px;transition:width .6s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:5px">
          <span style="font-size:10px;color:var(--text3)">${sm.r1}/${sm.total} chapters</span>
          <span style="font-size:10px;color:${s.color};font-weight:700">${sm.r1p}% Rev1</span>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}
