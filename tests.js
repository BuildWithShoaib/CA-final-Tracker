// tests.js — CA Final Study Tracker
// Test series tracking

let tsFilter = "all";
let tsSortBy = "date";
let tsViewMode = "list";
let tsTargets = {};
let tsAdding = false;
let tsNextTest = { date:"", subject:"", name:"" };
let tsForm = { date: todayStr(), subject:"", type:"Mock Test", name:"", marks:"", outOf:"100", status:"Pending", notes:"" };

function tsInit() {
  const firstKey = order[0] || "FR";
  if (!tsForm.subject) tsForm.subject = firstKey;
  if (!tsNextTest.subject) tsNextTest.subject = firstKey;
  order.forEach(k => { if (tsTargets[k] === undefined) tsTargets[k] = 70; });
}
function loadTS() {
  try {
    const r = localStorage.getItem("ca-v6-ts");
    if (r) { const p = JSON.parse(r); tsTests = p.tests||[]; tsTargets = p.targets||{}; }
  } catch(x) {}
}
function saveTS() {
  try { localStorage.setItem("ca-v6-ts", JSON.stringify({ tests: tsTests, targets: tsTargets })); } catch(x) {}
}
function tsSave() {
  const nm = (tsForm.name||"").trim(); if(!nm) return;
  const mNum = parseFloat(tsForm.marks), oNum = parseFloat(tsForm.outOf);
  const sc = (tsForm.marks && tsForm.outOf && !isNaN(mNum) && !isNaN(oNum) && oNum > 0) ? Math.round((mNum/oNum)*100) : null;
  tsTests.unshift({ ...tsForm, id: Date.now().toString(), score: sc, reviewed: false });
  tsForm = { date: todayStr(), subject: order[0]||"FR", type:"Mock Test", name:"", marks:"", outOf:"100", status:"Pending", notes:"" };
  tsAdding = false;
  saveTS(); render();
}
function tsDel(id) { tsTests = tsTests.filter(t => t.id !== id); saveTS(); render(); }
function tsUpd(id, field, val) {
  tsTests = tsTests.map(t => {
    if (t.id !== id) return t;
    const u = {...t, [field]: val};
    if (field === "marks" || field === "outOf") {
      const m = parseFloat(u.marks), o = parseFloat(u.outOf);
      u.score = (u.marks && u.outOf && !isNaN(m) && !isNaN(o) && o>0) ? Math.round((m/o)*100) : null;
    }
    return u;
  });
  saveTS(); render();
}
function tsSetTarget(key, val) { tsTargets[key] = val; saveTS(); }
function scColor(v) { return v>=60?"#16a34a":v>=40?"#d97706":"#dc2626"; }
function scBg(v)    { return v>=60?"#dcfce7":v>=40?"#fef3c7":"#fee2e2"; }

