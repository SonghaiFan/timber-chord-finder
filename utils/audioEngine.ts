
/**
 * Simple Web Audio API based guitar synthesizer.
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Base MIDI notes for standard tuning strings (E2, A2, D3, G3, B3, E4)
const BASE_MIDI_NOTES = [40, 45, 50, 55, 59, 64];
const STANDARD_OFFSETS = [4, 9, 2, 7, 11, 4];

/**
 * Plays a single guitar note with a simple plucked string synthesis.
 */
export const playNote = (stringIdx: number, fret: number, tuningOffsets: number[], capo: number = 0) => {
  if (fret === -1) return;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Calculate MIDI note
  // We calculate the difference from standard tuning to adjust the base octave correctly.
  let diff = tuningOffsets[stringIdx] - STANDARD_OFFSETS[stringIdx];
  
  // Normalize diff to be within -6 to +6 range to keep it in the same octave as intended
  while (diff > 6) diff -= 12;
  while (diff < -6) diff += 12;

  const midiNote = BASE_MIDI_NOTES[stringIdx] + diff + capo + fret;
  const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

  const now = ctx.currentTime;
  
  // Create nodes
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Oscillator setup - Triangle wave gives a nice hollow, woody base
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  
  // Add a bit of frequency "pluck" (slight pitch drop at start)
  osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now);
  osc.frequency.exponentialRampToValueAtTime(freq, now + 0.05);

  // Filter setup - Lowpass to remove harshness and simulate body resonance
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(400, now + 1.0);
  filter.Q.setValueAtTime(5, now);

  // Gain envelope (Pluck)
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.005); // Fast attack
  gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5); // Long decay

  // Connections
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  // Start and Stop
  osc.start(now);
  osc.stop(now + 1.6);
};

/**
 * Plays a full chord with a slight strumming delay.
 */
export const playChord = (frets: number[], tuningOffsets: number[], capo: number = 0) => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Strumming: play strings from low to high with a small delay
  frets.forEach((fret, i) => {
    if (fret !== -1) {
      const delay = i * 0.04; // 40ms delay between strings
      setTimeout(() => {
        playNote(i, fret, tuningOffsets, capo);
      }, delay * 1000);
    }
  });
};
