import { Dispatch, SetStateAction } from 'react';
import { message } from 'antd';
import { CREATE_OPTIMIZED_AUDIO_FILE } from 'renderer/messages';

export function useAudioFileInput(
  setInputFile: Dispatch<SetStateAction<File | null>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  setIntervals: Dispatch<SetStateAction<Array<any>>>
) {
  return (file: File) => {
    message.open({
      key: CREATE_OPTIMIZED_AUDIO_FILE,
      type: 'loading',
      content: 'Creating optimized audio file...',
      duration: 0,
    });

    setInputFile(file);
    setIsLoading(true);
    setIntervals([]);
  };
}

export default useAudioFileInput;
