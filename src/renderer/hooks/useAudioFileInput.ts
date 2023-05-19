import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { CREATE_OPTIMIZED_AUDIO_FILE } from 'renderer/messages';
import { useCreateOptimizedAudioFile } from './useCreateOptimizedAudioFile';
import { useProjectConfig } from './useProjectConfig';

export function useAudioFileInput(): {
  stopLoading: () => void;
  isLoading: boolean;
  pathToAudioFile: string | null;
} {
  const { projectConfig: { filePath } = {} } = useProjectConfig();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { pathToOptimizedAudioFile } = useCreateOptimizedAudioFile();
  const stopLoading = useCallback(() => setIsLoading(false), []);

  useEffect(() => {
    if (!filePath) return;

    setIsLoading(true);
    message.open({
      key: CREATE_OPTIMIZED_AUDIO_FILE,
      type: 'loading',
      content: 'Creating optimized audio file...',
      duration: 0,
    });
  }, [filePath]);

  return {
    stopLoading,
    isLoading,
    pathToAudioFile: pathToOptimizedAudioFile,
  };
}

export default useAudioFileInput;
