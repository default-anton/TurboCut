import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { ProjectStep } from 'shared/types';
import { useProjectConfig } from './useProjectConfig';

export interface SilenceDetectionSettings {
  minSilenceLen: number;
  minNonSilenceLen: number;
  silenceThresh: number;
  padding: number;
}

export interface UseSilenceDetection {
  isDetectingSilence: boolean;
  detectSilence: (newSettings: SilenceDetectionSettings) => Promise<void>;
  applySilenceDetection: () => Promise<void>;
  settings: SilenceDetectionSettings;
}

export function useSilenceDetection(): UseSilenceDetection {
  const {
    projectConfig: { filePath, speech },
    updateClips,
    updateProjectStep,
  } = useProjectConfig();
  const [isDetectingSilence, setIsDetectingSilence] = useState(false);
  const [settings, setSettings] = useState<SilenceDetectionSettings>({
    minSilenceLen: 1,
    minNonSilenceLen: 0.8,
    silenceThresh: -33,
    padding: 0.2,
  });

  const detectSilence = useCallback(
    async (newSettings: SilenceDetectionSettings) => {
      if (!filePath) return;

      message.open({
        key: 'detect-silence',
        type: 'loading',
        content: 'Detecting silence...',
        duration: 0,
      });
      setIsDetectingSilence(true);

      try {
        const { silentClips, nonSilentClips } =
          await window.electron.getSilentClips({ filePath, ...newSettings });

        await updateClips({
          silence: silentClips,
          speech: nonSilentClips,
        });

        setSettings(newSettings);
      } catch (e: any) {
        message.open({
          key: 'detect-silence',
          type: 'error',
          content: `Silence detection failed: ${e.message}`,
          duration: 2,
        });
        return;
      } finally {
        message.open({
          key: 'detect-silence',
          type: 'success',
          content: 'Silence detection complete',
          duration: 2,
        });
        setIsDetectingSilence(false);
      }
    },
    [filePath, updateClips]
  );
  const applySilenceDetection = useCallback(async () => {
    try {
      await updateClips({ clips: speech });
    } catch (e: any) {
      message.error(`Failed to apply silence detection: ${e.message}`);
      return;
    }

    try {
      await updateProjectStep(ProjectStep.Transcribe);
    } catch (e: any) {
      message.error(`Failed to update project step: ${e.message}`);
    }
  }, [speech, updateClips, updateProjectStep]);

  useEffect(() => {
    if (!filePath) return;
    if (speech.length > 0) return;

    detectSilence(settings);
  }, [filePath, speech]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isDetectingSilence,
    detectSilence,
    applySilenceDetection,
    settings,
  };
}

export default useSilenceDetection;
