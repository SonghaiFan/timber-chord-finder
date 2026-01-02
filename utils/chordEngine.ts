import { ChordVariation } from "../types";

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

// CAGED System Patterns (Offsets relative to the root note on the anchor string)
// null indicates the string is not typically part of the core shape or is muted in the primary form
const CAGED_PATTERNS: {
  anchorString: number; // 0-based string index where the root is located
  name: string;
  offsets: (number | null)[]; // Offsets for strings 0-5
}[] = [
  {
    name: "E",
    anchorString: 0,
    offsets: [0, 2, 2, 1, 0, 0],
  },
  {
    name: "G",
    anchorString: 0,
    offsets: [0, -1, -3, -3, -3, 0],
  },
  {
    name: "A",
    anchorString: 1,
    offsets: [null, 0, 2, 2, 2, 0],
  },
  {
    name: "C",
    anchorString: 1,
    offsets: [null, 0, -1, -3, -2, -3],
  },
  {
    name: "D",
    anchorString: 2,
    offsets: [null, null, 0, 2, 3, 2],
  },
];

const STANDARD_TUNING = [4, 9, 2, 7, 11, 4];

function getCAGEDScore(
  shape: number[],
  rootVal: number,
  tuning: number[]
): number {
  // Check for Standard Tuning Intervals (5, 5, 5, 4, 5)
  // This works regardless of Capo or absolute pitch
  const intervals = [];
  for (let i = 0; i < 5; i++) {
    let diff = (tuning[i + 1] - tuning[i]) % 12;
    if (diff < 0) diff += 12;
    intervals.push(diff);
  }

  const isStandard =
    intervals[0] === 5 &&
    intervals[1] === 5 &&
    intervals[2] === 5 &&
    intervals[3] === 4 &&
    intervals[4] === 5;

  if (!isStandard) return 0;

  let maxScore = -Infinity;

  // Find all strings that hold the root note
  const rootIndices: number[] = [];
  shape.forEach((fret, stringIdx) => {
    if (fret !== -1) {
      const note = (tuning[stringIdx] + fret) % 12;
      if (note === rootVal) {
        rootIndices.push(stringIdx);
      }
    }
  });

  for (const rootStringIdx of rootIndices) {
    const rootFret = shape[rootStringIdx];

    // Check against all patterns that anchor on this string
    const applicablePatterns = CAGED_PATTERNS.filter(
      (p) => p.anchorString === rootStringIdx
    );

    for (const pattern of applicablePatterns) {
      let score = 0;
      let matches = 0;

      for (let s = 0; s < 6; s++) {
        const shapeFret = shape[s];
        const offset = pattern.offsets[s];

        if (offset === null) {
          // Pattern doesn't care about this string
          continue;
        }

        const expectedFret = rootFret + offset;

        if (shapeFret === expectedFret) {
          score += 2; // Strong match
          matches++;
        } else if (shapeFret !== -1) {
          // Shape has a note, but it doesn't match pattern
          score -= 1; // Penalty for deviation
        }
      }

      // Bonus for identifying the shape
      if (matches >= 3) {
        if (score > maxScore) maxScore = score;
      }
    }
  }

  return maxScore === -Infinity ? 0 : maxScore;
}

