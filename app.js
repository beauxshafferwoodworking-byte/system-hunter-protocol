const STORE_KEY = "system_hunter_protocol_v1";

const baseState = {
  level: 1,
  xp: 0,
  streak: 0,
  missed: 0,
  stats: { str: 1, end: 1, agi: 1, vit: 1, rec: 1 },
  title: "Exhausted Survivor",
  rank: "E-RANK",
  lastCompleted: null,
  currentQuest: [],
  dayType: "Awaiting Input",
  log: ["SYSTEM initialized. Awaiting Hunter input."]
};

let state = JSON.parse(localStorage.getItem(STORE_KEY) || "null") || baseState;
let deferredPrompt;

const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const nextXp = () => 250 + (state.level - 1) * 125;

function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); render(); }

function getInputs(){
  return {
    fatigue: Number($("fatigue").value),
    sleep: Number($("sleep").value),
    backPain: Number($("backPain").value),
    neckPain: Number($("neckPain").value)
  };
}

function rankForLevel(level){
  if(level >= 50) return "S-RANK";
  if(level >= 35) return "A-RANK";
  if(level >= 24) return "B-RANK";
  if(level >= 14) return "C-RANK";
  if(level >= 7) return "D-RANK";
  return "E-RANK";
}

function titleForState(){
  if(state.level >= 20) return "Awakened Hunter";
  if(state.stats.rec >= 10) return "Iron Spine";
  if(state.streak >= 21) return "System Disciple";
  if(state.streak >= 7) return "Persistent Survivor";
  return state.title || "Exhausted Survivor";
}

function addLog(msg){ state.log.unshift(`${new Date().toLocaleString()}: ${msg}`); state.log = state.log.slice(0,30); }

function generateQuest(){
  const i = getInputs();
  const recoveryMode = i.fatigue >= 4 || i.sleep <= 2 || i.backPain >= 3 || i.neckPain >= 3;
  const painFocus = i.backPain >= 2 || i.neckPain >= 2;
  const trainingDay = state.streak % 7;

  let quest = [];
  let dayType = recoveryMode ? "Recovery Gate" : ["Strength", "Endurance", "Mobility", "Strength", "Conditioning", "Hybrid", "Recovery"][trainingDay];

  quest.push({
    name: "Mobility Sequence",
    detail: "Cat-cow x8, world’s greatest stretch x5/side, thoracic rotations x8/side, hip flexor stretch 45 sec/side."
  });

  if(recoveryMode){
    quest.push({ name: "Core Stabilization", detail: "Dead bug 3x8/side, glute bridge 3x12, bird dog 3x8/side, side plank 2x20 sec/side." });
    quest.push({ name: "Neck Recovery Protocol", detail: "Chin tucks 3x8, gentle rotations x8/side, scapular retractions 3x12. No aggressive stretching." });
    quest.push({ name: "Zone 2 Walk", detail: "20-30 min easy walk. Nose breathing if possible. This is not a punishment run." });
  } else if(dayType === "Strength"){
    quest.push({ name: "Push Progression", detail: `Pushups ${Math.min(5 + state.level, 10)} sets of 8-15. Stop 2 reps before failure.` });
    quest.push({ name: "Leg Foundation", detail: "Air squats 4x15, reverse lunges 3x8/side, calf raises 3x20." });
    quest.push({ name: "Core Armor", detail: "Plank 3x35-60 sec, dead bug 3x8/side, hollow hold 3x15-25 sec." });
  } else if(dayType === "Endurance" || dayType === "Conditioning"){
    quest.push({ name: "Run-Walk Conditioning", detail: "5 min walk warmup, then 8 rounds: 60 sec jog + 90 sec walk. Cooldown 5 min." });
    quest.push({ name: "Durability Circuit", detail: "3 rounds: 12 squats, 8 pushups, 20 mountain climbers, 30 sec rest." });
    quest.push({ name: "Breathing Reset", detail: "3 minutes nasal breathing while lying on back with feet elevated." });
  } else if(dayType === "Mobility" || dayType === "Recovery"){
    quest.push({ name: "Spine Decompression", detail: "Child’s pose breathing, couch stretch, hamstring flossing, open books, 2 rounds." });
    quest.push({ name: "Posture Repair", detail: "Wall slides 3x8, scapular pushups 3x10, chin tucks 3x8." });
    quest.push({ name: "Easy Walk", detail: "20-30 min easy walk. No max effort today." });
  } else {
    quest.push({ name: "Hybrid Bodyweight Circuit", detail: "4 rounds: 10 pushups, 15 squats, 8 lunges/side, 30 sec plank, 60 sec walk." });
    quest.push({ name: "Pull-Up Bonus", detail: "If a bar is available: 5 sets of 4-6 pullups, clean reps only. Leave reps in reserve." });
    quest.push({ name: "Recovery Protocol", detail: "Hip flexor stretch, thoracic rotations, neck reset, 5-8 minutes." });
  }

  if(painFocus && !recoveryMode){
    quest.push({ name: "Pain Reduction Side Quest", detail: "McGill curl-up 2x6, side plank 2x20 sec/side, bird dog 2x6/side, chin tucks 2x8." });
  }

  state.currentQuest = quest;
  state.dayType = dayType;
  addLog(`Daily Quest generated: ${dayType}.`);
  save();
}

