const RECAP_ACTIVE_SAVE_KEY = 'system_hunter_protocol_v16';
const RECAP_PLAYER_SAVE_KEY = 'system_hunter_player_save';

function readRecapSave(){
  try{
    return JSON.parse(localStorage.getItem(RECAP_ACTIVE_SAVE_KEY) || localStorage.getItem(RECAP_PLAYER_SAVE_KEY) || 'null');
  }catch(error){
    console.warn('Unable to read recap save.', error);
    return null;
  }
}

function parseLocalDateKey(dateKey){
  if(!dateKey) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  if(!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getWeekStart(date = new Date()){
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return start;
}

function getWeeklyRank(clears, fullClears, gates){
  if(clears >= 7 && fullClears >= 6 && gates >= 1) return 'S-RANK WEEK';
  if(clears >= 6 && fullClears >= 4) return 'A-RANK WEEK';
  if(clears >= 4) return 'B-RANK WEEK';
  if(clears >= 2) return 'C-RANK WEEK';
  if(clears >= 1) return 'D-RANK WEEK';
  return 'NO DATA';
}

function getWeeklySummary(rank, clears, fullClears, gates){
  if(clears === 0) return 'No completed Daily Quests logged this week yet.';
  if(rank.startsWith('S')) return `Dominant week. ${clears}/7 days cleared, ${fullClears} full clears, and ${gates} Gate clear${gates === 1 ? '' : 's'}.`;
  if(rank.startsWith('A')) return `Strong week. ${clears}/7 days cleared with ${fullClears} full clear${fullClears === 1 ? '' : 's'}.`;
  if(rank.startsWith('B')) return `Solid momentum. ${clears}/7 days cleared. Keep pressure on the System.`;
  if(rank.startsWith('C')) return `Foundation maintained. ${clears}/7 days cleared this week.`;
  return `Hunter record started. ${clears}/7 days cleared this week.`;
}

function renderWeeklyRecap(){
  const save = readRecapSave();
  const history = Array.isArray(save?.history) ? save.history : [];
  const start = getWeekStart();
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const weekEntries = history.filter(entry => {
    const date = parseLocalDateKey(entry.date);
    return date && date >= start && date < end && entry.type === 'daily';
  });

  const clears = weekEntries.length;
  const fullClears = weekEntries.filter(entry => entry.result === 'full').length;
  const gates = weekEntries.filter(entry => entry.gate && entry.gate.cleared).length;
  const streak = save?.streak || 0;
  const rank = getWeeklyRank(clears, fullClears, gates);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  };

  setText('weeklyRank', rank);
  setText('weeklyClears', clears);
  setText('weeklyFullClears', fullClears);
  setText('weeklyGates', gates);
  setText('weeklyStreak', streak);
  setText('weeklySummary', getWeeklySummary(rank, clears, fullClears, gates));
}

document.addEventListener('DOMContentLoaded', () => {
  renderWeeklyRecap();
  document.querySelectorAll('.bottom-nav button[data-tab]').forEach(button => {
    button.addEventListener('click', () => setTimeout(renderWeeklyRecap, 80));
  });
});
