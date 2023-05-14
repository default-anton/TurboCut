import { useCallback, useState } from 'react';
import { Clip } from '../../shared/types';

export interface Settings {
  minSilenceLen: number;
  minNonSilenceLen: number;
  silenceThresh: number;
  padding: number;
}

export interface UseSilenceDetection {
  silentClips: Array<Clip>;
  nonSilentClips: Array<Clip>;
  detectSilence: (settings: Settings) => Promise<void>;
}

export function useSilenceDetection(
  inputFile: File | null
): UseSilenceDetection {
  const [silentClips, setSilentClips] = useState<Array<Clip>>([]);
  const [nonSilentClips, setNonSilentClips] = useState<Array<Clip>>([]);

  const detectSilence = useCallback(
    async ({
      minSilenceLen,
      silenceThresh,
      padding,
      minNonSilenceLen,
    }: Settings) => {
      if (!inputFile) return;

      const { silentClips: sc, nonSilentClips: nsc } =
        await window.electron.getSilentClips(
          inputFile.path,
          minSilenceLen,
          silenceThresh,
          padding,
          minNonSilenceLen
        );

      setSilentClips(sc);
      setNonSilentClips(nsc);
    },
    [inputFile]
  );

  return {
    silentClips,
    nonSilentClips,
    detectSilence,
  };
}

export default useSilenceDetection;
