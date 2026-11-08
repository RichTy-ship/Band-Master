export interface SongSection {
  name: string;
  startTime: number;
  endTime: number;
  energy: number;
  description: string;
}

export type InstrumentType =
  | 'guitar'
  | 'drums'
  | 'bass'
  | 'synth'
  | 'trumpet'
  | 'violin';

export interface Note {
  time: number;
  column: number;
  duration?: number; // optional sustain tail length in seconds
  hit: boolean;
  missed: boolean;
}

export type HighwayMode = '3d' | '2d';
export type ScrollDirection = 'down' | 'up';

export interface GameplaySettings {
  instrument: InstrumentType;
  highwayMode: HighwayMode;
  scrollDirection: ScrollDirection;
  speedMultiplier: number;
  hitSoundEnabled: boolean;
  autoFever: boolean;
}

export interface GameResult {
  score: number;
  combo: number;
  maxCombo: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  feverActivations?: number;
  hitOffsets?: number[]; // in milliseconds (negative = early, positive = late)
  audioBlob?: Blob;
  beatmap?: Note[];
  trackTitle?: string;
  trackArtist?: string;
  difficulty?: string;
  bpm?: number;
  instrument?: InstrumentType;
}

export type DurationMode = 'quick' | 'full';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Style =
  | 'electronic'
  | 'rock'
  | 'pop'
  | 'hiphop'
  | 'jazz'
  | 'classical'
  | 'custom';

export type SmartGenreId =
  | 'rock_metal'
  | 'electronic_cyber'
  | 'jazz_swing'
  | 'pop_kpop'
  | 'classical_symphonic'
  | 'hiphop_funk';

export interface GenerationOptions {
  mode: DurationMode;
  style: string;
  theme: string;
  difficulty: Difficulty;
  instrument: InstrumentType;
  bpm?: number;
  genreId?: SmartGenreId;
  allowedInstruments?: InstrumentType[];
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

