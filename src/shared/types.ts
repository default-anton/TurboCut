export interface VideoInfo {
  path: string;
  duration: number;
}

export enum Editor {
  DaVinciResolve = 'DaVinci Resolve',
  FinalCutPro = 'Final Cut Pro',
  PremierePro = 'Premiere Pro',
}

export interface Clip {
  // start in seconds from the beginning of the source video
  start: number;
  // end in seconds from the beginning of the source video
  end: number;
}

export interface TranscriptionSegment extends Clip {
  idx: number;
  text: string;
}

export type Transcription = TranscriptionSegment[];

export type Transcriber = (
  path: string,
  lang: string
) => Promise<Transcription>;

export enum ProjectStep {
  SelectFile = 0,
  DetectSilence = 1,
  Transcribe = 2,
  Edit = 3,
}

export interface ProjectConfig {
  projectStep: ProjectStep;
  name: string;
  dir: string;
  filePath: string;
  fileDuration: number;
  clips: Clip[];
  silence: Clip[];
  speech: Clip[];
  transcription: Transcription;
}
