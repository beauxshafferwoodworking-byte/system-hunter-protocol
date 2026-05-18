const STORE_KEY = 'system_hunter_protocol_v14';
const $ = id => document.getElementById(id);
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
function getInputs(){
  return {
    fatigue: Number($('fatigue').value),
    sleep: Number($('sleep').value),
    backPain: Number($('backPain').value),
    neckPain: Number($('neckPain').value)
  };
}
function showOverlay(title, body, eyebrow='SYSTEM ALERT'){
  if(!$('systemOverlay')) return;
  $('overlayEyebrow').textContent = eyebrow;
  $('overlayTitle').textContent = title;
  $('overlayBody').textContent = body;
  $('systemOverlay').classList.remove('hidden');
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
  state.quests = quests;
  state.dayType = dayType;
  addLog(`Daily Quest generated: ${dayType}.`);
  showOverlay('Daily Quest Generated', 'New hunter objectives are available.');
  save();
}
function toggleQuest(index){
  state.quests[index].done = !state.quests[index].done;
  addLog(`${state.quests[index].done ? 'Objective complete' : 'Objective reopened'}: ${state.quests[index].name}.`);
  save();
}
function completeDay(){
  if(!state.quests.length) generateQuest();
  const completed = state.quests.filter(q => q.done).length;
  const total = state.quests.length;
  if(completed === 0){ showOverlay('SYSTEM WARNING', 'No objectives completed. Check off at least one quest objective first.'); return; }
  const full = completed === total;
  const gain = completed * 45 + (full ? 80 : 0);
  state.xp += gain;
  if(full) state.streak += 1;
  state.stats.vit += 1;
  if(state.dayType.includes('Strength') || state.dayType.includes('Hybrid')) state.stats.str += 1;
  if(state.dayType.includes('Endurance') || state.dayType.includes('Conditioning')) state.stats.end += 1;
  if(state.dayType.includes('Mobility')) state.stats.agi += 1;
  if(state.dayType.includes('Recovery') || state.dayType.includes('Gate')) state.stats.rec += 1;
  while(state.xp >= nextXp()){
    state.xp -= nextXp();
    state.level += 1;
    showOverlay('LEVEL UP', `Hunter level increased to ${state.level}.`, 'RANK UP');
  }
  addLog(`${full ? 'Daily Quest complete' : 'Partial quest submitted'}. +${gain} XP.`);
  if(full) state.quests = state.quests.map(q => ({...q, locked:true}));
  save();
}
function missDay(){
  state.streak = 0;
  state.missed += 1;
  state.xp = Math.max(0, state.xp - 35);
  state.dayType = 'Penalty Active';
  state.quests = [
    { name:'Penalty Quest: Restoration', detail:'10 min mobility reset, wall sit, dead bugs, bird dogs, easy breathing.', done:false },
    { name:'System Warning', detail:'No ego lifting tomorrow. Rebuild consistency.', done:false }
  ];
  addLog('Penalty Quest activated. Streak reset. -35 XP.');
  showOverlay('PENALTY QUEST', 'Hunter consistency failure detected.', 'SYSTEM WARNING');
  save();
}
function render(){
  $('level').textContent = state.level;
  $('xp').textContent = state.xp;
  $('nextXp').textContent = nextXp();
  $('xpFill').style.width = `${Math.min(100, (state.xp / nextXp()) * 100)}%`;
  $('streak').textContent = state.streak;
  $('rank').textContent = state.level >= 14 ? 'C-RANK' : state.level >= 7 ? 'D-RANK' : 'E-RANK';
  $('title').textContent = state.title;
  $('dayType').textContent = state.dayType;
  $('str').textContent = state.stats.str; $('end').textContent = state.stats.end; $('agi').textContent = state.stats.agi; $('vit').textContent = state.stats.vit; $('rec').textContent = state.stats.rec;
  const i = getInputs();
  $('fatigueStatus').textContent = i.fatigue >= 4 ? 'High' : i.fatigue <= 2 ? 'Ready' : 'Stable';
  $('painStatus').textContent = (i.backPain >= 3 || i.neckPain >= 3) ? 'Red' : (i.backPain >= 2 || i.neckPain >= 2) ? 'Yellow' : 'Green';
  const completed = state.quests.filter(q => q.done).length;
  const total = state.quests.length;
  $('questProgressText').textContent = `${completed}/${total} objectives complete`;
  $('questProgressFill').style.width = `${total ? (completed / total) * 100 : 0}%`;
  $('questList').innerHTML = state.quests.length ? state.quests.map((q,i) => `
    <div class="quest ${q.done ? 'done' : ''}">
      <input type="checkbox" ${q.done ? 'checked' : ''} ${q.locked ? 'disabled' : ''} onchange="toggleQuest(${i})">
      <div><strong>${q.name}</strong><small>${q.detail}</small></div>
    </div>`).join('') : `<div class="quest"><div></div><div><strong>No quest generated.</strong><small>Complete the Daily Status Check to receive orders.</small></div></div>`;
  if($('achievementList')) $('achievementList').innerHTML = `<div class="achievement"><strong>First Interaction</strong><small>Quest checkboxes are now active.</small></div>`;
  if($('codexList')) $('codexList').innerHTML = `<div class="codex-card"><strong>Codex Pending</strong><small>How-to guides are staged for the next build.</small></div>`;
  $('penaltyText').textContent = state.dayType === 'Penalty Active' ? 'Penalty active. Complete restoration quest to stabilize the system.' : 'No penalty active. Maintain your streak, Hunter.';
  $('log').innerHTML = state.log.map(item => `<p>${item}</p>`).join('');
}
window.toggleQuest = toggleQuest;
$('generateQuest').addEventListener('click', generateQuest);
$('completeDay').addEventListener('click', completeDay);
$('missDay').addEventListener('click', missDay);
if($('overlayClose')) $('overlayClose').addEventListener('click', () => $('systemOverlay').classList.add('hidden'));
if($('codexClose')) $('codexClose').addEventListener('click', () => $('codexOverlay').classList.add('hidden'));
['fatigue','sleep','backPain','neckPain'].forEach(id => $(id).addEventListener('change', render));
document.querySelectorAll('.bottom-nav button').forEach(btn => btn.addEventListener('click', () => {
  const target = document.querySelector(`[data-section="${btn.dataset.scroll}"]`);
  if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}));
if(!state.quests.length) generateQuest();
render();