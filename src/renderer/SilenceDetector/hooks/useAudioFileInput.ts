import {
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useCallback,
} from 'react';
import { message } from 'antd';
import { CREATE_OPTIMIZED_AUDIO_FILE } from 'renderer/messages';
import { useCreateOptimizedAudioFile } from './useCreateOptimizedAudioFile';

export function useAudioFileInput(resetIntervals: () => void): {
  inputFile: File | null;
  setInputFile: Dispatch<SetStateAction<File | null>>;
  stopLoading: () => void;
  isLoading: boolean;
  pathToAudioFile: string | null;
} {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { pathToOptimizedAudioFile } = useCreateOptimizedAudioFile(inputFile);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  useEffect(() => {
    if (!inputFile) return;

    setIsLoading(true);
    resetIntervals();
    message.open({
      key: CREATE_OPTIMIZED_AUDIO_FILE,
      type: 'loading',
      content: 'Creating optimized audio file...',
      duration: 0,
    });
  }, [inputFile, resetIntervals]);

  return {
    inputFile,
    setInputFile,
    stopLoading: stopLoading,
    isLoading,
    pathToAudioFile: pathToOptimizedAudioFile,
  };
}

export default useAudioFileInput;
