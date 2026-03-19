// diary.js — CA Final Study Tracker
// Study diary and mistake log

let diaryNotes    = [];
let diaryMistakes = [];
let diaryNoteText = "";
let diaryNoteDateRaw = "";
let diaryMistakeForm = { subject:"", chapter:"", desc:"", source:"Mock" };
function loadDiary() {
  try { const r=localStorage.getItem(DIARY_KEY);    if(r) diaryNotes    = JSON.parse(r); } catch(x){}
  try { const r=localStorage.getItem(MISTAKES_KEY); if(r) diaryMistakes = JSON.parse(r); } catch(x){}
}
function saveDiaryNotes()    { try { localStorage.setItem(DIARY_KEY,    JSON.stringify(diaryNotes));    } catch(x){} }
function saveDiaryMistakes() { try { localStorage.setItem(MISTAKES_KEY, JSON.stringify(diaryMistakes)); } catch(x){} }

function addDiaryNote() {
  const txt = (diaryNoteText||"").trim();
  if (!txt) return;
  const date = diaryNoteDateRaw || todayStr();
  diaryNotes.unshift({ id: Date.now().toString(), date, text: txt });
  diaryNoteText = ""; diaryNoteDateRaw = "";
  saveDiaryNotes(); render();
}
function delDiaryNote(id) { diaryNotes = diaryNotes.filter(n=>n.id!==id); saveDiaryNotes(); render(); }

function addMistake() {
  const { subject, chapter, desc, source } = diaryMistakeForm;
  if (!(desc||"").trim()) return;
  diaryMistakes.unshift({ id:Date.now().toString(), subject, chapter, desc:desc.trim(), source, date:todayStr() });
  diaryMistakeForm = { subject:"", chapter:"", desc:"", source:"Mock" };
  saveDiaryMistakes(); render();
}
function delMistake(id) { diaryMistakes = diaryMistakes.filter(m=>m.id!==id); saveDiaryMistakes(); render(); }

