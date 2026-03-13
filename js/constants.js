// constants.js — CA Final Study Tracker
// App constants, default data, state variables

'use strict';
// ══════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════
// ── Exam Schedule System ─────────────────────────────────────────
// Stores: { group:"g1"|"g2"|"both", dates:{FR:"",AFM:"",Audit:"",DT:"",IDT:"",IBS:""} }
const EXAM_SCHEDULE_KEY = "ca_exam_schedule";
const EXAM_DATE_DEFAULT = "2026-05-02";

function getExamSchedule() {
  try { const r=localStorage.getItem(EXAM_SCHEDULE_KEY); if(r) return JSON.parse(r); } catch(x){}
  return { group:"both", dates:{} };
}
function saveExamSchedule(sched) {
  try { localStorage.setItem(EXAM_SCHEDULE_KEY, JSON.stringify(sched)); } catch(x){}
}
// Derive "first upcoming exam date" from schedule (used by all countdown logic)
function getExamDateStr() {
  const sched = getExamSchedule();
  const today = new Date().toISOString().slice(0,10);
  const upcoming = Object.values(sched.dates||{}).filter(Boolean).filter(d=>d>=today).sort();
  if (upcoming.length) return upcoming[0];
  const all = Object.values(sched.dates||{}).filter(Boolean).sort();
  return all[0] || EXAM_DATE_DEFAULT;
}
function getExamDate() { return new Date(getExamDateStr()+"T09:00:00"); }
// Map EXAM_SUBJECTS short-codes → subject keys in D
const EXAM_SUBJECTS = { g1:["FR","AFM","Audit"], g2:["DT","IDT","IBS"] };
function getSubKeyByShort(short) { return order.find(k=>D[k]?.short===short)||null; }


