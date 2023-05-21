export interface Clip {
  start: number;
  end: number;
}

export interface VideoInfo {
  path: string;
  duration: number;
}

export enum Editor {
  DaVinciResolve = 'DaVinci Resolve',
  FinalCutPro = 'Final Cut Pro',
  PremierePro = 'Premiere Pro',
}

export interface Segment extends Clip {
  segmentId: number;
  text: string;
}

export type Transcription = Segment[];

export type Transcriber = (
  path: string,
  lang: string
) => Promise<Transcription>;

export interface ProjectConfig {
  name: string;
  dir: string;
  filePath: string;
  fileDuration: number;
  clips: Clip[];
  transcription: Transcription;
}

export const createEmptyProjectConfig = (): ProjectConfig => ({
  name: '',
  dir: '',
  filePath: '',
  fileDuration: 0,
  clips: [],
  transcription: [],
});
