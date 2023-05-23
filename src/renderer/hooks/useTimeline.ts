import { useState, useEffect } from 'react';
import { message } from 'antd';

import { Clip } from '../../shared/types';
import { useProjectConfig } from './useProjectConfig';

export interface TimelineClip extends Clip {
  sourceStart: number;
  sourceEnd: number;
}

export function useTimeline(): {
  isTimelineLoading: boolean;
  timelineDuration: number | undefined;
  timelineClips: TimelineClip[] | undefined;
  pathToTimelineAudioFile: string | undefined;
} {
  const { projectConfig: { filePath, dir, clips } = {} } = useProjectConfig();
  const [isTimelineLoading, setIsTimelineLoading] = useState<boolean>(false);
  const [timelineDuration, setTimelineDuration] = useState<number | undefined>(
    undefined
  );
  const [timelineClips, setTimelineClips] = useState<
    TimelineClip[] | undefined
  >(() => {
    return clips?.map((clip) => ({
      ...clip,
      sourceStart: clip.start,
      sourceEnd: clip.end,
    }));
  });
  const [pathToTimelineAudioFile, setPathToTimelineAudioFile] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    if (!filePath || !dir || !clips) return;

    setIsTimelineLoading(true);

    const render = async () => {
      if (!filePath || !dir || !clips) return;

      let pathTotimelineAudioFile: string = '';

      try {
        pathTotimelineAudioFile = await window.electron.renderTimelineAudio(
          filePath,
          dir,
          clips,
          'wav'
        );
        const duration = await window.electron.getVideoDuration(
          pathTotimelineAudioFile
        );

        // Create timeline clips based on the new timeline audio file
        let timelineHead: number = 0;
        const newTimelineClips = clips.map((clip) => {
          const start = timelineHead;
          timelineHead = timelineHead + clip.end - clip.start;
          return { start, end: timelineHead };
        });

        // If the last clip does not exactly end at the end of the timeline,
        // set the end of the last clip to the end of the timeline.
        if (newTimelineClips[newTimelineClips.length - 1].end !== duration) {
          newTimelineClips[newTimelineClips.length - 1].end = duration;
        }

        setTimelineClips(newTimelineClips);
        setTimelineDuration(duration);
        setPathToTimelineAudioFile(pathTotimelineAudioFile);
        setIsTimelineLoading(false);
      } catch (error: any) {
        message.error(`Failed to create timeline audio file: ${error.message}`);
      }
    };

    render();
  }, [filePath, dir, clips, setTimelineClips, setTimelineDuration]);

  return {
    isTimelineLoading,
    timelineDuration,
    pathToTimelineAudioFile,
    timelineClips,
  };
}

export default useTimeline;
