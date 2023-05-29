import { useCallback, useState } from 'react';
import { message } from 'antd';

import { TranscriptionBackend } from 'shared/types';
import { useProjectConfig } from './useProjectConfig';

export function useTranscription(): {
  isTranscribing: boolean;
  transcribe: (
    languageCode: string,
    backend: TranscriptionBackend
  ) => Promise<void>;
} {
  const {
    projectConfig: { filePath, dir, speech },
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
          speech,
          'mp3'
        );
        const transcription = await window.electron.transcribe({
          backend,
          pathToAudioFile,
          languageCode,
        });

        await updateTranscription(transcription);
      } catch (error) {
        message.error(`Transcription failed. ${error}`);
      } finally {
        setIsTranscribing(false);
      }
    },
    [filePath, dir, speech, updateTranscription]
  );

  return {
    isTranscribing,
    transcribe,
  };
}

export default useTranscription;
