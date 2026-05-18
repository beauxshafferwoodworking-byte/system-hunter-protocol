const HISTORY_ACTIVE_SAVE_KEY = 'system_hunter_protocol_v16';
const HISTORY_PLAYER_SAVE_KEY = 'system_hunter_player_save';

function readHistorySave(){
  try{
    return JSON.parse(localStorage.getItem(HISTORY_ACTIVE_SAVE_KEY) || localStorage.getItem(HISTORY_PLAYER_SAVE_KEY) || 'null');
  }catch(error){
    console.warn('Unable to read history save.', error);
    return null;
  }
}

function formatHistoryDate(dateKey){
  if(!dateKey) return 'Unknown Date';
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
}

function renderHistory(){
  const save = readHistorySave();
  const list = document.getElementById('historyList');
  const count = document.getElementById('historyCount');
  if(!list) return;

  const history = Array.isArray(save?.history) ? save.history : [];
  if(count) count.textContent = `${history.length} ${history.length === 1 ? 'Entry' : 'Entries'}`;

  if(!history.length){
    list.innerHTML = `<div class="history-entry empty"><strong>No completed quests logged yet.</strong><small>Complete a Daily Quest to begin your Hunter record.</small></div>`;
    return;
  }

  list.innerHTML = history.slice(0, 14).map(entry => {
    const gateText = entry.gate ? `${entry.gate.cleared ? 'Gate Cleared' : 'Gate Detected'}: ${entry.gate.name}` : 'No Gate';
    const result = entry.result === 'full' ? 'Full Clear' : 'Partial Clear';
    const objectives = Array.isArray(entry.completedObjectives) ? entry.completedObjectives.slice(0, 3).join(', ') : 'Objectives logged';

    return `<div class="history-entry ${entry.gate ? 'gate-history' : ''}">
      <div class="history-head">
        <strong>${formatHistoryDate(entry.date)}</strong>
        <span>${result}</span>
      </div>
      <small>${entry.dayType || 'Daily Quest'} • ${entry.objectiveCount || 0}/${entry.totalObjectives || 0} objectives</small>
      <p>${objectives || 'No objectives recorded'}</p>
      <div class="history-meta">
        <span>LV ${entry.level || 1}</span>
        <span>Streak ${entry.streak || 0}</span>
        <span>${gateText}</span>
      </div>
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderHistory();
  document.querySelectorAll('.bottom-nav button[data-tab]').forEach(button => {
    button.addEventListener('click', () => setTimeout(renderHistory, 80));
  });
});
