// helpers.js — CA Final Study Tracker
// UI helper functions: auto-schedule, SVG ring, gradients, spark lines

function generateAutoSchedule() {
  const allPending = order.flatMap(k =>
    (D[k]?.chapters || [])
      .filter(c => !c.revisions[0].done)
      .map(c => ({ ...c, _sub: k, _subName: D[k]?.short }))
  ).sort((a, b) => b.priorityIndex - a.priorityIndex);

  const dl = daysLeft();
  const dailyLoad = Math.max(3, Math.ceil(allPending.length / Math.max(1, dl)));
  const warLoad = isWarMode() ? Math.ceil(dailyLoad * 1.3) : dailyLoad;

  // Today's auto schedule
  const todays = allPending.slice(0, warLoad);
  return {
    total: allPending.length,
    dailyLoad: warLoad,
    todays,
    remaining: allPending.slice(warLoad)
  };
}

// ══════════════════════════════════════════════════════
// RENDER HELPERS
// ══════════════════════════════════════════════════════
function ring(pct, col, sz = 60, sw = 5) {
  const r = (sz - sw * 2) / 2, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return `<svg width="${sz}" height="${sz}" style="transform:rotate(-90deg)">
    <circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${sw}"/>
    <circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" stroke-linecap="round" style="transition:stroke-dashoffset .7s"/>
  </svg>`;
}
function ringW(pct, col, sz = 60, sw = 5, sub = "") {
  return `<div class="ring-wrap" style="width:${sz}px;height:${sz}px">${ring(pct, col, sz, sw)}
    <div style="position:absolute;text-align:center;pointer-events:none">
      <div class="mono" style="font-size:${sz<52?10:12}px;font-weight:700;color:${col};line-height:1">${pct}%</div>
      ${sub ? `<div style="font-size:8px;color:var(--text3);margin-top:1px">${sub}</div>` : ""}
    </div>
  </div>`;
}
function riskColor(score) {
  if (score >= 70) return "#dc2626";
  if (score >= 40) return "#d97706";
  return "#16a34a";
}
function riskClass(score) {
  if (score >= 70) return "high-risk";
  if (score >= 40) return "med-risk";
  return "";
}
function riskBarColor(score) {
  if (score >= 70) return "#dc2626";
  if (score >= 40) return "#d97706";
  return "#16a34a";
}
function gradBar(lbl, pct, col, showPct = true) {
  return `<div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;margin-bottom:5px">
      <span style="font-size:12px;color:var(--text2)">${lbl}</span>
      ${showPct ? `<span class="mono" style="font-size:11px;color:${col};font-weight:700">${pct}%</span>` : ""}
    </div>
    <div class="bar-wrap"><div class="bar-fill" style="width:${pct}%;background:${col}"></div></div>
  </div>`;
}
function chkSvg() { return `<svg width="11" height="11" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`; }
function sparkline(vals, col, w = 80, h = 20) {
  if (!vals || vals.length < 2) return "";
  const mx = Math.max(...vals, 1);
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * w).toFixed(1)},${(h - v / mx * h * 0.9).toFixed(1)}`).join(" ");
  const id = "sg" + Math.random().toString(36).slice(2);
  return `<svg width="${w}" height="${h}" style="overflow:visible">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${col}" stop-opacity=".15"/><stop offset="100%" stop-color="${col}" stop-opacity="0"/>
    </linearGradient></defs>
    <polygon points="0,${h} ${pts} ${w},${h}" fill="url(#${id})"/>
    <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
