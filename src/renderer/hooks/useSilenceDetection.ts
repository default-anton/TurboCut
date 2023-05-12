import { useCallback, useState } from 'react';
import { Interval } from '../../shared/types';

export interface Settings {
  minSilenceLen: number;
  minNonSilenceLen: number;
  silenceThresh: number;
  padding: number;
}

export interface UseSilenceDetection {
  silentIntervals: Array<Interval>;
  detectSilence: (settings: Settings) => Promise<void>;
}

export function useSilenceDetection(
  inputFile: File | null
): UseSilenceDetection {
  const [silentIntervals, setSilentIntervals] = useState<Array<Interval>>([]);

  const detectSilence = useCallback(
    async ({
      minSilenceLen,
      silenceThresh,
      padding,
      minNonSilenceLen,
    }: Settings) => {
      if (!inputFile) return;

      const intervals = await window.electron.getSilentIntervals(
        inputFile.path,
        minSilenceLen,
        silenceThresh,
        padding,
        minNonSilenceLen
      );

      setSilentIntervals(intervals);
    },
    [inputFile]
  );

  return {
    silentIntervals,
    detectSilence,
  };
}

export default useSilenceDetection;
