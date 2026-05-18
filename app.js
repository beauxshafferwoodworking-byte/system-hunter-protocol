const STORE_KEY = 'system_hunter_protocol_v15';
const $ = id => document.getElementById(id);
const CODEX = {
  'Mobility Sequence': { category:'Mobility / Warmup', steps:['Move slowly through cat-cow for 8 reps.','Rotate through the upper back, not the low back.','Hold hip flexor stretch 45 seconds per side.','Breathe slowly through the full sequence.'], cues:['This should feel like opening up, not forcing range.','Stop if sharp pain shows up.'], link:'https://www.youtube.com/results?search_query=cat+cow+thoracic+rotation+hip+flexor+stretch' },
  'Core Stabilization': { category:'Core / Back Support', steps:['Perform dead bugs with low back gently braced.','Perform glute bridges by squeezing glutes, not arching back.','Perform bird dogs slowly with hips square.'], cues:['Keep ribs down.','Do not chase speed.','The goal is control.'], link:'https://www.youtube.com/results?search_query=dead+bug+glute+bridge+bird+dog+exercise' },
  'Neck Recovery Protocol': { category:'Neck / Posture', steps:['Perform chin tucks by sliding head straight back.','Use gentle neck rotations only within comfortable range.','Squeeze shoulder blades lightly for scapular retractions.'], cues:['No aggressive stretching.','Avoid forcing rotation into pain.','Stop if headache symptoms spike.'], link:'https://www.youtube.com/results?search_query=chin+tuck+scapular+retraction+neck+mobility' },
  'Zone 2 Walk': { category:'Endurance / Recovery', steps:['Walk 20-30 minutes at an easy pace.','You should be able to speak in short sentences.','Use nasal breathing if possible.'], cues:['This is recovery conditioning, not a punishment run.'], link:'https://www.youtube.com/results?search_query=zone+2+walking+cardio' },
  'Push Progression': { category:'Strength / Push', steps:['Set hands just outside shoulder width.','Brace glutes and abs.','Lower under control.','Stop 2 reps before failure.'], cues:['No sagging hips.','Keep neck neutral.','Quality beats max reps.'], link:'https://www.youtube.com/results?search_query=proper+push+up+form' },
  'Leg Foundation': { category:'Strength / Lower Body', steps:['Squat with feet rooted and knees tracking over toes.','Reverse lunge by stepping back under control.','Calf raise through full range.'], cues:['Do not collapse knees inward.','Move smooth, not fast.'], link:'https://www.youtube.com/results?search_query=bodyweight+squat+reverse+lunge+calf+raise+form' },
  'Core Armor': { category:'Core / Trunk', steps:['Plank with ribs down and glutes lightly squeezed.','Dead bug slowly without low-back arch.','Hollow hold only as low as you can control.'], cues:['Shaking is fine. Pain is not.','Brace like preparing for impact.'], link:'https://www.youtube.com/results?search_query=plank+dead+bug+hollow+hold+form' },
  'Run-Walk Conditioning': { category:'Endurance', steps:['Warm up with 5 minutes walking.','Jog 60 seconds, walk 90 seconds.','Repeat 8 rounds.','Cool down with easy walking.'], cues:['Keep jog pace embarrassingly easy.','Build the engine before speed.'], link:'https://www.youtube.com/results?search_query=run+walk+interval+beginner+conditioning' },
  'Durability Circuit': { category:'Conditioning', steps:['Move through squats, pushups, and mountain climbers.','Rest as needed to keep form clean.','Complete all rounds without sprinting.'], cues:['Durability means repeatable output.','Do not turn every circuit into a death match.'], link:'https://www.youtube.com/results?search_query=bodyweight+conditioning+circuit+form' },
  'Breathing Reset': { category:'Recovery / Nervous System', steps:['Lie on your back with feet elevated.','Breathe through nose if possible.','Long slow exhale.','Let ribs drop down.'], cues:['This should calm you down.','Great after conditioning or before sleep.'], link:'https://www.youtube.com/results?search_query=90+90+breathing+feet+elevated' },
  'Spine Decompression': { category:'Mobility / Back', steps:['Use child’s pose breathing.','Move into couch stretch.','Add hamstring flossing.','Finish with open books.'], cues:['Gentle range only.','Do not yank on tight tissue.'], link:'https://www.youtube.com/results?search_query=childs+pose+couch+stretch+hamstring+floss+open+book' },
  'Posture Repair': { category:'Posture / Shoulders', steps:['Wall slides with ribs down.','Scapular pushups without bending elbows much.','Chin tucks slow and controlled.'], cues:['Keep shoulders away from ears.','Think tall spine.'], link:'https://www.youtube.com/results?search_query=wall+slide+scapular+pushup+chin+tuck' },
  'Easy Walk': { category:'Recovery', steps:['Walk 20-30 minutes.','Keep pace comfortable.','Let arms swing naturally.'], cues:['This is active recovery.','You should finish better than you started.'], link:'https://www.youtube.com/results?search_query=walking+active+recovery' },
  'Hybrid Bodyweight Circuit': { category:'Hybrid Strength / Conditioning', steps:['Complete pushups, squats, lunges, plank.','Rest between rounds if form breaks.','Keep breathing controlled.'], cues:['Clean reps only.','Never sacrifice back position for speed.'], link:'https://www.youtube.com/results?search_query=bodyweight+hybrid+circuit+pushup+squat+lunge+plank' },
  'Pull-Up Bonus': { category:'Pull Strength', steps:['Start from a dead hang or controlled active hang.','Pull chest toward bar.','Lower under control.','Leave reps in reserve.'], cues:['No wild kipping.','Keep shoulders controlled.'], link:'https://www.youtube.com/results?search_query=strict+pull+up+form' },
  'Recovery Protocol': { category:'Recovery / Mobility', steps:['Hip flexor stretch.','Thoracic rotations.','Gentle neck reset.','Slow breathing to finish.'], cues:['Recovery is part of leveling.','No aggressive stretching.'], link:'https://www.youtube.com/results?search_query=hip+flexor+thoracic+rotation+neck+mobility' },
  'Penalty Quest: Restoration': { category:'Penalty / Recovery', steps:['10 minutes easy mobility.','Short wall sit.','Dead bugs and bird dogs.','Finish with easy breathing.'], cues:['Penalty is consistency repair, not self-destruction.'], link:'https://www.youtube.com/results?search_query=mobility+dead+bug+bird+dog+wall+sit' }
};
const baseState = {
  level: 1,
  xp: 0,
  streak: 0,
  missed: 0,
  stats: { str: 1, end: 1, agi: 1, vit: 1, rec: 1 },
  title: 'Exhausted Survivor',
  rank: 'E-RANK',
  dayType: 'Awaiting Input',
  quests: [],
  log: ['SYSTEM initialized. Awaiting Hunter input.']
};
let state = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || baseState;
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); render(); }
function nextXp(){ return 250 + (state.level - 1) * 125; }
function addLog(msg){ state.log.unshift(`${new Date().toLocaleString()}: ${msg}`); state.log = state.log.slice(0, 30); }
function getInputs(){ return { fatigue: Number($('fatigue').value), sleep: Number($('sleep').value), backPain: Number($('backPain').value), neckPain: Number($('neckPain').value) }; }
function showOverlay(title, body, eyebrow='SYSTEM ALERT'){
  if(!$('systemOverlay')) return;
  $('overlayEyebrow').textContent = eyebrow;
  $('overlayTitle').textContent = title;
  $('overlayBody').textContent = body;
  $('systemOverlay').classList.remove('hidden');
}
function openCodex(name){
  const entry = CODEX[name];
  if(!entry){ showOverlay('ARCHIVE LOCKED', 'No Codex entry has been logged for this objective yet.', 'HUNTER ARCHIVE'); return; }
  $('codexTitle').textContent = name;
  $('codexBody').innerHTML = `<h4>${entry.category}</h4><h4>Steps</h4><ul>${entry.steps.map(s=>`<li>${s}</li>`).join('')}</ul><h4>System Cues</h4><ul>${entry.cues.map(c=>`<li>${c}</li>`).join('')}</ul><h4>External Reference</h4><p><a href="${entry.link}" target="_blank" rel="noopener">Open video search</a></p>`;
  $('codexOverlay').classList.remove('hidden');
}
function generateQuest(){
  const i = getInputs();
  const recoveryMode = i.fatigue >= 4 || i.sleep <= 2 || i.backPain >= 3 || i.neckPain >= 3;
  const day = state.streak % 6;
  let quests = [];
  let dayType = recoveryMode ? 'Recovery Gate' : ['Strength','Endurance','Mobility','Strength','Conditioning','Hybrid'][day];
  quests.push({ name:'Mobility Sequence', detail:'Cat-cow x8, thoracic rotations x8/side, hip flexor stretch 45 sec/side.', done:false });
  if(recoveryMode){
    quests.push({ name:'Core Stabilization', detail:'Dead bug 3x8/side, glute bridge 3x12, bird dog 3x8/side.', done:false });
    quests.push({ name:'Neck Recovery Protocol', detail:'Chin tucks 3x8, gentle rotations x8/side, scapular retractions 3x12.', done:false });
    quests.push({ name:'Zone 2 Walk', detail:'20-30 min easy walk. Nose breathing if possible.', done:false });
  } else if(dayType === 'Strength'){
    quests.push({ name:'Push Progression', detail:`Pushups ${Math.min(5 + state.level, 10)} sets of 8-15. Stop 2 reps before failure.`, done:false });
    quests.push({ name:'Leg Foundation', detail:'Air squats 4x15, reverse lunges 3x8/side, calf raises 3x20.', done:false });
    quests.push({ name:'Core Armor', detail:'Plank 3x35-60 sec, dead bug 3x8/side, hollow hold 3x15-25 sec.', done:false });
  } else if(dayType === 'Endurance' || dayType === 'Conditioning'){
    quests.push({ name:'Run-Walk Conditioning', detail:'5 min warmup, then 8 rounds: 60 sec jog + 90 sec walk.', done:false });
    quests.push({ name:'Durability Circuit', detail:'3 rounds: 12 squats, 8 pushups, 20 mountain climbers.', done:false });
    quests.push({ name:'Breathing Reset', detail:'3 minutes nasal breathing while lying on back with feet elevated.', done:false });
  } else if(dayType === 'Mobility'){
    quests.push({ name:'Spine Decompression', detail:'Child’s pose breathing, couch stretch, hamstring flossing, open books.', done:false });
    quests.push({ name:'Posture Repair', detail:'Wall slides 3x8, scapular pushups 3x10, chin tucks 3x8.', done:false });
    quests.push({ name:'Easy Walk', detail:'20-30 min easy walk. No max effort today.', done:false });
  } else {
    quests.push({ name:'Hybrid Bodyweight Circuit', detail:'4 rounds: 10 pushups, 15 squats, 8 lunges/side, 30 sec plank.', done:false });
    quests.push({ name:'Pull-Up Bonus', detail:'If a bar is available: 5 sets of 4-6 pullups, clean reps only.', done:false });
    quests.push({ name:'Recovery Protocol', detail:'Hip flexor stretch, thoracic rotations, neck reset, 5-8 minutes.', done:false });
  }
  state.quests = quests; state.dayType = dayType; addLog(`Daily Quest generated: ${dayType}.`); showOverlay('Daily Quest Generated', 'New hunter objectives are available.'); save();
}
function toggleQuest(index){ state.quests[index].done = !state.quests[index].done; addLog(`${state.quests[index].done ? 'Objective complete' : 'Objective reopened'}: ${state.quests[index].name}.`); save(); }
function completeDay(){
  if(!state.quests.length) generateQuest();
  const completed = state.quests.filter(q => q.done).length; const total = state.quests.length;
  if(completed === 0){ showOverlay('SYSTEM WARNING', 'No objectives completed. Check off at least one quest objective first.'); return; }
  const full = completed === total; const gain = completed * 45 + (full ? 80 : 0);
  state.xp += gain; if(full) state.streak += 1; state.stats.vit += 1;
  if(state.dayType.includes('Strength') || state.dayType.includes('Hybrid')) state.stats.str += 1;
  if(state.dayType.includes('Endurance') || state.dayType.includes('Conditioning')) state.stats.end += 1;
  if(state.dayType.includes('Mobility')) state.stats.agi += 1;
  if(state.dayType.includes('Recovery') || state.dayType.includes('Gate')) state.stats.rec += 1;
  while(state.xp >= nextXp()){ state.xp -= nextXp(); state.level += 1; showOverlay('LEVEL UP', `Hunter level increased to ${state.level}.`, 'RANK UP'); }
  addLog(`${full ? 'Daily Quest complete' : 'Partial quest submitted'}. +${gain} XP.`);
  if(full) state.quests = state.quests.map(q => ({...q, locked:true})); save();
}
function missDay(){
  state.streak = 0; state.missed += 1; state.xp = Math.max(0, state.xp - 35); state.dayType = 'Penalty Active';
  state.quests = [{ name:'Penalty Quest: Restoration', detail:'10 min mobility reset, wall sit, dead bugs, bird dogs, easy breathing.', done:false },{ name:'System Warning', detail:'No ego lifting tomorrow. Rebuild consistency.', done:false }];
  addLog('Penalty Quest activated. Streak reset. -35 XP.'); showOverlay('PENALTY QUEST', 'Hunter consistency failure detected.', 'SYSTEM WARNING'); save();
}
function render(){
  $('level').textContent = state.level; $('xp').textContent = state.xp; $('nextXp').textContent = nextXp(); $('xpFill').style.width = `${Math.min(100, (state.xp / nextXp()) * 100)}%`; $('streak').textContent = state.streak; $('rank').textContent = state.level >= 14 ? 'C-RANK' : state.level >= 7 ? 'D-RANK' : 'E-RANK'; $('title').textContent = state.title; $('dayType').textContent = state.dayType;
  $('str').textContent = state.stats.str; $('end').textContent = state.stats.end; $('agi').textContent = state.stats.agi; $('vit').textContent = state.stats.vit; $('rec').textContent = state.stats.rec;
  const i = getInputs(); $('fatigueStatus').textContent = i.fatigue >= 4 ? 'High' : i.fatigue <= 2 ? 'Ready' : 'Stable'; $('painStatus').textContent = (i.backPain >= 3 || i.neckPain >= 3) ? 'Red' : (i.backPain >= 2 || i.neckPain >= 2) ? 'Yellow' : 'Green';
  const completed = state.quests.filter(q => q.done).length; const total = state.quests.length;
  $('questProgressText').textContent = `${completed}/${total} objectives complete`; $('questProgressFill').style.width = `${total ? (completed / total) * 100 : 0}%`;
  $('questList').innerHTML = state.quests.length ? state.quests.map((q,i) => `<div class="quest ${q.done ? 'done' : ''}"><input type="checkbox" ${q.done ? 'checked' : ''} ${q.locked ? 'disabled' : ''} onchange="toggleQuest(${i})"><div><strong>${q.name}</strong><small>${q.detail}</small><div class="quest-actions"><button onclick="openCodex('${q.name.replace(/'/g,"\\'")}')">How-To</button></div></div></div>`).join('') : `<div class="quest"><div></div><div><strong>No quest generated.</strong><small>Complete the Daily Status Check to receive orders.</small></div></div>`;
  if($('achievementList')) $('achievementList').innerHTML = `<div class="achievement"><strong>Codex Awakened</strong><small>Exercise how-to guides are now active.</small></div>`;
  if($('codexList')) $('codexList').innerHTML = Object.keys(CODEX).map(name => `<div class="codex-card"><strong>${name}</strong><small>${CODEX[name].category}</small><div class="quest-actions"><button onclick="openCodex('${name.replace(/'/g,"\\'")}')">Open Archive</button></div></div>`).join('');
  $('penaltyText').textContent = state.dayType === 'Penalty Active' ? 'Penalty active. Complete restoration quest to stabilize the system.' : 'No penalty active. Maintain your streak, Hunter.';
  $('log').innerHTML = state.log.map(item => `<p>${item}</p>`).join('');
}
window.toggleQuest = toggleQuest; window.openCodex = openCodex;
$('generateQuest').addEventListener('click', generateQuest); $('completeDay').addEventListener('click', completeDay); $('missDay').addEventListener('click', missDay);
if($('overlayClose')) $('overlayClose').addEventListener('click', () => $('systemOverlay').classList.add('hidden'));
if($('codexClose')) $('codexClose').addEventListener('click', () => $('codexOverlay').classList.add('hidden'));
['fatigue','sleep','backPain','neckPain'].forEach(id => $(id).addEventListener('change', render));
document.querySelectorAll('.bottom-nav button').forEach(btn => btn.addEventListener('click', () => { const target = document.querySelector(`[data-section="${btn.dataset.scroll}"]`); if(target) target.scrollIntoView({behavior:'smooth', block:'start'}); document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }));
if(!state.quests.length) generateQuest(); render();