function renderDiary() {
  const noteDate = diaryNoteDateRaw || todayStr();
  const dailyNotesForm = `
  <div class="card fu" style="margin-bottom:16px">
    <div class="panel-label">✏️ Daily Notes</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input type="date" value="${noteDate}" oninput="diaryNoteDateRaw=this.value"
          style="background:var(--surface2);border:1.5px solid var(--border2);border-radius:9px;padding:8px 12px;font-size:13px;color:var(--text);outline:none;font-family:'Sora',sans-serif"/>
        <span style="font-size:11px;color:var(--text3)">📅 ${new Date(noteDate+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</span>
      </div>
      <textarea id="diary-note-ta" rows="4"
        style="width:100%;background:var(--surface2);border:1.5px solid var(--border2);border-radius:12px;padding:14px;font-size:13px;color:var(--text);font-family:'Sora',sans-serif;resize:vertical;outline:none;box-sizing:border-box;line-height:1.6"
        placeholder="Write today's study reflection, what you covered, doubts, key insights…"
        oninput="diaryNoteText=this.value">${esc(diaryNoteText)}</textarea>
      <div>
        <button onclick="addDiaryNote()" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Sora',sans-serif">Save Note</button>
      </div>
    </div>
  </div>`;

  const notesList = diaryNotes.length ? `
  <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
    ${diaryNotes.map(n => {
      const d = new Date((n.date||"")+"T00:00:00");
      const dlbl = isNaN(d) ? n.date : d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
      return `<div class="card" style="padding:16px 18px;border-left:3px solid #2563eb">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
          <span style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:0.8px">📅 ${dlbl}</span>
          <button onclick="delDiaryNote('${n.id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;padding:2px 6px" title="Delete">✕</button>
        </div>
        <div style="font-size:13px;color:var(--text2);line-height:1.7;white-space:pre-wrap">${esc(n.text)}</div>
      </div>`;
    }).join("")}
  </div>` : `<div style="text-align:center;padding:28px 0;color:var(--text3);font-size:13px;margin-bottom:20px">No notes yet. Write your first reflection above!</div>`;

  const chNotesBySubject = order.map(sk => {
    const s = D[sk]; if (!s) return null;
    const noted = (s.chapters||[]).filter(c => (c.notes||"").trim());
    if (!noted.length) return null;
    return { sk, name: s.name, color: s.color, chapters: noted };
  }).filter(Boolean);

  const chNotesHtml = chNotesBySubject.length ? `
  <div class="card fu" style="margin-bottom:16px">
    <div class="panel-label">📒 Chapter Notes</div>
    <div style="display:flex;flex-direction:column;gap:20px">
      ${chNotesBySubject.map(({ sk, name, color, chapters }) => `
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <div style="width:3px;height:18px;border-radius:2px;background:${color}"></div>
            <span style="font-weight:800;font-size:14px;color:var(--text)">${name}</span>
            <span style="font-size:11px;color:var(--text3)">${chapters.length} note${chapters.length>1?"s":""}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:7px;padding-left:11px">
            ${chapters.map(c => `
              <div style="background:var(--surface2);border-radius:10px;padding:10px 14px;border-left:2px solid ${color}44">
                <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px">${esc(c.name)}</div>
                <div style="font-size:12px;color:var(--text2);line-height:1.6;white-space:pre-wrap">• ${esc(c.notes)}</div>
              </div>`).join("")}
          </div>
        </div>`).join("")}
    </div>
  </div>` : `
  <div class="card" style="margin-bottom:16px;text-align:center;padding:28px">
    <div style="font-size:28px;margin-bottom:8px">📒</div>
    <div style="color:var(--text3);font-size:13px">No chapter notes yet.<br>Add notes from the Subjects tab while studying.</div>
  </div>`;

  const subOpts = order.map(k=>`<option value="${k}" ${diaryMistakeForm.subject===k?"selected":""}>${D[k]?.short||k} — ${D[k]?.name||""}</option>`).join("");
  const srcOpts = ["Mock","RTP","MTP","PYQ","Practice"].map(s=>`<option value="${s}" ${diaryMistakeForm.source===s?"selected":""}>${s}</option>`).join("");

  // FIX 10: Mistake form grid — mobile: single col, desktop: auto-fit minmax(160px)
  const mistakeGridStyle = mob()
    ? "display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:10px"
    : "display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:10px";

  const mistakeForm = `
  <div class="card fu" style="margin-bottom:16px">
    <div class="panel-label">🚨 Mistake Log</div>
    <div style="${mistakeGridStyle}">
      <div>
        <label style="display:block;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:5px">Subject</label>
        <select onchange="diaryMistakeForm.subject=this.value;diaryMistakeForm.chapter='';render()" class="inp" style="cursor:pointer">
          <option value="">— Select —</option>${subOpts}
        </select>
      </div>
      <div>
        <label style="display:block;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:5px">Chapter</label>
        <select onchange="diaryMistakeForm.chapter=this.value" class="inp" style="cursor:pointer">
          <option value="">— Select Chapter —</option>
          ${diaryMistakeForm.subject && D[diaryMistakeForm.subject]
            ? D[diaryMistakeForm.subject].chapters.map(c=>`<option value="${esc(c.name)}" ${diaryMistakeForm.chapter===c.name?"selected":""}>${esc(c.name)}</option>`).join("")
            : `<option disabled>Select a subject first</option>`}
        </select>
      </div>
      <div>
        <label style="display:block;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:5px">Source</label>
        <select onchange="diaryMistakeForm.source=this.value" class="inp" style="cursor:pointer">${srcOpts}</select>
      </div>
    </div>
    <div style="margin-bottom:10px">
      <label style="display:block;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:5px">Mistake / Concept Missed</label>
      <textarea class="inp" rows="3" style="resize:vertical;line-height:1.6;font-size:13px" placeholder="Describe the mistake, wrong assumption, or concept you missed…" oninput="diaryMistakeForm.desc=this.value">${esc(diaryMistakeForm.desc)}</textarea>
    </div>
    <button onclick="addMistake()" style="background:#dc2626;color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Sora',sans-serif">Log Mistake</button>
  </div>`;

  const MISTAKE_SRC_COLORS = { Mock:"#2563eb", RTP:"#7c3aed", MTP:"#d97706", PYQ:"#16a34a", Practice:"#0891b2" };
  const mistakeList = diaryMistakes.length ? `
  <div style="display:flex;flex-direction:column;gap:8px">
    ${diaryMistakes.map((m,i) => {
      const sc = MISTAKE_SRC_COLORS[m.source] || "#94a3b8";
      const subName = D[m.subject]?.short || m.subject || "—";
      return `<div class="card" style="padding:14px 16px;border-left:3px solid ${sc}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
              <span style="font-size:11px;font-weight:800;color:${sc};background:${sc}18;border-radius:20px;padding:2px 9px">${m.source}</span>
              ${m.subject?`<span style="font-size:11px;font-weight:700;color:var(--text2)">${subName}</span>`:""}
              ${m.chapter?`<span style="font-size:11px;color:var(--text3)">· ${esc(m.chapter)}</span>`:""}
              <span style="font-size:10px;color:var(--text3)">${m.date||""}</span>
            </div>
            <div style="font-size:13px;color:var(--text);line-height:1.6">${esc(m.desc)}</div>
          </div>
          <button onclick="delMistake('${m.id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;padding:2px 6px;flex-shrink:0">✕</button>
        </div>
      </div>`;
    }).join("")}
  </div>` : `<div style="text-align:center;padding:28px;color:var(--text3);font-size:13px">No mistakes logged yet. Start after your first mock test!</div>`;

  return `
  <div style="font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-bottom:6px;color:var(--text)">📔 Study Diary</div>
  <div style="font-size:13px;color:var(--text3);margin-bottom:20px">Your personal study journal — notes, chapter insights, and mistake tracker.</div>
  ${dailyNotesForm}
  ${notesList}
  ${chNotesHtml}
  <div style="font-size:16px;font-weight:800;color:var(--text);margin:24px 0 14px;padding-top:8px;border-top:1.5px solid var(--border)">🚨 Mistake Log <span style="font-size:12px;color:var(--text3);font-weight:500">(${diaryMistakes.length} logged)</span></div>
  ${mistakeForm}
  ${mistakeList}`;
}
