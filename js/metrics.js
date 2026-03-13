// metrics.js — CA Final Study Tracker
// Metrics: streak, activity recording, metrics computation

function calcStreak() {
  // Hybrid: use timestamp model if available, else fall back to session-date count
  const ts = _loadStreakTs();
  const cnt = _loadStreakCnt();
  if(ts > 0) {
    // If last activity was > 48h ago, streak has expired
    if((Date.now() - ts) > 48 * 3600 * 1000) return 0;
    return cnt;
  }
  // Legacy fallback: calculate from studySessions dates (backward compat)
  const dates = [...new Set(studySessions.map(s => s.date))].sort();
  if (!dates.length) return 0;
  let streak = 0;
  const today = todayStr();
  let d = new Date(today);
  while (true) {
    const ds = d.toISOString().slice(0, 10);
    if (dates.includes(ds)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
    if (streak > 365) break;
  }
  // Migrate to new model on first read
  if(streak > 0) { _saveStreakCnt(streak); _saveStreakTs(Date.now()); }
  return streak;
}

function todayHrs() {
  return Math.round(studySessions.filter(s => s.date === todayStr()).reduce((a, s) => a + s.duration, 0) * 10) / 10;
}

// ══════════════════════════════════════════════════════
// AUTO SCHEDULER
// ══════════════════════════════════════════════════════
