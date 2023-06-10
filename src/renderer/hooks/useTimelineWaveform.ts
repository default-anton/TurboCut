import React, { useCallback, useEffect, useRef, useState } from 'react';
import { theme } from 'antd';
import WaveSurfer from 'wavesurfer.js';
import WaveSurferRegions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min';
import PlayheadPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.playhead.min';
import { RegionParams } from 'wavesurfer.js/src/plugin/regions';

import { useProjectConfig } from './useProjectConfig';
import { TimelineClip } from './useTimeline';

export function useTimelineWaveform({
  filePath,
  duration,
  timelineClips,
}: {
  filePath: string | undefined;
  duration: number | undefined;
  timelineClips: TimelineClip[] | undefined;
}): {
  waveformRef: React.RefObject<HTMLDivElement>;
  handleWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
} {
  const { token } = theme.useToken();
  const { projectConfig: { dir } = {} } = useProjectConfig();
  const [zoomLevel, setZoomLevel] = useState(1);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const handlePlayPauseClick = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (wavesurferRef.current) {
        const delta = event.deltaY > 0 ? -1 : 1;
        setZoomLevel((prev) => Math.max(Math.min(prev + delta, 20), 1));
      }
    },
    []
  );

  useEffect(() => {
    if (!wavesurferRef.current) return;
    if (
      !waveformRef.current ||
      !filePath ||
      !dir ||
      !timelineClips ||
      !duration
    )
      return;

    wavesurferRef.current.zoom(zoomLevel);
  }, [zoomLevel, filePath, dir, timelineClips, duration]);

  useEffect(() => {
    if (
      !waveformRef.current ||
      !filePath ||
      !dir ||
      !timelineClips ||
      !duration
    )
      return;

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: token.colorPrimary,
      progressColor: token.colorFillSecondary,
      height: 256,
      scrollParent: true,
      plugins: [
        PlayheadPlugin.create({
          showTime: true,
          opacity: 1,
          customShowTimeStyle: {
            'background-color': '#000',
            color: token.colorBgSpotlight,
            padding: token.paddingXXS,
            'font-size': token.fontSizeSM,
          },
        }),
        TimelinePlugin.create({ container: '#waveform-timeline' }),
        WaveSurferRegions.create(),
      ],
    });

    // set initial zoom level
    wavesurferRef.current.zoom(zoomLevel);

    wavesurferRef.current.load(`file://${filePath}`);
    wavesurferRef.current.on('ready', () => {
      window.log.info(`Waveform ready: ${filePath}`);
    });

    return () => {
      wavesurferRef.current?.destroy();
    };
  }, [filePath, dir, timelineClips, duration, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!wavesurferRef.current) return;
    if (
      !waveformRef.current ||
      !filePath ||
      !dir ||
      !timelineClips ||
      !duration
    )
      return;

    wavesurferRef.current.clearRegions();

    timelineClips!.forEach((clip) => {
      wavesurferRef.current!.addRegion({
        start: clip.start,
        end: clip.end,
        color: 'rgba(255, 0, 0, 0.2)',
        drag: false,
        resize: false,
      } as RegionParams);
    });
  }, [timelineClips, filePath, dir, duration]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        handlePlayPauseClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPauseClick]);

  return {
    waveformRef,
    handleWheel,
  };
}

export default useTimelineWaveform;
