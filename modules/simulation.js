let state;
let logListeners = [];

export function onLog(fn){ logListeners.push(fn); }
function emitLog(msg){ logListeners.forEach(fn=>fn(msg)); }

export function initSim(saved){
  state = saved || {
    turn: 1,
    year: 1498,
    stability: -10, // negative minor, positive major
    standing: "Precarious",
    capital: 45,
    publicOpinion: 0,
    virtu: 55,
    fortuna: 35,
    factions: {
      medici: { name:"House Medici", trust: 45, power: 70, stance: "calculating", territory: 0.45 },
      papal:  { name:"Papal Envoys", trust: 50, power: 60, stance: "pious", territory: 0.30 },
      merc:   { name:"Condottieri", trust: 40, power: 55, stance: "opportunistic", territory: 0.25 },
    },
    mapBordersShift: 0
  };
}

export function getState(){ return state; }

export function applyCovertAction({ action, zone, faction }){
  const effects = {
    bribe: { capital:-8, trust:+6, public:+0, stability:+2, virtu:+2 },
    sabotage: { capital:-5, trust:-4, public:-3, stability:-1, virtu:+4 },
    rumor: { capital:-2, trust:-1, public:+4, stability:+1, virtu:+1 },
    spy: { capital:-3, trust:-2, public:+0, stability:+2, virtu:+3 },
  };
  const e = effects[action] || { capital:0, trust:0, public:0, stability:0, virtu:0 };
  state.capital += e.capital;
  state.publicOpinion += e.public;
  state.stability += e.stability;
  state.virtu += e.virtu;
  if (faction && state.factions[faction]){
    state.factions[faction].trust += e.trust;
  }else{
    // zone-based spread
    ["medici","papal","merc"].forEach(fid=>{
      state.factions[fid].trust += Math.round(e.trust/2);
    });
  }
  clampState();
  emitLog(`Covert ${action} executed ${faction?`against ${state.factions[faction].name}`:`in ${zone||"the city"}`}.`);
}

export async function nextTurn(){
  // Fortuna Event
  const fortune = Math.random();
  if (fortune > 0.7){
    const events = [
      { t:"Minor Uprising", s:-8, p:-6 },
      { t:"Papal Favor", s:+6, f:+8 },
      { t:"Merchant Windfall", c:+12, p:+4 },
      { t:"Mercenary Feud", s:-5, m:-6 },
      { t:"Quiet Skies", s:+3 }
    ];
    const ev = events[Math.floor(Math.random()*events.length)];
    if (ev.t === "Papal Favor") state.factions.papal.trust += 6;
    if (ev.t === "Mercenary Feud") state.factions.merc.trust -= 6;
    if (ev.c) state.capital += ev.c;
    if (ev.p) state.publicOpinion += ev.p;
    if (ev.f) state.fortuna += ev.f;
    if (ev.m) state.factions.merc.trust += ev.m;
    if (ev.s) state.stability += ev.s;
    emitLog(`Fortuna event: ${ev.t}.`);
  }

  // Autonomous agendas: trust drift based on publicOpinion and capital
  const pressure = (state.publicOpinion/50) + (state.capital-50)/100;
  for (const fid of ["medici","papal","merc"]){
    const f = state.factions[fid];
    const bias = fid==="papal" ? 0.5 : fid==="medici" ? 0.2 : -0.1;
    const drift = Math.round((pressure + bias + (Math.random()-0.5))*2);
    f.trust += drift;
    // territory shifts slightly with power and trust
    f.territory += (f.power/100 - 0.5)*0.003 + (f.trust-50)/100*0.002 + (Math.random()-0.5)*0.002;
    f.territory = Math.max(0.1, Math.min(0.7, f.territory));
  }

  // Standing recalculation
  state.stability += (state.publicOpinion/100) + Math.sign(state.capital-50);
  state.fortuna += (Math.random()-0.5)*6;
  state.virtu += (Math.random()-0.5)*2;

  clampState();

  state.turn += 1;
  state.year += Math.random()<0.3 ? 1 : 0;

  const avgTrust = (state.factions.medici.trust + state.factions.papal.trust + state.factions.merc.trust)/3;
  state.standing = avgTrust > 62 ? "Ascendant" : avgTrust < 38 ? "Imperiled" : "Precarious";

  // Borders pulse parameter for map anim
  state.mapBordersShift += 0.1;

  return state;
}

function clampState(){
  state.capital = clamp(state.capital, 0, 100);
  state.publicOpinion = clamp(state.publicOpinion, -50, 50);
  state.stability = clamp(state.stability, -30, 30);
  state.virtu = clamp(state.virtu, 0, 100);
  state.fortuna = clamp(state.fortuna, 0, 100);
  for (const fid of ["medici","papal","merc"]){
    state.factions[fid].trust = clamp(state.factions[fid].trust, 0, 100);
  }
}
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

