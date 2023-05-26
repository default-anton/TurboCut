import { useCallback, useState } from 'react';
import { message } from 'antd';

import { useProjectConfig } from './useProjectConfig';
import { TranscriptionBackend } from '../../shared/types';

export function useTranscription(): {
  isTranscribing: boolean;
  transcribe: (
    languageCode: string,
    backend: TranscriptionBackend
  ) => Promise<void>;
} {
  const {
    projectConfig: { filePath, dir, clips },
  } = useProjectConfig();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { updateTranscription } = useProjectConfig();

  const transcribe = useCallback(
    async (languageCode: string, backend: TranscriptionBackend) => {
      setIsTranscribing(true);

      try {
        const pathToAudioFile = await window.electron.renderTimelineAudio(
          filePath,
          dir,
          clips,
          'mp3'
        );
        const transcription = await window.electron.transcribe(
          pathToAudioFile,
          languageCode,
          backend
        );
        await updateTranscription(transcription);
      } catch (error) {
        message.error(`Transcription failed. ${error}`);
      } finally {
        setIsTranscribing(false);
      }
    },
    [filePath, dir, clips, updateTranscription]
  );

  return {
    isTranscribing,
    transcribe,
  };
}

export default useTranscription;
