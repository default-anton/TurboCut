import { useCallback, useState } from 'react';
import { message } from 'antd';

import { TranscriptionBackend, Clip } from 'shared/types';
import { useProjectConfig } from './useProjectConfig';

export function useTranscription(): {
  isTranscribing: boolean;
  transcribe: (
    languageCode: string,
    backend: TranscriptionBackend
  ) => Promise<void>;
  applyEdits: (removedSegmentIds: Set<number>) => Promise<Clip[]>;
} {
  const {
    projectConfig: { filePath, dir, speech, transcription },
    updateTranscription,
    updateClips,
  } = useProjectConfig();
  const [isTranscribing, setIsTranscribing] = useState(false);

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
        const newTranscription = await window.electron.transcribe({
          backend,
          pathToAudioFile,
          languageCode,
        });

        await updateTranscription(newTranscription);
      } catch (error) {
        message.error(`Transcription failed. ${error}`);
      } finally {
        setIsTranscribing(false);
      }
    },
    [filePath, dir, speech, updateTranscription]
  );

  // This function does not change the transcription segments themselves.
  // This function creates clips based on the transcription segments minus the removed segments.
  const applyEdits = useCallback(
    async (removedSegmentIds: Set<number>) => {
      const newTranscription = transcription.filter(
        (segment) => !removedSegmentIds.has(segment.id)
      );

      window.log.info(
        `Exporting timeline with ${removedSegmentIds.size} segments removed`
      );

      let duration = 0;
      const speechTimeline = speech.map((clip) => {
        const start = duration;
        duration += clip.end - clip.start;

        return { start, end: duration };
      });

      window.log.info('speechTimeline.length', speechTimeline.length);

      const clips: Clip[] = [];
      let currentIndex = 0;
      newTranscription.forEach(({ start: trStart, end: trEnd }) => {
        // find the first clip that contains the start time
        while (
          currentIndex < speechTimeline.length &&
          speechTimeline[currentIndex].end < trStart
        ) {
          currentIndex++;
        }

        if (currentIndex === speechTimeline.length) {
          window.log.info(
            `Segment not found in timeline: ${trStart} - ${trEnd}`
          );
          throw new Error('Segment not found in timeline');
        }

        const startIndex = currentIndex;

        while (
          currentIndex < speechTimeline.length &&
          speechTimeline[currentIndex].end < trEnd
        ) {
          currentIndex++;
        }

        const endIndex = currentIndex;

        if (currentIndex === speechTimeline.length) {
          window.log.info(
            `End of segment not found in timeline: ${trStart} - ${trEnd}`
          );
          throw new Error('End of segment not found in timeline');
        }

        const start =
          speech[startIndex].start +
          (trStart - speechTimeline[startIndex].start);

        const end =
          speech[endIndex].start + (trEnd - speechTimeline[endIndex].start);

        if (startIndex === endIndex) {
          clips.push({
            start,
            end,
          });

          return;
        }

        for (let i = startIndex; i <= endIndex; i++) {
          if (i === startIndex) {
            clips.push({
              start,
              end: speech[i].end,
            });
          } else if (i === endIndex) {
            clips.push({
              start: speech[i].start,
              end,
            });
          } else {
            clips.push({ ...speech[i] });
          }
        }
      });

      await updateClips({ clips });

      return clips;
    },
    [transcription, speech, updateClips]
  );

  return {
    isTranscribing,
    transcribe,
    applyEdits,
  };
}

export default useTranscription;
