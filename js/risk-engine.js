// risk-engine.js — CA Final Study Tracker
// Risk scoring engine: retention, risk score, priority index

function daysSinceDate(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((new Date() - new Date(dateStr)) / 86400000);
}

function calcRetentionScore(rev) {
  // Ebbinghaus forgetting curve approximation
  if (!rev.done) return 0;
  const days = daysSinceDate(rev.date);
  const halfLife = 7; // days before ~50% retention
  return Math.round(100 * Math.exp(-0.693 * days / halfLife));
}

function calcRiskScore(ch) {
  const catW = CAT_WEIGHT[ch.category] || 1;
  const rev0 = ch.revisions[0];
  const daysSince = rev0.date ? daysSinceDate(rev0.date) : 999;
  const overdueRevs = ch.revisions.filter((r, i) => i > 0 && !r.done && ch.revisions[i-1].done).length;
  const mockPenalty = ch.mockAverage !== null ? (100 - ch.mockAverage) / 20 : 0;
  const notStarted = !rev0.done ? 40 : 0;
  const retentionScore = rev0.done ? calcRetentionScore(rev0) : 0;
  const retentionPenalty = rev0.done ? (100 - retentionScore) / 10 : 0;
  const dl = daysLeft();
  const urgency = dl <= 30 ? 2 : dl <= 60 ? 1.5 : 1;

  let risk = (
    (catW * 10) +
    (Math.min(daysSince, 30) / 3) +
    (overdueRevs * 8) +
    mockPenalty +
    notStarted +
    retentionPenalty
  ) * urgency;

  // Cap at 100
  return Math.min(100, Math.round(risk));
}

function calcPriorityIndex(ch) {
  const risk = ch.riskScore || 0;
  const catW = CAT_WEIGHT[ch.category] || 1;
  const confidence = 100 - (ch.confidenceScore || 50);
  return Math.round((risk * 0.6) + (catW * 10) + (confidence * 0.3));
}

function runRiskEngine() {
  order.forEach(sk => {
    (D[sk]?.chapters || []).forEach(ch => {
      ch.riskScore = calcRiskScore(ch);
      ch.daysSinceTouch = ch.revisions[0].date ? daysSinceDate(ch.revisions[0].date) : 999;
      // Update retention scores
      ch.revisions.forEach(r => { if (r.done) r.retentionScore = calcRetentionScore(r); });
      ch.priorityIndex = calcPriorityIndex(ch);
    });
  });
}

