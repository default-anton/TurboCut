import { useCallback, useState } from 'react';
import { message } from 'antd';

import { Clip } from '../../shared/types';
import { useProjectConfig } from './useProjectConfig';

export function useTranscription(pathToAudioFile: string | null): {
  isLoading: boolean;
  transcribe: (languageCode: string) => Promise<void>;
} {
  const { projectConfig: { clips } = {} } = useProjectConfig();
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
        const pathToCompressedTimeline = `${pathToAudioFile
          .split('.')
          .slice(0, -1)
          .join('.')}.timeline.compressed.mp3`;

        await window.electron.renderCompressedAudio(
          pathToAudioFile,
          pathToCompressedTimeline,
          clips || []
        );
        const transcription = await window.electron.transcribe(
          pathToCompressedTimeline,
          languageCode
        );
        await updateTranscription(transcription);
      } catch (error) {
        message.error(`Transcription failed. ${error}`);
      } finally {
        setIsLoading(false);
      }
    },
    [pathToAudioFile, clips, updateTranscription]
  );

  return {
    isLoading,
    transcribe,
  };
}

export default useTranscription;
