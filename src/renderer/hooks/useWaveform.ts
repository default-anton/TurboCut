import React, { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import WaveSurferRegions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min';
import PlayheadPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.playhead.min';
import { RegionParams } from 'wavesurfer.js/src/plugin/regions';
import { message } from 'antd';
import { CREATE_OPTIMIZED_AUDIO_FILE } from 'renderer/messages';

import type { Interval } from '../../shared/types';

export function useWaveform(
  filePath: string | null,
  isLoading: boolean,
  stopLoading: () => void,
  intervals: Array<Interval>
) {
  const skipRegionInProgress = useRef(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [duration, setDuration] = useState(0);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const handlePlayPauseClick = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  const handleScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    if (wavesurferRef.current) {
      const delta = event.deltaY > 0 ? -1 : 1;
      setZoomLevel((prev) => Math.max(Math.min(prev + delta, 20), 1));
    }
  };

  useEffect(() => {
    if (!wavesurferRef.current) return;

    wavesurferRef.current.zoom(zoomLevel);
  }, [zoomLevel]);

  useEffect(() => {
    if (!waveformRef.current || !filePath) return;

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

    wavesurferRef.current.load(`file://${filePath}`);
    wavesurferRef.current.on('ready', () => {
      stopLoading();
      setDuration(wavesurferRef.current!.getDuration());
      message.open({
        key: CREATE_OPTIMIZED_AUDIO_FILE,
        type: 'success',
        content: 'Optimized audio file created',
        duration: 2,
      });
    });

    const onAudioProcess = () => {
      if (!wavesurferRef.current || skipRegionInProgress.current) return;

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

    wavesurferRef.current.on('audioprocess', onAudioProcess);

    return () => {
      wavesurferRef.current?.destroy();
      wavesurferRef.current?.un('audioprocess', onAudioProcess);
    };
  }, [filePath, stopLoading, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!wavesurferRef.current) return;

    wavesurferRef.current.clearRegions();

    intervals.forEach((interval) => {
      wavesurferRef.current!.addRegion({
        start: interval.start,
        end: interval.end,
        color: 'rgba(255, 0, 0, 0.2)',
        drag: false,
        resize: false,
      } as RegionParams);
    });
  }, [intervals]);

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
    duration,
  };
}

export default useWaveform;