import { Dispatch, SetStateAction } from 'react';
import { Interval } from '../../../shared/types';

export function useSilenceDetection(
  inputFile: File | null,
  minSilenceLen: number,
  silenceThresh: number,
  padding: number,
  setIntervals: Dispatch<SetStateAction<Array<Interval>>>
) {
  return async () => {
    if (inputFile) {
      const silentIntervals = await window.electron.getSilentIntervals(
        inputFile.path,
        minSilenceLen,
        silenceThresh,
        padding
      );
      setIntervals(silentIntervals);
    }
  };
}

export default useSilenceDetection;
