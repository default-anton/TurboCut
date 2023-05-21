import { useCallback } from 'react';
import { Clip } from '../../shared/types';
import { useProjectConfig } from './useProjectConfig';

export interface Settings {
  minSilenceLen: number;
  minNonSilenceLen: number;
  silenceThresh: number;
  padding: number;
}

export interface UseSilenceDetection {
  detectSilence: (
    settings: Settings
  ) => Promise<{ silentClips: Clip[]; nonSilentClips: Clip[] } | undefined>;
}

export function useSilenceDetection(): UseSilenceDetection {
  const { projectConfig: { filePath } = {} } = useProjectConfig();

  const detectSilence = useCallback(
    async ({
      minSilenceLen,
      silenceThresh,
      padding,
      minNonSilenceLen,
    }: Settings) => {
      if (!filePath) return;

      return window.electron.getSilentClips(
        filePath,
        minSilenceLen,
        silenceThresh,
        padding,
        minNonSilenceLen
      );
    },
    [filePath]
  );

  return {
    detectSilence,
  };
}

export default useSilenceDetection;