function renderScoreTrendSVG(scoredTests) {
  if (scoredTests.length < 2) return `<div style="text-align:center;padding:32px 0;color:var(--text3);font-size:13px">📊 Log at least 2 scored tests to see your trend graph.</div>`;
  const sorted = [...scoredTests].sort((a,b) => (a.date||"").localeCompare(b.date||""));
  const W=560, H=180, PL=44, PR=28, PT=24, PB=44;
  const iW=W-PL-PR, iH=H-PT-PB;
  const xPos = i => sorted.length===1 ? iW/2 : (i/(sorted.length-1))*iW;
  const yPos = s => iH - (s/100)*iH;
  const pts = sorted.map((t,i) => ({ x: xPos(i), y: yPos(t.score), t }));
  const bezier = pts.map((p,i) => {
    if (i===0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i-1]; const cx = (prev.x+p.x)/2;
    return `C${cx.toFixed(1)},${prev.y.toFixed(1)} ${cx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
  const areaD = bezier + ` L${pts[pts.length-1].x.toFixed(1)},${iH} L${pts[0].x.toFixed(1)},${iH} Z`;
  const gridLines = [0,20,40,60,80,100];
  const gridSvg = gridLines.map(v => {
    const gy = yPos(v); const isPass = v===60;
    return `<line x1="0" y1="${gy.toFixed(1)}" x2="${iW}" y2="${gy.toFixed(1)}" stroke="${isPass?"#16a34a":"#e2e8f0"}" stroke-width="${isPass?1.5:1}" stroke-dasharray="${isPass?"6,3":"4,4"}" opacity="${isPass?0.9:0.7}"/>
      <text x="-8" y="${(gy+4).toFixed(1)}" text-anchor="end" font-size="9" fill="${isPass?"#16a34a":"#94a3b8"}" font-weight="${isPass?700:400}">${v}%</text>`;
  }).join("");
  const passLabelY = yPos(60);
  const xLabels = pts.map((p,i) => {
    const d = new Date((p.t.date||"")+"T00:00:00"); const lbl = isNaN(d)?"":`${d.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]}`;
    return `<text x="${p.x.toFixed(1)}" y="${(iH+16).toFixed(1)}" text-anchor="middle" font-size="9" fill="#94a3b8">${lbl}</text>`;
  }).join("");
  const dots = pts.map((p,i) => {
    const sub = D[p.t.subject]; const color = sub?.color || "#6366f1";
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5.5" fill="${color}" stroke="#fff" stroke-width="2"/>
      <text x="${p.x.toFixed(1)}" y="${(p.y-10).toFixed(1)}" text-anchor="middle" font-size="9" fill="${color}" font-weight="800">${p.t.score}%</text>`;
  }).join("");
  return `<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:320px;display:block;overflow:visible" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <g transform="translate(${PL},${PT})">
        ${gridSvg}
        <text x="${iW+6}" y="${(passLabelY+4).toFixed(1)}" font-size="9" fill="#16a34a" font-weight="700" opacity="0.85">PASS</text>
        <path d="${areaD}" fill="url(#trendGrad)"/>
        <path d="${bezier}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${xLabels}
        ${dots}
      </g>
    </svg>
  </div>`;
}

function renderTestCard(t) {
  const sub = D[t.subject]; const subCol = sub?.color||"#6366f1"; const subName = sub?.short||t.subject;
  const today = todayStr();
  const isReviewPending = t.status==="Attempted" && t.date && ((new Date(today)-new Date(t.date))/86400000)>=3;
  const stColors = {
    Reviewed: {bg:"#dcfce7",color:"#16a34a",border:"#86efac"},
    Attempted: {bg:"#fef3c7",color:"#d97706",border:"#fcd34d"},
    Pending: {bg:"var(--surface2)",color:"var(--text3)",border:"var(--border2)"}
  };
  const st = stColors[t.status] || stColors.Pending;
  const scoreBadge = t.score !== null ? `
    <div style="background:${scBg(t.score)};border:2px solid ${scColor(t.score)}44;border-radius:12px;padding:10px 14px;text-align:center;min-width:74px;flex-shrink:0">
      <div style="color:${scColor(t.score)};font-size:26px;font-weight:900;line-height:1;font-family:'JetBrains Mono',monospace">${t.score}%</div>
      <div style="color:var(--text3);font-size:10px;margin-top:2px">${t.marks}/${t.outOf}</div>
      <div style="color:${scColor(t.score)};font-size:9px;font-weight:800;margin-top:3px;text-transform:uppercase">${t.score>=60?"PASS ✓":"NEEDS WORK"}</div>
    </div>` : `
    <div style="background:var(--surface2);border:2px solid var(--border);border-radius:12px;padding:10px 14px;text-align:center;min-width:74px;flex-shrink:0">
      <div style="color:var(--text3);font-size:20px;line-height:1">—</div>
      <div style="color:var(--text3);font-size:9px;font-weight:700;margin-top:4px">PENDING</div>
    </div>`;
  const progressBar = t.score !== null ? `
    <div style="margin-bottom:8px">
      <div style="width:100%;height:6px;background:var(--border);border-radius:99px;overflow:hidden">
        <div style="width:${t.score}%;height:100%;background:${scColor(t.score)};border-radius:99px;transition:width .5s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:3px">
        <span style="font-size:9px;color:var(--text3)">0%</span>
        <span style="font-size:9px;color:#16a34a;font-weight:700">60% pass mark</span>
        <span style="font-size:9px;color:var(--text3)">100%</span>
      </div>
    </div>` : "";
  const inlineScore = t.score === null ? `
    <div style="display:flex;gap:5px;margin-top:5px">
      <input type="number" placeholder="Score" value="${esc(t.marks||"")}" oninput="tsUpd('${t.id}','marks',this.value)" style="width:64px;background:var(--surface);border:1px solid var(--border2);border-radius:7px;padding:4px 8px;font-size:12px;color:var(--text)"/>
      <span style="color:var(--text3);font-size:12px;align-self:center">/ ${t.outOf}</span>
    </div>` : "";
  return `<div style="background:var(--surface);border:1.5px solid ${t.score!==null?scColor(t.score)+"44":"var(--border)"};border-radius:14px;padding:18px 20px;box-shadow:var(--shadow);margin-bottom:10px">
    <div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">
      ${scoreBadge}
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
          <span style="background:${subCol}18;color:${subCol};border:1px solid ${subCol}33;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">${subName}</span>
          <span style="background:var(--surface2);color:var(--text2);border-radius:20px;padding:2px 9px;font-size:11px">${t.type}</span>
          <span style="color:var(--text3);font-size:12px">${t.date||""}</span>
          ${isReviewPending?`<span style="background:#fef3c7;color:#b45309;border:1px solid #fcd34d;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;animation:pulseOpacity 2s ease-in-out infinite">⚠ Review Pending</span>`:""}
        </div>
        <div style="color:var(--text);font-size:15px;font-weight:700;margin-bottom:8px">${esc(t.name)}</div>
        ${progressBar}
        ${t.notes?`<div style="color:var(--text2);font-size:12px">💡 ${esc(t.notes)}</div>`:""}
        ${inlineScore}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;flex-shrink:0">
        <select onchange="tsUpd('${t.id}','status',this.value)" style="background:${st.bg};border:1px solid ${st.border};color:${st.color};border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;font-weight:600;outline:none">
          ${["Pending","Attempted","Reviewed"].map(r=>`<option value="${r}" ${t.status===r?"selected":""}>${r}</option>`).join("")}
        </select>
        <button onclick="tsDel('${t.id}')" style="background:var(--surface2);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer">✕ Delete</button>
      </div>
    </div>
  </div>`;
}

function renderMocks() {
  tsInit();
  const TEST_TYPES = ["Mock Test","Chapter Test","Previous Year Q","Practice Set","Full Syllabus"];
  const today = todayStr();

  const scored = tsTests.filter(t => t.score !== null);
  const avg = scored.length ? Math.round(scored.reduce((s,t)=>s+t.score,0)/scored.length) : null;
  const best = scored.length ? Math.max(...scored.map(t=>t.score)) : null;
  const passCount = scored.filter(t=>t.score>=60).length;
  const passRate = scored.length ? Math.round((passCount/scored.length)*100) : null;
  const trend3 = scored.slice(-3);
  const trending = trend3.length>=2 ? trend3[trend3.length-1].score - trend3[0].score : null;
  const reviewPending = tsTests.filter(t=>t.status==="Attempted"&&t.date&&((new Date(today)-new Date(t.date))/86400000)>=3);

  const filtered = tsTests.filter(t => {
    if (tsFilter==="all") return true;
    return t.subject===tsFilter || t.type===tsFilter || t.status===tsFilter;
  }).sort((a,b) => tsSortBy==="date" ? (b.date||"").localeCompare(a.date||"") : (b.score||0)-(a.score||0));

  const alertHtml = reviewPending.length > 0 ? `
    <div style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap" class="fu">
      <span style="font-size:20px">⚠️</span>
      <div style="flex:1;min-width:0">
        <div style="color:#92400e;font-weight:700;font-size:13px">Review Pending — ${reviewPending.length} test${reviewPending.length>1?"s":""} awaiting review</div>
        <div style="color:#b45309;font-size:12px;margin-top:2px">${reviewPending.map(t=>esc(t.name)).join(", ")}</div>
      </div>
      <button onclick="tsFilter='Attempted';render()" style="background:#d97706;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer">View Now</button>
    </div>` : "";

  // FIX 6: Stat cards grid — mobile: 2-col, desktop: auto-fit minmax(130px)
  const statGridStyle = mob()
    ? "display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px"
    : "display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px";

  const statHtml = `
    <div style="${statGridStyle}">
      ${[
        {lbl:"Tests Logged", v:tsTests.length, col:"var(--text)", sub:""},
        {lbl:"Avg Score",    v:avg!==null?avg+"%":"—", col:avg!==null?scColor(avg):"var(--text3)", sub:avg!==null?(avg>=60?"Pass level ✓":"Below pass"):""},
        {lbl:"Best Score",  v:best!==null?best+"%":"—", col:"#7c3aed", sub:""},
        {lbl:"Pass Rate",   v:passRate!==null?passRate+"%":"—", col:passRate!==null?scColor(passRate):"var(--text3)", sub:passRate!==null?passCount+"/"+scored.length+" tests":""},
        {lbl:"Trend (last 3)", v:trending!==null?(trending>0?"+":"")+trending+"%":"—", col:trending>0?"#16a34a":trending<0?"#dc2626":"var(--text3)", sub:trending>0?"Improving 📈":trending<0?"Dropping 📉":"Stable"},
      ].map(({lbl,v,col,sub}) => `
        <div class="score-card fu">
          <div class="mono" style="font-size:24px;font-weight:800;color:${col}">${v}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:4px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">${lbl}</div>
          ${sub?`<div style="font-size:11px;color:${col};margin-top:3px;font-weight:600">${sub}</div>`:""}
        </div>`).join("")}
    </div>`;

  const subPerfHtml = `
    <div class="card fu" style="margin-bottom:20px">
      <div style="color:var(--text);font-weight:800;font-size:15px;margin-bottom:4px">📊 Subject-wise Performance</div>
      <div style="color:var(--text3);font-size:12px;margin-bottom:20px">Average score vs your target per subject</div>
      <div style="display:flex;flex-direction:column;gap:22px">
        ${order.map(sk => {
          const s = D[sk]; if(!s) return "";
          const sTests = scored.filter(t=>t.subject===sk);
          const sAvg = sTests.length ? Math.round(sTests.reduce((a,t)=>a+t.score,0)/sTests.length) : null;
          const tgt = tsTargets[sk] !== undefined ? tsTargets[sk] : 70;
          const gap = sAvg !== null ? sAvg - tgt : null;
          return `<div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="background:${s.color}18;border-radius:9px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:${s.color}">${s.short.charAt(0)}</div>
                <div>
                  <span style="color:var(--text);font-weight:700;font-size:14px">${s.short}</span>
                  <span style="color:var(--text3);font-size:11px;margin-left:6px">${sTests.length} test${sTests.length!==1?"s":""}</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                ${sAvg!==null?`<span style="background:${scColor(sAvg)}18;color:${scColor(sAvg)};border-radius:20px;padding:4px 12px;font-size:14px;font-weight:800">${sAvg}%</span>`:""}
                ${gap!==null?`<span style="background:${gap>=0?"#dcfce7":"#fee2e2"};color:${gap>=0?"#16a34a":"#dc2626"};border-radius:20px;padding:4px 10px;font-size:12px;font-weight:700">${gap>=0?"+"+gap:gap} vs target</span>`:""}
                <div style="display:flex;align-items:center;gap:4px;background:var(--surface2);border-radius:8px;padding:5px 10px">
                  <span style="color:var(--text3);font-size:11px;font-weight:600">🎯 Target:</span>
                  <input type="number" min="0" max="100" value="${tgt}" oninput="tsSetTarget('${sk}',parseInt(this.value)||0)" style="width:40px;background:transparent;border:none;font-size:13px;color:var(--text);font-weight:700;text-align:center;outline:none"/>
                  <span style="color:var(--text3);font-size:11px;font-weight:600">%</span>
                </div>
              </div>
            </div>
            <div style="position:relative;padding-bottom:24px">
              <div style="width:100%;height:12px;background:var(--border);border-radius:99px;overflow:hidden">
                ${sAvg!==null?`<div style="width:${Math.min(sAvg,100)}%;height:100%;background:${s.color};border-radius:99px;transition:width .6s ease"></div>`:""}
              </div>
              <div style="position:absolute;top:-4px;left:${Math.min(tgt,100)}%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;pointer-events:none">
                <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #0f172a"></div>
                <div style="width:2px;height:20px;background:#0f172a;opacity:0.7;border-radius:1px;margin-top:-1px"></div>
                <div style="margin-top:3px;background:#0f172a;color:#fff;font-size:10px;font-weight:700;border-radius:6px;padding:2px 7px;white-space:nowrap">🎯 ${tgt}%</div>
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;

  const trendHtml = `
    <div class="card fu" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:8px">
        <div style="color:var(--text);font-weight:800;font-size:15px">📈 Score Trend</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${order.map(k=>`<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text3)"><span style="width:10px;height:10px;border-radius:50%;background:${D[k]?.color};display:inline-block"></span>${D[k]?.short}</span>`).join("")}
        </div>
      </div>
      <div style="color:var(--text3);font-size:12px;margin-bottom:16px">Score trajectory across all tests · green dashed = 60% pass mark</div>
      ${renderScoreTrendSVG(scored)}
    </div>`;

  const nextSubOpts = order.map(k=>`<option value="${k}" ${tsNextTest.subject===k?"selected":""}>${D[k]?.short||k}</option>`).join("");
  const planHtml = `
    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:14px;padding:16px 20px;margin-bottom:20px;box-shadow:var(--shadow)" class="fu">
      <div style="color:#15803d;font-weight:800;font-size:13px;margin-bottom:12px">📅 Plan Next Test</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input type="text" value="${esc(tsNextTest.name)}" oninput="tsNextTest.name=this.value" placeholder="Test name e.g. AFM Mock 2" style="flex:2;min-width:140px;background:#fff;border:1.5px solid #86efac;border-radius:9px;padding:8px 12px;font-size:13px;color:var(--text);outline:none"/>
        <select onchange="tsNextTest.subject=this.value" style="flex:1;min-width:100px;background:#fff;border:1.5px solid #86efac;border-radius:9px;padding:8px 10px;font-size:13px;color:var(--text);outline:none">${nextSubOpts}</select>
        <input type="date" value="${esc(tsNextTest.date)}" oninput="tsNextTest.date=this.value" style="flex:1;min-width:130px;background:#fff;border:1.5px solid #86efac;border-radius:9px;padding:8px 10px;font-size:13px;color:var(--text);outline:none"/>
        <button onclick="if(tsNextTest.name&&tsNextTest.date){tsForm.name=tsNextTest.name;tsForm.subject=tsNextTest.subject||order[0];tsForm.date=tsNextTest.date;tsNextTest={date:'',subject:order[0]||'',name:''};tsAdding=true;render()}" style="background:#16a34a;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">Schedule →</button>
      </div>
    </div>`;

  const filterOpts = [
    {v:"all",l:"All"},
    ...order.map(k=>({v:k,l:D[k]?.short||k})),
    ...["Pending","Attempted","Reviewed"].map(r=>({v:r,l:r}))
  ];
  const controlsHtml = `
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px">
      <div style="display:flex;gap:6px;flex:1;flex-wrap:wrap">
        ${filterOpts.map(({v,l})=>`<button onclick="tsFilter='${v}';render()" style="background:${tsFilter===v?"#0f172a":"var(--surface)"};color:${tsFilter===v?"#fff":"var(--text2)"};border:1px solid ${tsFilter===v?"#0f172a":"var(--border2)"};border-radius:20px;padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer">${l}</button>`).join("")}
      </div>
      <div style="display:flex;gap:5px;background:var(--surface2);border-radius:10px;padding:4px">
        ${[{v:"list",l:"☰ List"},{v:"grouped",l:"⊞ By Subject"}].map(({v,l})=>`<button onclick="tsViewMode='${v}';render()" style="background:${tsViewMode===v?"var(--surface)":"transparent"};border:none;border-radius:7px;padding:5px 12px;font-size:12px;font-weight:${tsViewMode===v?700:500};color:${tsViewMode===v?"var(--text)":"var(--text3)"};cursor:pointer;box-shadow:${tsViewMode===v?"var(--shadow)":"none"}">${l}</button>`).join("")}
      </div>
      <select onchange="tsSortBy=this.value;render()" style="background:var(--surface);border:1px solid var(--border2);border-radius:9px;padding:6px 10px;font-size:12px;color:var(--text2);outline:none">
        <option value="date" ${tsSortBy==="date"?"selected":""}>Sort: Latest</option>
        <option value="score" ${tsSortBy==="score"?"selected":""}>Sort: Best Score</option>
      </select>
      <button onclick="tsAdding=!tsAdding;render()" style="background:#0f172a;color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer">${tsAdding?"✕ Cancel":"+ Log Test"}</button>
    </div>`;

  const subOpts = order.map(k=>`<option value="${k}" ${tsForm.subject===k?"selected":""}>${D[k]?.name||k}</option>`).join("");
  const typeOpts = TEST_TYPES.map(t=>`<option value="${t}" ${tsForm.type===t?"selected":""}>${t}</option>`).join("");
  const addFormHtml = tsAdding ? `
    <div class="card" style="margin-bottom:20px;box-shadow:var(--shadow-md);border-color:var(--border2)">
      <div style="color:var(--text);font-weight:800;font-size:15px;margin-bottom:18px">📝 Log New Test</div>
      <div style="display:grid;grid-template-columns:${mob()?"1fr 1fr":"repeat(auto-fit,minmax(150px,1fr))"};gap:${mob()?"10px":"12px"};margin-bottom:12px">
        <div><label style="display:block;color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;font-weight:700">Test Name</label><input type="text" value="${esc(tsForm.name)}" oninput="tsForm.name=this.value" placeholder="e.g. AFM Mock 2" class="inp"/></div>
        <div><label style="display:block;color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;font-weight:700">Date</label><input type="date" value="${esc(tsForm.date)}" oninput="tsForm.date=this.value" class="inp"/></div>
        <div><label style="display:block;color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;font-weight:700">Subject</label><select onchange="tsForm.subject=this.value" class="inp" style="cursor:pointer">${subOpts}</select></div>
        <div><label style="display:block;color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;font-weight:700">Type</label><select onchange="tsForm.type=this.value" class="inp" style="cursor:pointer">${typeOpts}</select></div>
        <div><label style="display:block;color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;font-weight:700">Marks Scored</label><input type="number" value="${esc(tsForm.marks)}" oninput="tsForm.marks=this.value" placeholder="e.g. 68" class="inp"/></div>
        <div><label style="display:block;color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;font-weight:700">Out Of</label><input type="number" value="${esc(tsForm.outOf)}" oninput="tsForm.outOf=this.value" placeholder="100" class="inp"/></div>
      </div>
      <div style="margin-bottom:16px"><label style="display:block;color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;font-weight:700">Key Takeaway / Notes</label><input type="text" value="${esc(tsForm.notes)}" oninput="tsForm.notes=this.value" placeholder="e.g. Revise derivatives chapter" class="inp"/></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button onclick="tsSave()" style="background:#0f172a;color:#fff;border:none;border-radius:9px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer">Save Test</button>
        <button onclick="tsAdding=false;render()" style="background:var(--surface2);color:var(--text2);border:1px solid var(--border2);border-radius:9px;padding:10px 18px;font-size:13px;cursor:pointer">Cancel</button>
      </div>
    </div>` : "";

  let listHtml = "";
  if (filtered.length === 0) {
    listHtml = `<div class="card" style="text-align:center;padding:48px">
      <div style="font-size:44px;margin-bottom:12px">📊</div>
      <div style="color:var(--text3);font-size:15px">No tests match this filter.<br><span style="font-size:13px">Try "All" or log your first test!</span></div>
    </div>`;
  } else if (tsViewMode === "list") {
    listHtml = filtered.map(t => renderTestCard(t)).join("");
  } else {
    listHtml = order.map(sk => {
      const grp = filtered.filter(t => t.subject === sk);
      if (!grp.length) return "";
      const s = D[sk]; if(!s) return "";
      const grpScored = grp.filter(t=>t.score!==null);
      const grpAvg = grpScored.length ? Math.round(grpScored.reduce((a,t)=>a+t.score,0)/grpScored.length) : null;
      return `<div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 16px;background:${s.color}14;border:1.5px solid ${s.color}33;border-radius:12px;flex-wrap:wrap">
          <div style="width:32px;height:32px;border-radius:8px;background:${s.color}22;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:${s.color}">${s.short.charAt(0)}</div>
          <span style="color:${s.color};font-weight:800;font-size:15px">${s.name}</span>
          <span style="color:${s.color};font-size:12px;opacity:0.7">${grp.length} test${grp.length!==1?"s":""}</span>
          ${grpAvg!==null?`<span style="margin-left:auto;background:${scBg(grpAvg)};color:${scColor(grpAvg)};border-radius:20px;padding:3px 12px;font-size:13px;font-weight:800">Avg: ${grpAvg}%</span>`:""}
        </div>
        ${grp.map(t=>renderTestCard(t)).join("")}
      </div>`;
    }).join("");
  }

  return `<div style="font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-bottom:20px;color:var(--text)">📝 Test Series</div>
    ${alertHtml}
    ${statHtml}
    ${subPerfHtml}
    ${trendHtml}
    ${planHtml}
    ${controlsHtml}
    ${addFormHtml}
    ${listHtml}`;
}