// ══════════════════════════════════════════════════════
// METRICS ENGINE
// ══════════════════════════════════════════════════════
function computeMetrics() {
  const allC = order.flatMap(k => (D[k]?.chapters || []).map(c => ({ ...c, _sub: k })));
  const dl = daysLeft();

  // Basic progress
  const rev1Done = allC.filter(c => c.revisions[0].done).length;
  const rev2Done = allC.filter(c => c.revisions[1].done).length;
  const total = allC.length;
  const rev1Pct = total ? Math.round(rev1Done / total * 100) : 0;
  const rev2Pct = total ? Math.round(rev2Done / total * 100) : 0;

  // Category A coverage
  const catA = allC.filter(c => c.category === 'A');
  const catADone = catA.filter(c => c.revisions[0].done).length;
  const catAPct = catA.length ? Math.round(catADone / catA.length * 100) : 0;

  // Risk
  const highRisk = allC.filter(c => c.riskScore >= 60).sort((a,b) => b.riskScore - a.riskScore);
  const totalRisk = allC.reduce((s, c) => s + c.riskScore, 0);
  const avgRisk = total ? Math.round(totalRisk / total) : 0;

  // Required daily load
  const pendingRev1 = total - rev1Done;
  const dailyLoad = dl > 0 ? Math.ceil(pendingRev1 / dl) : pendingRev1;

  // Study velocity (chapters per day)
  const sessHrs = studySessions.reduce((a, s) => a + (s.duration || 0), 0);
  const firstSession = studySessions.length ? studySessions[0].date : null;
  const studyDays = firstSession ? Math.max(1, daysSinceDate(firstSession)) : 1;
  const velocity = rev1Done > 0 ? Math.round((rev1Done / studyDays) * 10) / 10 : 0;

  // Predicted completion
  const daysToFinish = velocity > 0 ? Math.ceil(pendingRev1 / velocity) : null;

  // Mock stats
  const mockedChs = allC.filter(c => mocks[c.id]?.done).length;
  const mockPct = total ? Math.round(mockedChs / total * 100) : 0;
  const allMockScores = allC.flatMap(c => c.mockAverage !== null ? [c.mockAverage] : []);
  const avgMockScore = allMockScores.length
    ? Math.round(allMockScores.reduce((a,b) => a+b, 0) / allMockScores.length)
    : null;

  // Predicted final score (0-800 for 8 papers)
  // Formula: base on rev1Pct (50% weight), catA coverage (30%), mock avg (20%)
  const baseFromRev = (rev1Pct / 100) * 400;
  const baseFromCatA = (catAPct / 100) * 240;
  const baseFromMock = avgMockScore !== null ? (avgMockScore / 100) * 160 : baseFromRev * 0.2;
  const riskPenalty = (avgRisk / 100) * 80;
  const rawPred = baseFromRev * 0.5 + baseFromCatA * 0.3 + baseFromMock * 0.2 - riskPenalty;
  const predictedScore = Math.min(800, Math.max(0, Math.round(rawPred)));
  const predictedScoreIfStagnant = Math.max(0, Math.round(predictedScore * 0.93 - 20));

  // Today's execution score
  const todayH = studySessions.filter(s => s.date === todayStr()).reduce((a, s) => a + s.duration, 0);
  const todayCh = allC.filter(c => c.revisions[0].date === todayStr() && c.revisions[0].done).length;
  const dailyHrTarget = settings.dailyHourTarget || 6;
  const hrPct = Math.min(100, (todayH / dailyHrTarget) * 100);
  const chPct = Math.min(100, (todayCh / Math.max(1, dailyLoad)) * 100);
  // Risk reduced today: chapters done today that were high risk
  const riskReducedToday = allC.filter(c => c.revisions[0].date === todayStr() && c.riskScore < 40).length;
  const riskPct = Math.min(100, (riskReducedToday / Math.max(1, highRisk.length)) * 100);
  const execScore = Math.round((hrPct * 0.4) + (chPct * 0.4) + (riskPct * 0.2));
  const execGrade = execScore >= 90 ? 'S' : execScore >= 75 ? 'A' : execScore >= 60 ? 'B' : execScore >= 40 ? 'C' : 'D';
  const execGradeCol = execScore >= 90 ? '#00e676' : execScore >= 75 ? '#69f0ae' : execScore >= 60 ? '#ffb324' : execScore >= 40 ? '#ff7043' : '#ff3d3d';

  // Study streak
  const streak = calcStreak();

  // Subject-level
  const subMetrics = {};
  order.forEach(sk => {
    const chs = D[sk]?.chapters || [];
    const r1 = chs.filter(c => c.revisions[0].done).length;
    const r2 = chs.filter(c => c.revisions[1].done).length;
    const r1p = chs.length ? Math.round(r1 / chs.length * 100) : 0;
    const r2p = chs.length ? Math.round(r2 / chs.length * 100) : 0;
    const catA2 = chs.filter(c => c.category === 'A');
    const catA2D = catA2.filter(c => c.revisions[0].done).length;
    const catA2P = catA2.length ? Math.round(catA2D / catA2.length * 100) : 0;
    const avgR = Math.round(chs.reduce((s, c) => s + c.riskScore, 0) / Math.max(1, chs.length));
    const mDone = chs.filter(c => mocks[c.id]?.done).length;
    const target = parseInt(visionBoard.targets?.[sk] || 0) || 0;
    subMetrics[sk] = { r1, r2, total: chs.length, r1p, r2p, catA2P, avgRisk: avgR, mDone, target };
  });

  return {
    rev1Done, rev2Done, total, rev1Pct, rev2Pct,
    catA, catADone, catAPct,
    highRisk, avgRisk,
    dailyLoad, pendingRev1,
    velocity, daysToFinish,
    sessHrs, todayH,
    mockedChs, mockPct, avgMockScore,
    predictedScore, predictedScoreIfStagnant,
    execScore, execGrade, execGradeCol,
    streak, dl,
    subMetrics
  };
}

// ── Streak: timestamp-based 24h model ────────────────────────────
const STREAK_TS_KEY = "ca-v6-streakTs"; // stores last activity timestamp (ms)
const STREAK_CNT_KEY = "ca-v6-streakCnt"; // stores current streak count

function _loadStreakTs() {
  try { return parseInt(localStorage.getItem(STREAK_TS_KEY)||"0"); } catch(x){ return 0; }
}
function _saveStreakTs(ts) {
  try { localStorage.setItem(STREAK_TS_KEY, String(ts)); } catch(x){} }

function _loadStreakCnt() {
  try { return parseInt(localStorage.getItem(STREAK_CNT_KEY)||"0"); } catch(x){ return 0; }
}
function _saveStreakCnt(n) {
  try { localStorage.setItem(STREAK_CNT_KEY, String(n)); } catch(x){} }

// Called whenever the user does something meaningful (chapter tick, planner tick, timer save)
function recordActivity() {
  const now = Date.now();
  const lastTs = _loadStreakTs();
  const gap = now - lastTs; // ms since last activity
  let cnt = _loadStreakCnt();
  if(lastTs === 0) {
    // First-ever activity
    cnt = 1;
  } else if(gap > 48 * 3600 * 1000) {
    // More than 48h gap — reset (generous: covers 1 missed day without punishing)
    cnt = 1;
  } else if(gap > 24 * 3600 * 1000) {
    // Between 24h and 48h — continues streak
    cnt++;
  }
  // Within 24h — same day, no change to count, just update timestamp
  _saveStreakTs(now);
  _saveStreakCnt(cnt);
}