function identifyCAGEDShape(
  shape: number[],
  rootVal: number,
  tuning: number[]
): string | undefined {
  // Check for Standard Tuning Intervals
  const intervals = [];
  for (let i = 0; i < 5; i++) {
    let diff = (tuning[i + 1] - tuning[i]) % 12;
    if (diff < 0) diff += 12;
    intervals.push(diff);
  }

  const isStandard =
    intervals[0] === 5 &&
    intervals[1] === 5 &&
    intervals[2] === 5 &&
    intervals[3] === 4 &&
    intervals[4] === 5;

  if (!isStandard) return undefined;

  for (const pattern of CAGED_PATTERNS) {
    const anchorFret = shape[pattern.anchorString];

    // Anchor string must be played
    if (anchorFret === -1) continue;

    // Anchor note must be the root
    const noteAtAnchor = (tuning[pattern.anchorString] + anchorFret) % 12;
    if (noteAtAnchor !== rootVal) continue;

    let isMatch = true;
    for (let s = 0; s < 6; s++) {
      const shapeFret = shape[s];
      const offset = pattern.offsets[s];

      if (offset === null) {
        // Strict: Must be muted
        if (shapeFret !== -1) {
          isMatch = false;
          break;
        }
      } else {
        // Strict: Must match offset exactly
        if (shapeFret !== anchorFret + offset) {
          isMatch = false;
          break;
        }
      }
    }

    if (isMatch) return pattern.name;
  }

  return undefined;
}

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
): ChordVariation[] {
  const numStrings = 6;
  const maxFretSearch = 15; // Max fret to look for
  const maxPhysicalFret = 22; // Physical limit of the guitar neck

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

    // Calculate max relative fret allowed by physical neck length
    const effectiveMaxFret = Math.min(maxFretSearch, maxPhysicalFret - capo);

    // Frets 1..effectiveMaxFret
    for (let f = 1; f <= effectiveMaxFret; f++) {
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
    // Helper: Get Min Fret (Position)
    const getMinFret = (s: number[]) => {
      const frets = s.filter((f) => f > 0);
      return frets.length ? Math.min(...frets) : 0;
    };
    const aMin = getMinFret(a);
    const bMin = getMinFret(b);

    // Helper: Get Finger Count (Fretted notes > 0)
    const getFingerCount = (s: number[]) => s.filter((f) => f > 0).length;
    const fingersA = getFingerCount(a);
    const fingersB = getFingerCount(b);

    // Helper: Get Span
    const getSpan = (s: number[]) => {
      const frets = s.filter((f) => f > 0);
      if (!frets.length) return 0;
      return Math.max(...frets) - Math.min(...frets);
    };
    const spanA = getSpan(a);
    const spanB = getSpan(b);

    // 1. Root-Shape Match (The "Golden" Rule)
    // If Root is C, and Shape is C, this is the best.
    const shapeA = identifyCAGEDShape(a, rootVal, nutTuning);
    const shapeB = identifyCAGEDShape(b, rootVal, nutTuning);
    const rootName = getNoteName(rootVal).replace("#", ""); // Simple match for C, A, G, E, D

    const isRootMatchA = shapeA === rootName;
    const isRootMatchB = shapeB === rootName;

    if (isRootMatchA && !isRootMatchB) return -1;
    if (!isRootMatchA && isRootMatchB) return 1;

    // 2. Finger Count (Less nodes)
    if (fingersA !== fingersB) return fingersA - fingersB;

    // 3. Position (Lower fret)
    if (aMin !== bMin) return aMin - bMin;

    // 4. Span (Less fret cross)
    if (spanA !== spanB) return spanA - spanB;

    // 5. CAGED Score (Tie-breaker for quality of shape)
    const scoreA = getCAGEDScore(a, rootVal, nutTuning);
    const scoreB = getCAGEDScore(b, rootVal, nutTuning);
    if (scoreA !== scoreB) return scoreB - scoreA;

    // 6. Number of Sounding Strings (Fuller first)
    const countA = a.filter((f) => f !== -1).length;
    const countB = b.filter((f) => f !== -1).length;
    if (countA !== countB) return countB - countA;

    // 7. Contiguity
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

  return validChords.map((shape) => {
    const frets = shape.filter((f) => f > 0);
    const minFret = frets.length ? Math.min(...frets) : 0;
    // If minFret is > 0, we might want to show baseFret as minFret.
    // But usually baseFret is 1 unless we are high up.
    // Let's say if minFret > 2, baseFret = minFret.
    const baseFret = minFret > 2 ? minFret : 1;

    return {
      frets: shape,
      baseFret: baseFret,
      cagedShape: identifyCAGEDShape(shape, rootVal, nutTuning),
    };
  });
}
