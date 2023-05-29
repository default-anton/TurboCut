export interface VideoInfo {
  path: string;
  duration: number;
}

export enum Editor {
  DaVinciResolve = 'DaVinci Resolve',
  FinalCutPro = 'Final Cut Pro',
  PremierePro = 'Premiere Pro',
}

export enum TranscriptionBackend {
  OpenAIWhisper = "open_ai_whisper",
}

// TODO: replace start and end properties with sourceStart, sourceEnd, clipStart, clipEnd.
// TODO: rename Clip to SourceClip.
export interface Clip {
  // start in seconds from the beginning of the source video
  start: number;
  // end in seconds from the beginning of the source video
  end: number;
}

// TODO: replace start and end properties with sourceStart, sourceEnd, clipStart, clipEnd.
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

export class ApiKeyNotSetError extends Error {
  constructor(backend: TranscriptionBackend) {
    super(`API key for ${backend} not set`);
  }
}
