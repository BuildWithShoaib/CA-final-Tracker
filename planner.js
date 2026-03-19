// planner.js — CA Final Study Tracker
// Study planner: wizard, plan CRUD, render

function renderPlanner() {
  if (pView === "active") return renderActivePlan();
  if (pView === "create") return renderWizard();
  return renderPlanList();
}

function renderPlanList() {
  const hdr = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
    <div style="font-family:'Sora',sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.3px">📅 Study Planner</div>
    <button class="btn b-blue" onclick="initWiz()">+ New Plan</button>
  </div>`;

  if (!plans.length) return hdr + `<div class="card" style="text-align:center;padding:48px;border-style:dashed">
    <div style="font-size:40px;margin-bottom:10px">📅</div>
    <div style="font-size:16px;font-weight:600;margin-bottom:6px">No plans yet</div>
    <div style="color:var(--text3);font-size:13px;margin-bottom:16px">Create a daily revision plan</div>
    <button class="btn b-blue" onclick="initWiz()">Create First Plan</button>
  </div>`;

  const cards = plans.map(plan => {
    const tot = plan.days.reduce((a,d) => a+d.chapters.length, 0);
    const dn = plan.days.reduce((a,d) => a+d.chapters.filter(x=>x.done).length, 0);
    const pct = tot ? Math.round(dn/tot*100) : 0;
    const nm = plan.subjectKeys.map(k => D[k]?.short||k).join(" + ");
    const ed = new Date(plan.startDate); ed.setDate(ed.getDate()+plan.totalDays-1);
    const now = new Date(), st = new Date(plan.startDate);
    const td = Math.max(0, Math.min(plan.totalDays-1, Math.floor((now-st)/86400000)));
    return `<div class="card" style="cursor:pointer;margin-bottom:10px" onclick="openPlan('${plan.id}',${td})">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:15px;margin-bottom:3px">${esc(nm)} — Rev ${plan.revIndex+1}</div>
          <div style="font-size:11px;color:var(--text3)">${plan.totalDays} days · ${new Date(plan.startDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} → ${ed.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
          <div class="bar-wrap" style="margin-top:10px;max-width:300px"><div class="bar-fill" style="width:${pct}%;background:#2563eb"></div></div>
          <div style="font-size:10px;color:var(--text3);margin-top:3px">${dn}/${tot} · ${pct}% done</div>
        </div>
        ${ringW(pct,"#2563eb",44,3)}
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn b-blue btn-sm" style="font-size:11px" onclick="event.stopPropagation();editPlan('${plan.id}')">✏ Edit</button>
          <button class="btn btn-sm" style="background:transparent;color:#dc2626;border:1px solid rgba(255,61,61,0.2)" onclick="event.stopPropagation();showDelPlan('${plan.id}')">Delete</button>
        </div>
      </div>
    </div>`;
  }).join("");

  return hdr + cards;
}

function renderActivePlan() {
  const plan = plans.find(p => p.id === activePlanId);
  if (!plan) { pView = "list"; return renderPlanList(); }

  const tot = plan.days.reduce((a,d) => a+d.chapters.length, 0);
  const dn  = plan.days.reduce((a,d) => a+d.chapters.filter(x=>x.done).length, 0);
  const pct = tot ? Math.round(dn/tot*100) : 0;
  const nm  = plan.subjectKeys.map(k => D[k]?.short||k).join(" + ");

  const carry = [];
  for (let d=0; d<activeDay; d++) {
    (plan.days[d]?.chapters||[]).forEach((ch,ci) => {
      if (!ch.done) carry.push({...ch,_fd:d,_di:d,_ci:ci});
    });
  }

  const day = plan.days[activeDay] || {chapters:[]};
  const dc  = day.chapters.filter(x=>x.done).length;

  const dayTabs = `<div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:5px;margin-bottom:12px;-webkit-overflow-scrolling:touch">
    ${plan.days.map((d,di) => {
      const ddc = d.chapters.filter(x=>x.done).length, ddt = d.chapters.length;
      const c2 = carryover2(plan, di).length;
      const on = activeDay===di, ok=ddt>0&&ddc===ddt&&!c2;
      return `<button class="day-tab ${on?"on":ok?"ok":""}" onclick="activeDay=${di};render()">
        <div style="font-size:10px;font-weight:700">Day ${di+1}</div>
        <div style="font-size:9px;opacity:.8;margin-top:1px">${fmtDate(plan.startDate,di)}</div>
        <div style="font-size:9px;margin-top:1px">${ok?"✓":ddc+"/"+ddt}${c2&&!on?` <span style="color:#d97706">+${c2}</span>`:""}</div>
      </button>`;
    }).join("")}
  </div>`;

  const carryRows = carry.map(ch => {
    const cd = D[ch.sub]?.chapters.find(x=>x.id===ch.id);
    const cat = cd?.category||"B";
    return `<div class="carry-row" onclick="togglePCh('${plan.id}',${ch._di},${ch._ci})">
      <span style="font-size:9px;color:#d97706;border:1px solid rgba(255,179,36,0.3);padding:1px 5px;border-radius:3px;flex-shrink:0">D${ch._fd+1}↩</span>
      <div class="chkbox ${ch.done?"done":""}">${ch.done?chkSvg():""}</div>
      <span style="flex:1;font-size:12px;color:${ch.done?"var(--text3)":"var(--text)"};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(cd?.name||ch.id)}</span>
      <span class="bdg bdg-${(cat||'b').toLowerCase()}">${cat}</span>
    </div>`;
  }).join("");

  const dayRows = plan.subjectKeys.map(sk => {
    const sub = D[sk];
    const skChs = day.chapters.map((ch,i)=>({...ch,_i:i})).filter(ch=>ch.sub===sk);
    if (!skChs.length) return "";
    return `<div class="card card-sm" style="border-left:3px solid ${sub?.color};margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">
        <span style="font-weight:600;font-size:13px">${sub?.name}</span>
        <span style="font-size:10px;color:var(--text3)">${skChs.filter(x=>x.done).length}/${skChs.length}</span>
      </div>
      ${skChs.map(ch => {
        const cd = D[sk]?.chapters.find(x=>x.id===ch.id);
        const cat = cd?.category||"B";
        return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="togglePCh('${plan.id}',${activeDay},${ch._i})">
          <div class="chkbox ${ch.done?"done":""}">${ch.done?chkSvg():""}</div>
          <span style="flex:1;font-size:12px;color:${ch.done?"var(--text3)":"var(--text)"};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(cd?.name||ch.id)}</span>
          <span class="bdg bdg-${(cat||'b').toLowerCase()}">${cat}</span>
        </div>`;
      }).join("")}
    </div>`;
  }).join("");

  // Active plan header — on mobile stack vertically
  const headerStyle = mob()
    ? "display:flex;flex-direction:column;gap:12px;margin-bottom:14px"
    : "display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px";

  return `<div style="${headerStyle}">
    <div>
      <div style="font-weight:700;font-size:18px">${esc(nm)} — Rev ${plan.revIndex+1}</div>
      <div style="font-size:11px;color:var(--text3)">${plan.totalDays} days from ${new Date(plan.startDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      ${ringW(pct,"#2563eb",44,3)}
      <button class="btn b-ghost btn-sm" onclick="pView='list';render()">← Back</button>
      <button class="btn b-blue btn-sm" onclick="editPlan('${plan.id}')">✏ Edit</button>
      <button class="btn btn-sm" style="background:transparent;color:#dc2626;border:1px solid rgba(255,61,61,0.2)" onclick="showDelPlan('${plan.id}')">Delete</button>
    </div>
  </div>
  ${dayTabs}
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
    <div style="font-weight:600">Day ${activeDay+1} — ${fmtDate(plan.startDate,activeDay)}</div>
    <div style="font-size:11px;color:var(--text3)">${dc}/${day.chapters.length} done · ${carry.length} carried over</div>
  </div>
  <div class="bar-wrap" style="margin-bottom:12px"><div class="bar-fill" style="width:${day.chapters.length?Math.round(dc/day.chapters.length*100):0}%;background:#2563eb"></div></div>
  ${carry.length ? `<div class="os-div"><div class="os-div-l"></div>↩ Carried Over<div class="os-div-l"></div></div>${carryRows}` : ""}
  ${day.chapters.length ? dayRows : `<div style="text-align:center;padding:36px;color:var(--text3)">No chapters for this day</div>`}
  <div style="display:flex;justify-content:space-between;margin-top:12px">
    <button class="btn b-ghost" ${activeDay===0?"disabled":""} onclick="activeDay--;render()">← Prev</button>
    <button class="btn b-blue" ${activeDay>=plan.days.length-1?"disabled":""} onclick="activeDay++;render()">Next →</button>
  </div>`;
}

function carryover2(plan, dayIdx) {
  if (!dayIdx) return [];
  const r = [];
  for (let d=0; d<dayIdx; d++) {
    (plan.days[d]?.chapters||[]).forEach((ch,ci) => {
      if (!ch.done) r.push({...ch,_fd:d,_di:d,_ci:ci});
    });
  }
  return r;
}

function renderWizard() {
  const dots = [1,2,3].map(n =>
    `<div class="step-dot ${wStep===n?"active":wStep>n?"done":""}">${wStep>n?"✓":n}</div>`
  ).join("");

  const hdr = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
    <button class="btn b-ghost btn-sm" onclick="pView='list';render()">← Back</button>
    <span style="font-weight:700;font-size:16px">${editingPlanId ? '✏ Edit Plan' : 'Create Study Plan'}</span>
    <div style="display:flex;gap:5px;margin-left:auto">${dots}</div>
  </div>`;

  if (wStep===1) {
    // Subject cards — on mobile allow 2 per row via flex-wrap
    const sCards = order.map(sk => {
      const s = D[sk], sel = wSubs.includes(sk), dis = wSubs.length>=2&&!sel;
      return `<div onclick="${dis?"":sel?`rmWS('${sk}')`:`addWS('${sk}')`}"
        style="padding:10px;border-radius:7px;cursor:${dis?"not-allowed":"pointer"};
               background:${sel?s.color+"15":"var(--surface2)"};
               border:1px solid ${sel?s.color:"var(--border)"};
               transition:all .15s;opacity:${dis?.4:1};
               flex:1;min-width:${mob()?"calc(50% - 8px)":"120px"};max-width:${mob()?"calc(50% - 4px)":"none"}">
        <div style="font-weight:700;color:${sel?s.color:"var(--text2)"};font-size:13px">${s.short}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px">${s.chapters.length} ch</div>
      </div>`;
    }).join("");

    const rBtns = [0,1,2,3].map(i =>
      `<button onclick="wRev=${i};render()"
        style="padding:6px 14px;border-radius:6px;border:1px solid ${wRev===i?"#2563eb":"var(--border)"};
               cursor:pointer;background:${wRev===i?"rgba(37,99,235,0.10)":"var(--surface2)"};
               color:${wRev===i?"#2563eb":"var(--text3)"};font-family:inherit;font-weight:700;font-size:12px">
        Rev ${i+1}
      </button>`
    ).join("");

    return hdr+`<div class="card">
      <div style="font-weight:600;font-size:15px;margin-bottom:12px">Step 1 — Subject & Revision</div>
      <div style="font-size:9px;color:var(--text3);letter-spacing:2px;margin-bottom:8px;text-transform:uppercase">Subjects (max 2)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">${sCards}</div>
      <div style="font-size:9px;color:var(--text3);letter-spacing:2px;margin-bottom:8px;text-transform:uppercase">Revision</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${rBtns}</div>
      <button class="btn b-blue" style="opacity:${wSubs.length?1:.5}" onclick="if(wSubs.length){wStep=2;render()}">Next →</button>
    </div>`;
  }

  if (wStep===2) {
    // Step 2: days stepper + date picker — stack on mobile
    const step2Layout = mob()
      ? "display:flex;flex-direction:column;gap:16px;margin-bottom:16px"
      : "display:flex;gap:20px;flex-wrap:wrap;margin-bottom:16px";

    return hdr+`<div class="card">
      <div style="font-weight:600;font-size:15px;margin-bottom:12px">Step 2 — Duration & Start</div>
      <div style="${step2Layout}">
        <div>
          <div style="font-size:9px;color:var(--text3);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Days</div>
          <div style="display:flex;align-items:center;gap:10px">
            <button onclick="if(wDays>1){wDays--;render()}"
              style="width:36px;height:36px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
            <div class="mono" style="font-size:32px;font-weight:700;min-width:44px;text-align:center">${wDays}</div>
            <button onclick="if(wDays<60){wDays++;render()}"
              style="width:36px;height:36px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:4px">Ends: ${fmtDate(wStart,wDays-1)}</div>
        </div>
        <div style="flex:1">
          <div style="font-size:9px;color:var(--text3);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Start Date</div>
          <input type="date" class="inp" value="${wStart}" onchange="wStart=this.value;render()"/>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn b-ghost" onclick="wStep=1;render()">← Back</button>
        <button class="btn b-blue" onclick="goStep3()">Next →</button>
      </div>
    </div>`;
  }

  // Step 3 — Assign chapters
  const allC2 = wSubs.flatMap(sk =>
    (D[sk]?.chapters||[]).map((c,i) => ({...c,_sub:sk,_done:c.revisions[wRev]?.done}))
  );
  const sorted = [...allC2].sort((a,b) => {
    const co = "ABC".indexOf(a.category)-"ABC".indexOf(b.category);
    return co||((a._done?1:0)-(b._done?1:0));
  });
  const pending = sorted.filter(c=>!c._done);
  const dCts = {};
  pending.forEach(c => { const d=wAssign[c.id]||"1"; dCts[d]=(dCts[d]||0)+1; });

  const qa = ["A","B","C"].map(cat =>
    `<label style="display:flex;align-items:center;gap:6px;font-size:12px">
       <span style="color:${{A:"#dc2626",B:"#d97706",C:"var(--text3)"}[cat]};font-weight:700">Cat ${cat}→</span>
       <select class="sel" id="qa${cat}">
         <option value="">—</option>
         ${Array.from({length:wDays},(_,i)=>`<option value="${i+1}">Day ${i+1}</option>`).join("")}
       </select>
     </label>`
  ).join("");

  // Day-count pills — scroll on mobile
  const dayPills = `<div style="display:flex;gap:4px;flex-wrap:wrap;max-height:${mob()?"72px":"none"};overflow-y:${mob()?"auto":"visible"}">
    ${Array.from({length:wDays},(_,i)=>
      `<div style="font-size:10px;padding:3px 7px;border-radius:4px;flex-shrink:0;
        background:${dCts[String(i+1)]?"rgba(37,99,235,0.10)":"var(--surface2)"};
        border:1px solid ${dCts[String(i+1)]?"rgba(77,166,255,0.3)":"var(--border)"};
        color:${dCts[String(i+1)]?"#2563eb":"var(--text3)"}">
        D${i+1}:${dCts[String(i+1)]||0}
      </div>`
    ).join("")}
  </div>`;

  const subSec = wSubs.map(sk => {
    const sub = D[sk];
    const skC = sorted.filter(c=>c._sub===sk);
    if (!skC.length) return "";
    return `<div class="card card-sm" style="margin-bottom:10px">
      <div style="font-weight:600;font-size:13px;margin-bottom:8px">${sub?.name} — ${skC.filter(c=>!c._done).length} to assign</div>
      ${skC.map(ch => {
        const catC = {A:"#dc2626",B:"#d97706",C:"var(--text3)"}[ch.category];
        const opts = Array.from({length:wDays},(_,i)=>
          `<option value="${i+1}" ${(wAssign[ch.id]||"1")===String(i+1)?"selected":""}>Day ${i+1}</option>`
        ).join("");
        return `<div style="display:flex;align-items:center;gap:7px;padding:6px 0;border-bottom:1px solid var(--border);opacity:${ch._done?.5:1}">
          <span class="bdg" style="background:${catC}18;color:${catC};border:1px solid ${catC}33;flex-shrink:0">${ch.category}</span>
          <span style="flex:1;font-size:12px;text-decoration:${ch._done?"line-through":"none"};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ch.name)}</span>
          ${ch._done
            ? `<span style="font-size:9px;color:#16a34a;flex-shrink:0">✓ Done</span>`
            : `<select class="sel" style="font-size:11px;flex-shrink:0" onchange="wAssign['${ch.id}']=this.value;render()">${opts}</select>`
          }
        </div>`;
      }).join("")}
    </div>`;
  }).join("");

  return hdr+`<div class="card card-sm" style="margin-bottom:10px">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
      <div style="font-weight:600">Step 3 — Assign Chapters</div>
    </div>
    ${dayPills}
  </div>
  <div class="card card-sm" style="margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:2px">Quick:</span>
      ${qa}
      <button class="btn b-surface btn-sm" onclick="applyQA()">Apply</button>
    </div>
  </div>
  ${subSec}
  <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
    <button class="btn b-ghost" onclick="wStep=2;render()">← Back</button>
    <button class="btn b-green" onclick="createPlan()">🚀 Create Plan</button>
  </div>`;
}
