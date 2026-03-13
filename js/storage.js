// storage.js — CA Final Study Tracker
// LocalStorage persistence: load/save functions, migration, auto-adjust

function detectBacklog() {
  const today = new Date(); today.setHours(0,0,0,0);
  const backlog = []; // [{planId, dayIdx, chIdx, ch}]
  plans.forEach(plan => {
    (plan.days || []).forEach((day, di) => {
      const dayDate = new Date(plan.startDate);
      dayDate.setDate(dayDate.getDate() + di);
      dayDate.setHours(0,0,0,0);
      if (dayDate < today) {
        (day.chapters || []).forEach((ch, ci) => {
          if (!ch.done) backlog.push({ planId: plan.id, dayIdx: di, chIdx: ci, ch });
        });
      }
    });
  });
  return backlog;
}

function autoAdjustPlanner() {
  const today = new Date(); today.setHours(0,0,0,0);
  let changed = false;

  plans.forEach(plan => {
    // Collect missed undone chapters
    const missed = [];
    (plan.days || []).forEach((day, di) => {
      const dayDate = new Date(plan.startDate);
      dayDate.setDate(dayDate.getDate() + di);
      dayDate.setHours(0,0,0,0);
      if (dayDate < today) {
        const remaining = (day.chapters || []).filter(ch => !ch.done);
        if (remaining.length) {
          // Remove them from the past day
          day.chapters = day.chapters.filter(ch => ch.done);
          missed.push(...remaining);
          changed = true;
        }
      }
    });

    if (!missed.length) return;

    // Find future days (index where dayDate >= today)
    const futureDayIndices = [];
    (plan.days || []).forEach((day, di) => {
      const dayDate = new Date(plan.startDate);
      dayDate.setDate(dayDate.getDate() + di);
      dayDate.setHours(0,0,0,0);
      if (dayDate >= today) futureDayIndices.push(di);
    });

    // If no future days exist, extend plan with extra days
    if (!futureDayIndices.length) {
      const extraDays = Math.ceil(missed.length / 3);
      for (let i = 0; i < extraDays; i++) {
        plan.days.push({ chapters: [] });
        plan.totalDays = plan.days.length;
        futureDayIndices.push(plan.days.length - 1);
      }
    }

    // Spread missed chapters across future days (round-robin, max 3 extras/day)
    missed.forEach((ch, i) => {
      const targetDayIdx = futureDayIndices[i % futureDayIndices.length];
      plan.days[targetDayIdx].chapters.push(ch);
    });
  });

  if (changed) saveP();
}

function load() {
  try {
    const r = localStorage.getItem(SK);
    if (r) {
      const p = migrateData(JSON.parse(r));
      D = p.D; order = p.order;
      // Migrate all chapters
      order.forEach(k => { if (D[k]) D[k].chapters = D[k].chapters.map(migrateChapter); });
    }
  } catch(x) {}
  // Try legacy v5 data
  if (!D || !Object.keys(D).length) {
    try {
      const r5 = localStorage.getItem("ca-v5-data");
      if (r5) {
        const p5 = migrateData(JSON.parse(r5));
        D = p5.D; order = p5.order;
        order.forEach(k => { if (D[k]) D[k].chapters = D[k].chapters.map(migrateChapter); });
      }
    } catch(x) {}
  }
  if (!D || !Object.keys(D).length) {
    D = JSON.parse(JSON.stringify(DSUB_DEFAULT));
    order = Object.keys(D);
  }
  try { const r = localStorage.getItem(PK); if (r) plans = JSON.parse(r); } catch(x) {}
  try { const r = localStorage.getItem(SET); if (r) Object.assign(settings, JSON.parse(r)); } catch(x) {}
  try {
    const r = localStorage.getItem(MK);
    if (r) mocks = JSON.parse(r);
    // Migrate sessions from visionBoard
  } catch(x) {}
  try {
    const r = localStorage.getItem(VBK);
    if (r) {
      const vb = JSON.parse(r);
      Object.assign(visionBoard, vb);
      if (vb.studySessions) { studySessions = vb.studySessions; }
    }
  } catch(x) {}
  if (!studySessions) studySessions = [];
  loadTS();
  loadDiary();
  loadStrategy();
  loadCal();
  loadBpTasks();
  loadTimerState();
  autoAdjustPlanner(); // self-heal: reschedule any missed undone tasks
}
function saveD() { try { localStorage.setItem(SK, JSON.stringify({ D, order, v: DATA_VERSION })); } catch(x) {} }
function saveP() { try { localStorage.setItem(PK, JSON.stringify(plans)); } catch(x) {} }
function saveSet() { try { localStorage.setItem(SET, JSON.stringify(settings)); } catch(x) {} }
function saveMocks() { try { localStorage.setItem(MK, JSON.stringify(mocks)); } catch(x) {} }
function saveVB() { try { localStorage.setItem(VBK, JSON.stringify({ ...visionBoard, studySessions })); } catch(x) {} }

// ══════════════════════════════════════════════════════
// RISK ENGINE
// ══════════════════════════════════════════════════════
