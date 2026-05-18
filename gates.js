const GATE_EVENTS = [
  {
    id: 'red_gate',
    name: 'Red Gate',
    type: 'Elite Strength Gate',
    chance: 0.05,
    bonusXp: 180,
    overlay: 'WARNING // RED GATE DETECTED',
    description: 'A dangerous combat-oriented gate has manifested. High output required.',
    modifier: quests => {
      quests.push({
        name: 'Red Gate Trial',
        detail: 'Complete 5 rounds: 12 pushups, 18 squats, 10 lunges/side, 45 sec plank.',
        done: false,
        gate: true
      });
      return quests;
    }
  },
  {
    id: 'endurance_trial',
    name: 'Endurance Trial',
    type: 'Conditioning Gate',
    chance: 0.08,
    bonusXp: 140,
    overlay: 'SPECIAL QUEST AVAILABLE',
    description: 'Extended conditioning challenge detected.',
    modifier: quests => {
      quests.push({
        name: 'Endurance Trial',
        detail: '12 rounds: 60 sec jog + 60 sec walk. Maintain sustainable pace.',
        done: false,
        gate: true
      });
      return quests;
    }
  },
  {
    id: 'recovery_protocol',
    name: 'Recovery Protocol',
    type: 'Recovery Gate',
    chance: 0.07,
    bonusXp: 110,
    overlay: 'SYSTEM RECOVERY OVERRIDE',
    description: 'Hunter strain levels elevated. Recovery-focused gate initiated.',
    modifier: quests => {
      quests.push({
        name: 'Recovery Gate Sequence',
        detail: '15 min mobility + breathing reset + neck recovery protocol.',
        done: false,
        gate: true
      });
      return quests;
    }
  }
];

function rollForGate(){
  const roll = Math.random();
  let cumulative = 0;

  for(const gate of GATE_EVENTS){
    cumulative += gate.chance;
    if(roll <= cumulative) return gate;
  }

  return null;
}

window.SYSTEM_GATES = {
  GATE_EVENTS,
  rollForGate
};
