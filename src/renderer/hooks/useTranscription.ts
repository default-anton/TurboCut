import { useCallback, useState } from 'react';
import { message } from 'antd';

import { useProjectConfig } from './useProjectConfig';

export function useTranscription(pathToAudioFile: string | undefined): {
  isLoading: boolean;
  transcribe: (languageCode: string) => Promise<void>;
} {
  const { projectConfig: { clips, dir } = {} } = useProjectConfig();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { updateTranscription } = useProjectConfig();

  const transcribe = useCallback(
    async (languageCode: string) => {
      if (!pathToAudioFile) {
        message.error('Please select an audio file first.');
        return;
      }

      setIsLoading(true);

      try {
        const pathTotimelineAudioFile =
          await window.electron.renderTimelineAudio(
            pathToAudioFile,
            dir!,
            clips || []
          );
        const transcription = await window.electron.transcribe(
          pathTotimelineAudioFile,
          languageCode
        );
        await updateTranscription(transcription);
      } catch (error) {
        message.error(`Transcription failed. ${error}`);
      } finally {
        setIsLoading(false);
      }
    },
    [pathToAudioFile, clips, dir, updateTranscription]
  );

  return {
    isLoading,
    transcribe,
  };
}

export default useTranscription;
