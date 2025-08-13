let synth, bass, current = "minor";
let initialized = false;
let transportStarted = false;

export async function initAudio(Tone){
  if (initialized || !Tone) return;

  // Start AudioContext on user gesture (may noop if already running)
  try { if (typeof Tone.start === "function") await Tone.start(); } catch(e){ /* ignore */ }

  // Instruments
  const PolySynth = Tone.PolySynth || (Tone?.Synth && Tone?.PolySynth);
  const MonoSynth = Tone.MonoSynth || (Tone?.Synth && Tone?.MonoSynth);

  synth = new PolySynth(Tone.Synth, {
    oscillator:{ type:"triangle" },
    envelope:{ attack:0.02, decay:0.2, sustain:0.2, release:0.6 }
  }).toDestination();

  bass = new MonoSynth({
    oscillator:{ type:"sawtooth" },
    filter: { Q: 2, type:"lowpass", rolloff:-12 },
    envelope:{ attack:0.03, decay:0.3, sustain:0.2, release:0.8 }
  }).toDestination();

  // Reverb if available
  if (Tone.Reverb){
    const reverb = new Tone.Reverb({ decay:2.4, wet:0.25 }).toDestination();
    synth.connect(reverb);
  }

  // Musical patterns (avoid using Tone.now to fix error across builds)
  const Pattern = Tone.Pattern || Tone.Sequence;
  const Loop = Tone.Loop;

  const notesMinor = ["A3","C4","D4","E4","G4","A4"];
  const notesMajor = ["C4","E4","G4","A4","B4","C5"];
  const pattern = new Pattern((time, note)=>{
    synth.triggerAttackRelease(note, "8n", time);
  }, notesMinor, "upDown");

  let bassPart;
  if (Loop){
    bassPart = new Loop((time)=>{
      bass.triggerAttackRelease(current==="minor" ? "A2" : "C3", "8n", time);
    }, "2n");
  }

  // Configure transport, but don't rely on Tone.now()
  if (Tone?.Transport){
    Tone.Transport.bpm.value = 78;
    // Start transport safely
    try {
      if (Tone.Transport.state !== "started") {
        Tone.Transport.start();
      }
      transportStarted = true;
    } catch(e){
      transportStarted = false; // will retry on next user interaction
    }
  }

  // Start parts
  pattern.start(0);
  if (bassPart?.start) bassPart.start(0.5);

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