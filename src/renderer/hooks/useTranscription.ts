import { useCallback, useState } from 'react';
import { message } from 'antd';
import { Transcription } from 'shared/types';

export function useTranscription(pathToAudioFile: string | null): {
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
        setTranscription(
          await window.electron.transcribe(pathToAudioFile, languageCode)
        );
      } catch (error) {
        message.error(`Transcription failed. ${error}`);
      } finally {
        setIsLoading(false);
      }
    },
    [pathToAudioFile]
  );

  return {
    isLoading,
    transcription,
    transcribe,
  };
}

export default useTranscription;
