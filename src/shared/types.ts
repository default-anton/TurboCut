export type Interval = { start: number; end: number };
export type VideoInfo = { path: string; duration: number };
export enum Editor {
  DaVinciResolve = 'DaVinci Resolve',
  FinalCutPro = 'Final Cut Pro',
  PremierePro = 'Premiere Pro',
}

export interface Segment {
  text: string;
  start: number;
  end: number;
}

export type Transcriber = (path: string, lang: string) => Promise<Segment[]>;
