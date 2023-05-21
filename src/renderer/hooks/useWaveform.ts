import React, { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import WaveSurferRegions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min';
import PlayheadPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.playhead.min';
import { RegionParams } from 'wavesurfer.js/src/plugin/regions';
import { message } from 'antd';

import { Clip } from '../../shared/types';
import { CREATE_OPTIMIZED_AUDIO_FILE } from '../messages';

import { useProjectConfig } from './useProjectConfig';

export function useWaveform({
  filePath,
  duration,
  clips,
  skipRegions,
  stopLoading,
}: {
  filePath: string | undefined;
  duration: number | undefined;
  clips: Clip[] | undefined;
  skipRegions: boolean;
  stopLoading: () => void;
}): {
  waveformRef: React.RefObject<HTMLDivElement>;
  handleScroll: (event: React.WheelEvent<HTMLDivElement>) => void;
} {
  const { projectConfig: { dir } = {} } = useProjectConfig();

  const skipRegionInProgress = useRef(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const handlePlayPauseClick = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  const handleScroll = useCallback(
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
    if (!waveformRef.current || !filePath || !dir || !clips || !duration)
      return;

    wavesurferRef.current.zoom(zoomLevel);
  }, [zoomLevel, filePath, dir, clips, duration]);

  useEffect(() => {
    console.log(
      Boolean(waveformRef.current),
      Boolean(filePath),
      Boolean(dir),
      Boolean(clips),
      Boolean(duration)
    );

    if (!waveformRef.current || !filePath || !dir || !clips || !duration)
      return;

    const onAudioProcess = () => {
      if (
        !skipRegions ||
        !wavesurferRef.current ||
        skipRegionInProgress.current
      )
        return;

      const currentTime = wavesurferRef.current.getCurrentTime();
      const regions = wavesurferRef.current.regions.list;

      Object.entries(regions).forEach(([, region]) => {
        if (
          Object.prototype.hasOwnProperty.call(region, 'start') &&
          Object.prototype.hasOwnProperty.call(region, 'end')
        ) {
          if (region.start <= currentTime && region.end >= currentTime) {
            skipRegionInProgress.current = true;
            wavesurferRef.current!.seekTo(region.end / duration);
            setTimeout(() => {
              skipRegionInProgress.current = false;
            }, 0);
          }
        }
      });
    };

    const init = async () => {
      if (!waveformRef.current || !filePath || !dir || !clips || !duration)
        return;

      let pathTotimelineAudioFile: string = '';

      try {
        pathTotimelineAudioFile = await window.electron.renderTimelineAudio(
          filePath,
          dir,
          clips
        );
      } catch (error: any) {
        message.error(`Error creating optimized audio file: ${error.message}`);
        return;
      } finally {
        stopLoading();
      }

      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        height: 256,
        scrollParent: true,
        plugins: [
          PlayheadPlugin.create({
            showTime: true,
            opacity: 1,
            customShowTimeStyle: {
              'background-color': '#000',
              color: '#fff',
              padding: '2px',
              'font-size': '10px',
            },
          }),
          TimelinePlugin.create({ container: '#waveform-timeline' }),
          WaveSurferRegions.create(),
        ],
      });

      // set initial zoom level
      wavesurferRef.current.zoom(zoomLevel);

      wavesurferRef.current.load(`file://${pathTotimelineAudioFile}`);
      wavesurferRef.current.on('ready', () => {
        stopLoading();
        message.open({
          key: CREATE_OPTIMIZED_AUDIO_FILE,
          type: 'success',
          content: 'Optimized audio file created',
          duration: 2,
        });
      });

      if (skipRegions) wavesurferRef.current.on('audioprocess', onAudioProcess);
    };

    init();

    return () => {
      wavesurferRef.current?.destroy();
      if (skipRegions)
        wavesurferRef.current?.un('audioprocess', onAudioProcess);
    };
  }, [filePath, dir, skipRegions, stopLoading, clips, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!wavesurferRef.current) return;
    if (!waveformRef.current || !filePath || !dir || !clips || !duration)
      return;

    wavesurferRef.current.clearRegions();

    clips!.forEach((clip) => {
      wavesurferRef.current!.addRegion({
        start: clip.start,
        end: clip.end,
        color: 'rgba(255, 0, 0, 0.2)',
        drag: false,
        resize: false,
      } as RegionParams);
    });
  }, [clips, filePath, dir, duration]);

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
    handleScroll,
  };
}

export default useWaveform;
