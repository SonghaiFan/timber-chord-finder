
import { RootNote, ChordType, TuningDefinition } from './types';

export const COLORS = {
  walnut: '#2a1b12',
  walnutDeep: '#1a110b',
  maple: '#e6c190',
  cherry: '#8b4513',
  oak: '#c29b6d',
  brass: '#b5892f',
  pearl: '#f4f1ea',
};

export const ROOTS: RootNote[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const TUNINGS: TuningDefinition[] = [
  { name: 'Standard', offsets: [4, 9, 2, 7, 11, 4] },
  { name: 'Drop D', offsets: [2, 9, 2, 7, 11, 4] },
  { name: 'Double Drop D', offsets: [2, 9, 2, 7, 11, 2] },
  { name: 'DADGAD', offsets: [2, 9, 2, 7, 9, 2] },
  { name: 'Open D', offsets: [2, 9, 6, 9, 9, 2] },
  { name: 'Open G', offsets: [2, 7, 2, 7, 11, 2] },
  { name: 'Open E', offsets: [4, 11, 4, 8, 11, 4] },
];

export const CAPO_POSITIONS = Array.from({ length: 13 }, (_, i) => i); // 0 to 12

// Format: [id, intervals, name, formula, suffix, symbol, aliases]
// Cleaned up from provided code (replacing &flat; with b, etc.)
export const CHORD_TYPES_DATA: any[] = [
  ['major', [0, 4, 7], 'Major', '1 - 3 - 5', 'maj', 'M', ''],
  ['minor', [0, 3, 7], 'Minor', '1 - b3 - 5', 'min', 'm', ''],
  ['5th', [0, 7], '5th', '1 - 5', '5', '', 'power chord'],
  ['suspended-2nd', [0, 2, 7], 'Suspended 2nd', '1 - 2 - 5', 'sus2', '', ''],
  ['suspended-4th', [0, 5, 7], 'Suspended 4th', '1 - 4 - 5', 'sus4', 'sus', 'Suspended'],
  ['7th', [0, 4, 7, 10], '7th', '1 - 3 - 5 - b7', '7', '', 'Dominant 7th, Major Minor 7th'],
  ['major-7th', [0, 4, 7, 11], 'Major 7th', '1 - 3 - 5 - 7', 'maj7', 'M7', ''],
  ['minor-7th', [0, 3, 7, 10], 'Minor 7th', '1 - b3 - 5 - b7', 'm7', 'min7', ''],
  ['7th-flat-5', [0, 4, 6, 10], '7th Flat 5', '1 - 3 - b5 - b7', '7b5', '', 'Dominant 7th Flat 5'],
  ['7th-sharp-5', [0, 4, 8, 10], '7th Sharp 5', '1 - 3 - #5 - b7', '7#5', '', 'Dominant 7th #5'],
  ['minor-7th-flat-5th', [0, 3, 6, 10], 'Minor 7th Flat 5th', '1 - b3 - b5 - b7', 'm7b5', '', 'Half Diminished'],
  ['minor-major-7th', [0, 3, 7, 11], 'Minor Major 7th', '1 - b3 - 5 - 7', 'minmaj7', 'mM7', 'Minor #7'],
  ['7th-suspended-4th', [0, 5, 7, 10], '7th Suspended 4th', '1 - 4 - 5 - b7', '7sus4', '', 'Dominant 7th Suspended 4th'],
  ['6th', [0, 4, 7, 9], '6th', '1 - 3 - 5 - 6', '6', '', ''],
  ['minor-6th', [0, 3, 7, 9], 'Minor 6th', '1 - b3 - 5 - 6', 'min6', 'm6', 'Minor Major 6'],
  ['6th-add-9', [0, 4, 7, 9, 2], '6th Add 9', '1 - 3 - 5 - 6 - 9', '6add9', '6/9', ''],
  ['9th', [0, 4, 7, 10, 2], '9th', '1 - 3 - 5 - b7 - 9', '9', '', ''],
  ['major-9th', [0, 4, 7, 11, 2], 'Major 9th', '1 - 3 - 5 - 7 - 9', 'maj9', '', ''],
  ['minor-9th', [0, 3, 7, 10, 2], 'Minor 9th', '1 - b3 - 5 - b7 - 9', 'm9', '', ''],
  ['minor-major-9th', [0, 3, 7, 11, 2], 'Minor Major 9th', '1 - b3 - 5 - 7 - 9', 'minmaj9', 'mM9', ''],
  ['add-9', [0, 4, 7, 2], 'Add 9', '1 - 3 - 5 - 9', 'add9', '', 'Add 9th'],
  ['minor-add-9', [0, 3, 7, 2], 'Minor Add 9', '1 - b3 - 5 - 9', 'm add9', '', 'minor Add 9th'],
  ['11th', [0, 4, 7, 10, 2, 5], '11th', '1 - 3 - 5 - b7 - 9 - 11', '11', '', ''],
  ['major-11th', [0, 4, 7, 11, 2, 5], 'Major 11th', '1 - 3 - 5 - 7 - 9 - 11', 'maj11', 'M11', ''],
  ['minor-11th', [0, 3, 7, 10, 2, 5], 'Minor 11th', '1 - b3 - 5 - b7 - 9 - 11', 'm11', 'min11', ''],
  ['diminished', [0, 3, 6], 'Diminished', '1 - b3 - b5', 'dim', '°', ''],
  ['diminished-7th', [0, 3, 6, 9], 'Diminished 7th', '1 - b3 - b5 - bb7', 'dim7', '°7', ''],
  ['diminished-major-7th', [0, 3, 6, 11], 'Diminished Major 7th', '1 - b3 - b5 - 7', 'dimM7', '°M7', ''],
  ['augmented', [0, 4, 8], 'Augmented', '1 - 3 - #5', 'aug', '+', ''],
  ['augmented-major-7th', [0, 4, 8, 11], 'Augmented Major 7th', '1 - 3 - #5 - 7', 'augM7', '+M7', '']
];

export const CHORD_TYPES: ChordType[] = CHORD_TYPES_DATA.map(c => ({
  id: c[0],
  intervals: c[1],
  name: c[2],
  formula: c[3],
  suffix: c[4],
  symbol: c[5],
  aliases: c[6]
}));
