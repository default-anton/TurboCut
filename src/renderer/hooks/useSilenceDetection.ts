import { useCallback, useState } from 'react';
import { Clip } from '../../shared/types';
import { useProjectConfig } from './useProjectConfig';

export interface Settings {
  minSilenceLen: number;
  minNonSilenceLen: number;
  silenceThresh: number;
  padding: number;
}

export interface UseSilenceDetection {
  silentClips: Array<Clip>;
  detectSilence: (settings: Settings) => Promise<void>;
}

export function useSilenceDetection(): UseSilenceDetection {
  const { updateClips, projectConfig: { filePath } = {} } = useProjectConfig();
  const [silentClips, setSilentClips] = useState<Array<Clip>>([]);

  const detectSilence = useCallback(
    async ({
      minSilenceLen,
      silenceThresh,
      padding,
      minNonSilenceLen,
    }: Settings) => {
      if (!filePath) return;

      const { silentClips: sc, nonSilentClips: nsc } =
        await window.electron.getSilentClips(
          filePath,
          minSilenceLen,
          silenceThresh,
          padding,
          minNonSilenceLen
        );

      setSilentClips(sc);
      await updateClips(nsc);
    },
    [filePath, updateClips]
  );

  return {
    silentClips,
    detectSilence,
  };
}

export default useSilenceDetection;
