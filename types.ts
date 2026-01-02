export interface ChordPosition {
  string: number; // 0-5 (0 is Low E)
  fret: number; // -1 for x (mute), 0 for open, >0 for fretted
  finger?: number; // Optional finger suggestion
}

export interface ChordDefinition {
  pos: ChordPosition[];
  formula: string;
}

export interface ChordType {
  id: string;
  intervals: number[];
  name: string;
  formula: string;
  suffix: string;
  symbol: string;
  aliases: string;
}

export type RootNote =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export interface ChordVariation {
  frets: number[]; // Array of 6 integers. -1 = mute, 0 = open
  baseFret: number; // The lowest fret number shown (for calculating relative position)
  cagedShape?: string; // 'C', 'A', 'G', 'E', 'D' or undefined
}

export interface TuningDefinition {
  name: string;
  offsets: number[]; // relative to standard EADGBE (0,0,0,0,0,0) or absolute MIDI? Let's use absolute relative to C0 or just pitch class?
  // Easier: Array of 6 integers representing the pitch of open strings relative to C=0 (e.g. E=4).
  // Standard: [4, 9, 2, 7, 11, 4]
}

export interface ScaleDefinition {
  id: string;
  name: string;
  intervals: number[];
}
