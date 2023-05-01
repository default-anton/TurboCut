import { Dispatch, SetStateAction } from 'react';

export function useAudioFileInput(
  setInputFile: Dispatch<SetStateAction<File | null>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  setIntervals: Dispatch<SetStateAction<Array<any>>>
) {
  return (file: File) => {
    setInputFile(file);
    setIsLoading(true);
    setIntervals([]);
  };
}

export default useAudioFileInput;
