import { useCallback, useState } from 'react';
import { message } from 'antd';

import { Clip, Transcription } from 'shared/types';

export function useTranscription(
  pathToAudioFile: string | null,
  clips: Clip[]
): {
  isLoading: boolean;
  transcription: Transcription | null;
  transcribe: (languageCode: string) => Promise<void>;
} {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<Transcription | null>(
    null
  );

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
          clips
        );

        setTranscription(
          await window.electron.transcribe(
            pathToCompressedTimeline,
            languageCode
          )
        );
      } catch (error) {
        message.error(`Transcription failed. ${error}`);
      } finally {
        setIsLoading(false);
      }
    },
    [pathToAudioFile, clips]
  );

  return {
    isLoading,
    transcription,
    transcribe,
  };
}

export default useTranscription;
