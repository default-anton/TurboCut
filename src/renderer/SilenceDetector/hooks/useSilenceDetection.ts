import { Dispatch, SetStateAction } from 'react';
import { Interval } from '../../../shared/types';

export function useSilenceDetection(
  inputFile: File | null,
  minSilenceLen: number,
  minNonSilenceLen: number,
  silenceThresh: number,
  padding: number,
  setIntervals: Dispatch<SetStateAction<Array<Interval>>>,
  before: () => void,
  after: () => void
) {
  return async () => {
    if (inputFile) {
      before();
      const silentIntervals = await window.electron.getSilentIntervals(
        inputFile.path,
        minSilenceLen,
        silenceThresh,
        padding,
        minNonSilenceLen
      );
      setIntervals(silentIntervals);
      after();
    }
  };
}

export default useSilenceDetection;
