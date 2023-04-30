import React, { Dispatch, SetStateAction } from 'react';

export function useAudioFileInput(
  setInputFile: Dispatch<SetStateAction<File | null>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  setIntervals: Dispatch<SetStateAction<Array<any>>>
) {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setInputFile(file);
      setIsLoading(true);
      setIntervals([]);
    }
  };
}

export default useAudioFileInput;