// ── MOTIVATIONAL QUOTES ──
const QUOTES = [
  {text:"The CA exam doesn't test how smart you are — it tests how consistent you are.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"Every chapter you revise today is one less worry on exam day.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"The CA journey is tough, but so are you.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"Revise once more. Your future self will thank you.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"The difference between a pass and an attempt is one more revision.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"Reading a chapter once is knowledge. Reading it three times is power.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"On the hardest days, remember: every CA who passed had the same 24 hours as you.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"One more mock test, one more revision — that's what separates pass from fail.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"The exam is temporary. The designation is forever.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"Success is the sum of small efforts, repeated day in and day out.",author:"Robert Collier",cat:"Discipline"},
  {text:"Don't watch the clock; do what it does. Keep going.",author:"Sam Levenson",cat:"Persistence"},
  {text:"Hard work beats talent when talent doesn't work hard.",author:"Tim Notke",cat:"Work Ethic"},
  {text:"Discipline is the bridge between goals and accomplishment.",author:"Jim Rohn",cat:"Discipline"},
  {text:"The pain of discipline is far less than the pain of regret.",author:"Unknown",cat:"Discipline"},
  {text:"One day or day one — you decide.",author:"Unknown",cat:"Action"},
  {text:"Wake up with determination. Go to bed with satisfaction.",author:"Unknown",cat:"Mindset"},
  {text:"Push yourself because no one else is going to do it for you.",author:"Unknown",cat:"Discipline"},
  {text:"Fall seven times, stand up eight.",author:"Japanese Proverb",cat:"Persistence"},
  {text:"An investment in knowledge pays the best interest.",author:"Benjamin Franklin",cat:"Learning"},
  {text:"There are no shortcuts to any place worth going.",author:"Beverly Sills",cat:"Work Ethic"},
  {text:"Focused, hard work is the real key to success.",author:"John Carmack",cat:"Work Ethic"},
  {text:"Energy and persistence conquer all things.",author:"Benjamin Franklin",cat:"Persistence"},
  {text:"Don't limit your challenges. Challenge your limits.",author:"Jerry Dunn",cat:"Growth"},
  {text:"A goal without a plan is just a wish.",author:"Antoine de Saint-Exupéry",cat:"Discipline"},
  {text:"Numbers don't lie. Your hard work adds up — keep going.",author:"CA Aspirant",cat:"CA Journey"},
  {text:"You are one study session away from a breakthrough.",author:"CA Aspirant",cat:"CA Journey"},
];
const CAT_ICON = {"Discipline":"🎯","Action":"⚡","Mindset":"🧠","Persistence":"💪","Work Ethic":"🔥","Growth":"🌱","Patience":"⏳","Learning":"📚","CA Journey":"🏆"};
let quoteIdx = Math.floor(Math.random() * QUOTES.length);
let quoteVisible = true;
const EXAM_TOTAL_MARKS = 800; // 5 papers × 100 each = 500... actually CA Final is 8 papers × 100 = 800
const PASS_MARKS = 400;
const SK = "ca-v6-data", PK = "ca-v6-plans", SET = "ca-v6-settings", MK = "ca-v6-mocks", VBK = "ca-v6-visionboard", METRICS_K = "ca-v6-metrics";
const TIMER_STATE_KEY = "ca-v6-timer-state";
const DATA_VERSION = 6;

// Category weights for risk scoring
const CAT_WEIGHT = { A: 3, B: 2, C: 1 };
// ── SUBJECT DATA ──
const DSUB_DEFAULT = {
  FR: { name:"Financial Reporting", short:"FR", color:"#7c83ff", chapters: mkChs("fr", [
    ["Ind AS 109 – Financial Instruments","A"],["Ind AS 116 – Leases","A"],["Ind AS 102 – Share Based Payment","A"],
    ["Ind AS 103 – Business Combinations","A"],["Ind AS 110/28/111 – Consolidated FS","A"],["Ind AS 115 – Revenue from Contracts","A"],
    ["Conceptual Framework for FR under Ind AS","A"],["Professional & Ethical Duty of a CA","A"],["Accounting & Technology","A"],
    ["Analysis of Financial Statements","A"],["Ind AS 101 – First Time Adoption","A"],["Ind AS 1 – Presentation of FS","A"],
    ["Ind AS 34 – Interim Financial Reporting","A"],["Ind AS 16 – PPE","B"],["Ind AS 38 – Intangible Assets","B"],
    ["Ind AS 105 – Non-Current Assets Held for Sale","B"],["Ind AS 108 – Operating Segments","B"],["Ind AS 41 – Agriculture","B"],
    ["Ind AS 12 – Income Taxes","B"],["Ind AS 20 – Government Grants","B"],["Ind AS 113 – Fair Value Measurement","B"],
    ["Ind AS 10 – Events After Reporting Period","B"],["Ind AS 36 – Impairment of Assets","B"],["Ind AS 33 – EPS","B"],
    ["Ind AS 19 – Employee Benefits","C"],["Ind AS 23 – Borrowing Costs","C"],["Ind AS 21 – Foreign Exchange","C"],
    ["Ind AS 7 – Cash Flow","C"],["Ind AS 2 – Inventory","C"],["Ind AS 40 – Investment Property","C"],
    ["Intro to Ind AS","C"],["Ind AS 37 – Provisions & Contingencies","C"],["Ind AS 24 – Related Party Disclosures","C"],["Ind AS 8","C"]
  ]) },
  AFM: { name:"Adv. Financial Mgmt", short:"AFM", color:"#ffb324", chapters: mkChs("afm", [
    ["Security Valuation","A"],["Portfolio Management","A"],["Mutual Funds","A"],["Derivatives Analysis & Valuation","A"],
    ["Interest Rate Risk Management","A"],["Mergers, Acquisitions & Corporate Restructuring","A"],["Business Valuation","A"],
    ["Advanced Capital Budgeting","A"],["Theory Chapters (Financial Policy, Risk, Securitization, Startup)","B"],
    ["Risk Management (VAR)","B"],["Security Analysis – 4 Practical Questions","B"],["International Financial Management","B"],
    ["Forex","C"],["Theory Topics of Practical Chapters","C"]
  ]) },
  DT: { name:"Direct Tax", short:"DT", color:"#ff5252", chapters: mkChs("dt", [
    ["Double Tax Relief","A"],["NR Taxation – POEM, Sec 9, 44B/BBA/BBC","A"],["Advance Rulings","A"],
    ["Various Entities – MAT, AMT, Cooperative, Business Trust, Investment Fund","A"],["Charitable Trust","A"],
    ["TDS & TCS","A"],["Tax Audit & Ethical Compliances","A"],["Tax Planning, Evasion & Avoidance (GAAR)","A"],
    ["Capital Gains – Slump Sales, 45(4)&9B, ULIP, Buyback","A"],["Transfer Pricing","A"],
    ["PGBP – Concessional Rates, Deductions (80JJAA, 80IAC, 10AA)","A"],["Black Money & Tax Law","B"],
    ["IFOS (115BB, 115BBJ, 115BBH)","B"],["Return Filing & Assessment Procedure","B"],["Appeals & Revision","B"],
    ["Miscellaneous Provisions","B"],["Penalties and Prosecution","B"],["Dispute Resolution","C"],
    ["Income Tax Authorities","C"],["Application & Interpretation of Tax Treaties","C"],["Fundamentals of BEPS","C"],
    ["Overview of Model Tax Conventions","C"],["Setoff","C"],["Deductions & Other Topics","C"],
    ["Basic Concepts & Exempt Income","C"],["Clubbing","C"],["Latest Developments in International Taxation","C"],["Case Laws","C"]
  ]) },
  IDT: { name:"Indirect Tax", short:"IDT", color:"#b388ff", chapters: mkChs("idt", [
    ["Supply under GST","A"],["Charge under GST – RCM & Composition","A"],["Value of Supply","A"],
    ["Exemption from GST","A"],["Input Tax Credit","A"],["Refund under GST","A"],
    ["Inspection, Search & Seizure","A"],["Demand & Recovery","A"],["Offence, Penalty & Ethical Aspects","A"],
    ["Appeals & Revision","A"],["Levy & Types of Customs Duties","A"],["Exemptions from Customs Duties","A"],
    ["Valuations under Customs","A"],["Place of Supply","B"],["Time of Supply","B"],
    ["Electronic Commerce Transactions","B"],["E-way Bill, Accounts & Records","B"],["Import & Export under GST","B"],
    ["Tax Invoice, Debit Note & Credit Note","B"],["Registration – Non-procedural","B"],
    ["Payment of Tax","B"],["Assessment & Audit","B"],["Advance Ruling","B"],
    ["Importation & Exportation of Goods","B"],["Warehousing","B"],["Foreign Trade Policy","B"],
    ["Registration Procedural Part & Records","C"],["Returns","C"],["Tax Deducted at Source","C"],
    ["Liability in Certain Cases & Misc Provisions","C"],["Refund under Customs","C"],["Classification","C"]
  ]) },
  Audit: { name:"Auditing & PE", short:"Audit", color:"#00e676", chapters: mkChs("audit", [
    ["Professional Ethics & Code of Conduct","A"],["SQC 1 & SA 220","A"],["SA 240 – Fraud","A"],
    ["SA 260 – Communication with TCWG","A"],["SA 299 – Joint Audit","A"],["SA 505 – External Confirmations","A"],
    ["SA 540 – Estimates","A"],["SA 550 – Related Parties","A"],["SA 560 – Subsequent Events","A"],
    ["SA 570 – Going Concern","A"],["SA 620 – Expert","A"],["SA 705 – Modified Opinion","A"],["SA 800","A"],
    ["SA 402 – Service Org","A"],["SA 805","A"],["SRS 4400 & 4410","A"],["SAE 3400","A"],
    ["SDG & ESG Assurance","A"],["Company Audit","A"],["CARO","A"],["Group Audit","A"],
    ["SA 265","B"],["SA 320","B"],["SA 501","B"],["SA 510","B"],["SA 520","B"],
    ["SA 530","B"],["SA 600","B"],["SA 610","B"],["SA 701","B"],["SA 706","B"],
    ["SA 720","B"],["SA 250","B"],["SA 315","B"],["SA 810","B"],["SRE 2400 & 2410","B"],
    ["Audit of Bank","B"],["Audit of NBFC","B"],["Investigation","B"],["Digital Audit","B"],
    ["Internal Audit","C"],["Forensic Audit","C"],["Due Diligence","C"],["Risk Assessment & Internal Control","C"],
    ["SA 200","C"],["SA 210","C"],["SA 230","C"],["SA 300","C"],["SA 330","C"],
    ["SA 450","C"],["SA 500","C"],["SA 580","C"],["SA 700","C"],["SA 710","C"]
  ]) }
};

function mkChs(prefix, list) {
  return list.map(([name, cat], i) => ({
    id: `${prefix}_${i+1}`,
    name,
    category: cat,
    // v6 rich revision model
    revisions: [
      { done: false, date: null, retentionScore: 0 },
      { done: false, date: null, retentionScore: 0 },
      { done: false, date: null, retentionScore: 0 },
      { done: false, date: null, retentionScore: 0 }
    ],
    mockAverage: null,
    mockAttempts: 0,
    confidenceScore: 0, // 0-100 user-set
    notes: "",
    // computed on load
    riskScore: 0,
    priorityIndex: 0,
    daysSinceTouch: 999
  }));
}

// ══════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════
let D = {}, order = [];
let plans = [], settings = {
  theme: "dark", compact: false, warMode: false,
  showOnlyRev: false, dailyHourTarget: 6
};
let mocks = {};
let visionBoard = { targets:{}, mantra:"Excellence is not a destination. It is a continuous journey." };
let metrics = {};

// UI state
let tab = "dashboard", expCh = null, sortBy = {}, filterBy = {}, editNotes = null;
let pView = "list", activePlanId = null, activeDay = 0;
let wStep = 1, wSubs = [], wRev = 0, wDays = 4, wStart = todayStr(), wAssign = {};
let editingPlanId = null; // null = new plan, string = editing existing plan id
let addSubModal = false, newSubName = "", newSubShort = "";
let addChSub = null, newChName = "", newChCat = "A";
let deletePlanModal = null;
let sidebarOpen = false;
let activeSubjectHub = null; // null = show hub grid, else = subject key being viewed

// Timer state
let flipTimerGoal = 0, flipTimerRemain = 0, flipTimerRunning = false;
let flipTimerInterval = null, flipTimerLabel = "", flipTimerSetMode = true;
// Timestamp-based timer state (fixes tab-throttle drift)
let _timerStartTs = 0;   // Date.now() when timer last started/resumed
let _timerElapsed = 0;   // ms already elapsed before last pause

// Sessions
let studySessions = [];

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════
function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysLeft() { return Math.max(0, Math.ceil((getExamDate() - new Date()) / 86400000)); }
function fmtDate(start, off) {
  const d = new Date(start); d.setDate(d.getDate() + off);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function esc(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function isWarMode() { return settings.warMode || daysLeft() <= 30; }

// Migration: convert old rev:[0,0,0,0] to new revisions object
// ── Data migration: version-aware wrapper around stored JSON ─────
function migrateData(parsed) {
  if (!parsed) return parsed;
  // Ensure version field exists
  if (!parsed.v) parsed.v = 1;
  // v < 6: chapter-level migration is handled per-chapter by migrateChapter()
  // Nothing extra needed here — migrateChapter already runs after load
  // v >= 7: add future migration blocks here
  parsed.v = DATA_VERSION;
  return parsed;
}

function migrateChapter(ch) {
  if (!ch.revisions) {
    const oldRev = ch.rev || [0,0,0,0];
    ch.revisions = oldRev.map(v => ({ done: !!v, date: v ? todayStr() : null, retentionScore: v ? 60 : 0 }));
    delete ch.rev;
  }
  if (!ch.riskScore) ch.riskScore = 0;
  if (!ch.priorityIndex) ch.priorityIndex = 0;
  if (ch.daysSinceTouch === undefined) ch.daysSinceTouch = 999;
  if (!ch.mockAverage) ch.mockAverage = null;
  if (!ch.mockAttempts) ch.mockAttempts = 0;
  if (ch.confidenceScore === undefined) ch.confidenceScore = 0;
  if (!ch.notes) ch.notes = "";
  return ch;
}

// ══════════════════════════════════════════════════════
// PERSISTENCE
// ══════════════════════════════════════════════════════

// ── Auto-reschedule: move missed undone chapters into upcoming days ──
