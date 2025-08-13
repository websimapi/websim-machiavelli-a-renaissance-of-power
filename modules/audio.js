let synth, bass, current = "minor";
let initialized = false;

export async function initAudio(Tone){
  if (initialized) return;
  // Ensure audio context is started after a user gesture
  try { await Tone.start(); } catch(e){ /* ignore; will start on next gesture */ }

  const now = Tone.now();
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator:{ type:"triangle" },
    envelope:{ attack:0.02, decay:0.2, sustain:0.2, release:0.6 }
  }).toDestination();
  bass = new Tone.MonoSynth({
    oscillator:{ type:"sawtooth" },
    filter: { Q: 2, type:"lowpass", rolloff:-12 },
    envelope:{ attack:0.03, decay:0.3, sustain:0.2, release:0.8 }
  }).toDestination();

  Tone.Transport.bpm.value = 78;
  if (Tone.Transport.state !== "started") {
    Tone.Transport.start(now + 0.1);
  }

  const pattern = new Tone.Pattern((time, note)=>{
    synth.triggerAttackRelease(note, "8n", time);
  }, scale("minor"), "upDown");

  const bassPart = new Tone.Loop((time)=>{
    bass.triggerAttackRelease(current==="minor" ? "A2" : "C3", "8n", time);
  }, "2n");

  pattern.start(0);
  bassPart.start(0.5);

  // soft reverb
  const reverb = new Tone.Reverb({ decay:2.4, wet:0.25 }).toDestination();
  synth.connect(reverb);

  initialized = true;
}

export function setMode(mode){
  current = mode;
}

function scale(mode){
  return mode==="minor"
    ? ["A3","C4","D4","E4","G4","A4"]
    : ["C4","E4","G4","A4","B4","C5"];
}