function completeDay(){
  if(!state.currentQuest.length) generateQuest();
  if(state.lastCompleted === today()){
    addLog("Daily Quest already completed today. No duplicate XP awarded.");
    save();
    return;
  }
  const i = getInputs();
  let xpGain = 120 + state.currentQuest.length * 20;
  if(i.fatigue <= 2 && i.sleep >= 4) xpGain += 25;
  if(i.backPain >= 3 || i.neckPain >= 3) xpGain += 15; // rewarded for doing the smart version
  state.xp += xpGain;
  state.streak += 1;
  state.lastCompleted = today();
  state.missed = 0;

  state.stats.str += state.dayType.includes("Strength") || state.dayType.includes("Hybrid") ? 1 : 0;
  state.stats.end += state.dayType.includes("Endurance") || state.dayType.includes("Conditioning") ? 1 : 0;
  state.stats.agi += state.dayType.includes("Mobility") ? 1 : 0;
  state.stats.vit += 1;
  state.stats.rec += (state.dayType.includes("Recovery") || i.backPain >= 2 || i.neckPain >= 2) ? 1 : 0;

  while(state.xp >= nextXp()){
    state.xp -= nextXp();
    state.level += 1;
    addLog(`RANK UP SEQUENCE: Level ${state.level} achieved.`);
  }

  state.rank = rankForLevel(state.level);
  state.title = titleForState();
  addLog(`Daily Quest complete. +${xpGain} XP.`);
  generateQuest();
}

function missDay(){
  state.streak = 0;
  state.missed += 1;
  state.xp = Math.max(0, state.xp - 35);
  state.currentQuest = [
    { name: "Penalty Quest: Restoration", detail: "10 min mobility reset, 2 rounds: 20 sec wall sit, 8 dead bugs/side, 8 bird dogs/side, 60 sec easy breathing." },
    { name: "System Warning", detail: "No ego lifting tomorrow. Rebuild consistency." }
  ];
  state.dayType = "Penalty Active";
  addLog("Penalty Quest activated. Streak reset. -35 XP.");
  save();
}

function render(){
  $("level").textContent = state.level;
  $("xp").textContent = state.xp;
  $("nextXp").textContent = nextXp();
  $("xpFill").style.width = `${Math.min(100, (state.xp / nextXp()) * 100)}%`;
  $("streak").textContent = state.streak;
  $("rank").textContent = state.rank;
  $("title").textContent = state.title;
  $("dayType").textContent = state.dayType;
  $("str").textContent = state.stats.str;
  $("end").textContent = state.stats.end;
  $("agi").textContent = state.stats.agi;
  $("vit").textContent = state.stats.vit;
  $("rec").textContent = state.stats.rec;

  const i = getInputs();
  $("fatigueStatus").textContent = i.fatigue >= 4 ? "High" : i.fatigue <= 2 ? "Ready" : "Stable";
  $("painStatus").textContent = (i.backPain >= 3 || i.neckPain >= 3) ? "Red" : (i.backPain >= 2 || i.neckPain >= 2) ? "Yellow" : "Green";

  $("questList").innerHTML = state.currentQuest.length ? state.currentQuest.map(q => `
    <div class="quest"><strong>${q.name}</strong><small>${q.detail}</small></div>
  `).join("") : `<div class="quest"><strong>No quest generated.</strong><small>Complete the Daily Status Check to receive orders.</small></div>`;

  $("penaltyText").textContent = state.dayType === "Penalty Active"
    ? "Penalty active. Complete restoration quest to stabilize the system."
    : "No penalty active. Maintain your streak, Hunter.";

  $("log").innerHTML = state.log.map(item => `<p>${item}</p>`).join("");
}

$("generateQuest").addEventListener("click", generateQuest);
$("completeDay").addEventListener("click", completeDay);
$("missDay").addEventListener("click", missDay);
["fatigue","sleep","backPain","neckPain"].forEach(id => $(id).addEventListener("change", render));

document.querySelectorAll(".bottom-nav button").forEach((btn, idx) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".panel")[idx]?.scrollIntoView({behavior:"smooth", block:"start"});
  });
});

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  $("installBtn").classList.remove("hidden");
});
$("installBtn").addEventListener("click", async () => {
  if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt = null; }
});

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js");
}

if(!state.currentQuest.length) generateQuest();
render();
