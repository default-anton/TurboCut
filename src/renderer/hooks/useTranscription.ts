import { useCallback, useState } from 'react';
import { message } from 'antd';

import { useProjectConfig } from './useProjectConfig';

export function useTranscription(): {
  isTranscribing: boolean;
  transcribe: (languageCode: string) => Promise<void>;
} {
  const {
    projectConfig: { filePath, dir, clips },
  } = useProjectConfig();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { updateTranscription } = useProjectConfig();

  const transcribe = useCallback(
    async (languageCode: string) => {
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
          languageCode
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
