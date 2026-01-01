// Note Map for converting Root Note strings to integers (0-11)
const NOTE_MAP: { [key: string]: number } = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

// Inverse map for display
const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const getNoteValue = (note: string): number => NOTE_MAP[note] ?? 0;

export const getNoteName = (val: number): string => NOTE_NAMES[val % 12];

/**
 * Generates guitar chord shapes based on root note and intervals.
 * Includes constraints for physical playability (span) and subset filtering.
 */
export function generateChords(
  rootVal: number,
  intervals: number[],
  tuning: number[], // Pitch of open strings relative to C=0
  capo: number = 0,
  bassNoteVal: number | null = null
): number[][] {
  const numStrings = 6;
  const maxFretSearch = 15; // Max fret to look for

  // 1. Prepare Targets
  const targetNotes = new Set(intervals.map((i) => (rootVal + i) % 12));
  if (bassNoteVal !== null) {
    targetNotes.add(bassNoteVal % 12);
  }
  const effectiveBass = bassNoteVal !== null ? bassNoteVal : rootVal;

  // Effective tuning at the nut (with capo)
  const nutTuning = tuning.map((t) => t + capo);

  // 2. Pre-calculate valid frets per string
  const validFretsPerString: number[][] = [];
  for (let s = 0; s < numStrings; s++) {
    const valid: number[] = [];

    // Mute (-1) is always an option
    valid.push(-1);

    // Open string (0) - represents the Capo fret (relative 0)
    // Check if open string note is in target
    if (targetNotes.has(nutTuning[s] % 12)) {
      valid.push(0);
    }

    // Frets 1..maxFretSearch
    for (let f = 1; f <= maxFretSearch; f++) {
      const note = (nutTuning[s] + f) % 12;
      if (targetNotes.has(note)) {
        valid.push(f);
      }
    }
    validFretsPerString.push(valid);
  }

  // 3. Recursive Search with Pruning
  const rawShapes: number[][] = [];

  function search(
    stringIdx: number,
    currentShape: number[],
    minFret: number,
    maxFret: number,
    hasOpen: boolean
  ) {
    if (stringIdx === numStrings) {
      rawShapes.push(currentShape);
      return;
    }

    // Get candidates for this string
    const candidates = validFretsPerString[stringIdx];

    for (const fret of candidates) {
      // --- PRUNING RULES ---

      // 1. Bass Note Check (on the first sounding string)
      const isFirstSounding =
        stringIdx === 0 || currentShape.every((x) => x === -1);

      if (fret !== -1 && isFirstSounding) {
        const note = (nutTuning[stringIdx] + fret) % 12;
        if (note !== effectiveBass) continue;
      }

      // 2. Physical / Ergonomic Checks
      let nextMin = minFret;
      let nextMax = maxFret;
      let nextHasOpen = hasOpen;

      if (fret > 0) {
        if (fret < nextMin) nextMin = fret;
        if (fret > nextMax) nextMax = fret;

        // Span Check
        // Allow standard box of 4 frets (span 3, e.g., 2,3,4,5).
        if (nextMax - nextMin > 3) continue;

        // Open String Compatibility
        // If we have open strings, we shouldn't be playing high up the neck.
        // Standard "Open Chords" usually stay within first 4-5 frets.
        if (nextHasOpen && nextMax > 4) continue;
      }

      if (fret === 0) nextHasOpen = true;

      // If we added an open string, and we already have high frets?
      if (fret === 0 && nextMax > 4 && nextMax !== -999) continue;

      search(
        stringIdx + 1,
        [...currentShape, fret],
        nextMin,
        nextMax,
        nextHasOpen
      );
    }
  }

  // Start search
  // minFret starts high, maxFret starts low
  search(0, [], 999, -999, false);

  // 4. Validation & Filtering
  let validChords = rawShapes.filter((shape) => {
    // Metric: Sounding Strings
    const sounding = shape.filter((x) => x !== -1);

    // Rule: Minimum strings (Standard 3, Power Chords 2)
    const minStrings = intervals.length <= 2 ? 2 : 3;
    if (sounding.length < minStrings) return false;

    // Rule: All target intervals must be present
    const presentNotes = new Set(
      shape
        .map((f, i) => (f === -1 ? -1 : (nutTuning[i] + f) % 12))
        .filter((x) => x !== -1)
    );

    for (const t of Array.from(targetNotes)) {
      if (!presentNotes.has(t)) return false;
    }

    return true;
  });

  // 5. Remove "Lesser" Chords (Subsets)
  // Logic: If chord A is a subset of chord B (same frets where A has notes, but B has more notes),
  // and B is valid, we prefer B and remove A.
  const toRemove = new Set<number>();
  for (let i = 0; i < validChords.length; i++) {
    if (toRemove.has(i)) continue;
    for (let j = 0; j < validChords.length; j++) {
      if (i === j) continue;
      if (toRemove.has(j)) continue;

      const A = validChords[i];
      const B = validChords[j];

      // Check if A is subset of B (B covers A)
      const isASubsetB = A.every((f, s) => f === -1 || f === B[s]);
      const isBSubsetA = B.every((f, s) => f === -1 || f === A[s]);

      if (isASubsetB && !isBSubsetA) {
        toRemove.add(i); // Remove A (Subset)
        break;
      }
    }
  }

  validChords = validChords.filter((_, i) => !toRemove.has(i));

  // 6. Sorting
  validChords.sort((a, b) => {
    // A. Position (Lowest fret used)
    const getMinFret = (s: number[]) => {
      const frets = s.filter((f) => f > 0);
      return frets.length ? Math.min(...frets) : 0;
    };
    const aMin = getMinFret(a);
    const bMin = getMinFret(b);
    if (aMin !== bMin) return aMin - bMin; // Ascending (Low pos first)

    // B. Number of Sounding Strings (Fuller first)
    const countA = a.filter((f) => f !== -1).length;
    const countB = b.filter((f) => f !== -1).length;
    if (countA !== countB) return countB - countA; // Descending

    // C. Compactness (Span)
    const getSpan = (s: number[]) => {
      const frets = s.filter((f) => f > 0);
      if (!frets.length) return 0;
      return Math.max(...frets) - Math.min(...frets);
    };
    if (getSpan(a) !== getSpan(b)) return getSpan(a) - getSpan(b);

    // D. Contiguity (Prefer no internal mutes aka No-Skip)
    const getMuteScore = (s: number[]) => {
      let first = s.findIndex((x) => x !== -1);
      let last = 5;
      while (last >= 0 && s[last] === -1) last--;

      if (first === -1) return 0;

      let mutes = 0;
      for (let i = first; i <= last; i++) {
        if (s[i] === -1) mutes++;
      }
      return mutes;
    };
    return getMuteScore(a) - getMuteScore(b);
  });

  return validChords;
}
