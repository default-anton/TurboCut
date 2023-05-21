import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';

import { CREATE_OPTIMIZED_AUDIO_FILE } from '../messages';
import { useProjectConfig } from './useProjectConfig';

export function useTimelineAudioFile(): {
  stopLoading: () => void;
  isLoading: boolean;
  timelineDuration: number | undefined;
  pathToTimelineAudioFile: string | undefined;
} {
  const { projectConfig: { filePath, fileDuration, dir, clips } = {} } =
    useProjectConfig();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [pathToTimelineAudioFile, setPathToTimelineAudioFile] = useState<
    string | undefined
  >(undefined);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  useEffect(() => {
    if (!filePath || !dir || !clips || !fileDuration) return;

    setIsLoading(true);
    message.open({
      key: CREATE_OPTIMIZED_AUDIO_FILE,
      type: 'loading',
      content: 'Creating optimized audio file...',
      duration: 0,
    });

    const render = async () => {
      if (!filePath || !dir || !clips || !fileDuration) return;

      let pathTotimelineAudioFile: string = '';

      try {
        pathTotimelineAudioFile = await window.electron.renderTimelineAudio(
          filePath,
          dir,
          clips.length > 0 ? clips : [{ start: 0, end: fileDuration }]
        );
        setDuration(
          await window.electron.getVideoDuration(pathTotimelineAudioFile)
        );
        setPathToTimelineAudioFile(pathTotimelineAudioFile);
      } catch (error: any) {
        message.error(`Failed to create timeline audio file: ${error.message}`);
      }
    };

    render();
  }, [filePath, fileDuration, dir, clips]);

  return {
    stopLoading,
    isLoading,
    timelineDuration: duration,
    pathToTimelineAudioFile,
  };
}

export default useTimelineAudioFile;
