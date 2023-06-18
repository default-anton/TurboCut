import React, { useCallback, useEffect, useRef, useState } from 'react';
import { theme } from 'antd';
import WaveSurfer from 'wavesurfer.js';
import WaveSurferRegions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min';
import PlayheadPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.playhead.min';
import { RegionParams } from 'wavesurfer.js/src/plugin/regions';

import { useProjectConfig } from './useProjectConfig';

export function useSilenceDetectionWaveform(): {
  waveformRef: React.RefObject<HTMLDivElement>;
  handleWheel: (event: WheelEvent) => void;
  playPause: () => void;
  setPlaybackRate: (rate: number) => void;
  playbackRate: number;
  isPlaying: boolean;
  gain: number;
  setGain: number;
} {
  const { token } = theme.useToken();
  const [audioFile, setAudioFile] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioFileDuration, setAudioFileDuration] = useState<
    number | undefined
  >(undefined);
  const [isWaveformReady, setIsWaveformReady] = useState<boolean>(false);
  const { projectConfig: { dir, filePath, clips, silence } = {} } =
    useProjectConfig();
  const skipRegionInProgress = useRef<boolean>(false);
  const [gain, setGain] = useState<number>(1);
  const gainNode = useRef<any>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const playPause = useCallback(() => {
    if (!wavesurferRef.current) return;

    setIsPlaying(!wavesurferRef.current.isPlaying());

    wavesurferRef.current.playPause();
  }, []);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();

    if (wavesurferRef.current) {
      const delta = event.deltaY > 0 ? -1 : 1;
      setZoomLevel((prev) => Math.max(Math.min(prev + delta, 20), 1));
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!filePath || !dir || !clips) return;

      const pathToAudioFile = await window.electron.renderTimelineAudio(
        filePath,
        dir,
        clips,
        'wav'
      );
      const duration = await window.electron.getVideoDuration(pathToAudioFile);

      setAudioFile(pathToAudioFile);
      setAudioFileDuration(duration);
    };

    run();
  }, [filePath, dir, clips]);

  useEffect(() => {
    if (!wavesurferRef.current) return;
    if (!isWaveformReady) return;

    wavesurferRef.current.zoom(zoomLevel);
  }, [zoomLevel, isWaveformReady]);

  useEffect(() => {
    setIsWaveformReady(false);

    if (!waveformRef.current || !audioFile || !audioFileDuration) return;

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
            wavesurferRef.current!.seekTo(region.end / audioFileDuration);
            setTimeout(() => {
              skipRegionInProgress.current = false;
            }, 0);
          }
        }
      });
    };

    wavesurferRef.current = WaveSurfer.create({
      backend: 'MediaElementWebAudio',
      container: waveformRef.current,
      waveColor: token.colorPrimary,
      progressColor: token.colorFillSecondary,
      height: 256,
      scrollParent: true,
      plugins: [
        TimelinePlugin.create({ container: '#waveform-timeline' }),
        WaveSurferRegions.create(),
      ],
    });

    gainNode.current = wavesurferRef.current.backend.ac.createGain();
    gainNode.current.gain.value = 1;
    wavesurferRef.current.backend.setFilters([gainNode.current]);

    // set initial zoom level
    wavesurferRef.current.zoom(zoomLevel);

    wavesurferRef.current.load(`file://${audioFile}`);
    wavesurferRef.current.on('ready', () => {
      setIsWaveformReady(true);
    });

    wavesurferRef.current.on('audioprocess', onAudioProcess);

    return () => {
      wavesurferRef.current?.destroy();
      wavesurferRef.current?.un('audioprocess', onAudioProcess);
    };
  }, [audioFile, audioFileDuration, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!wavesurferRef.current) return;
    if (!silence) return;

    wavesurferRef.current.clearRegions();

    silence!.forEach((clip) => {
      wavesurferRef.current!.addRegion({
        start: clip.start,
        end: clip.end,
        color: 'rgba(255, 0, 0, 0.2)',
        drag: false,
        resize: false,
      } as RegionParams);
    });
  }, [silence]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        playPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playPause]);

  useEffect(() => {
    if (!wavesurferRef.current) return;

    wavesurferRef.current!.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  useEffect(() => {
    if (!wavesurferRef.current) return;

    gainNode.current.gain.value = gain;
  }, [gain]);

  return {
    waveformRef,
    handleWheel,
    playPause,
    playbackRate,
    setPlaybackRate,
    isPlaying,
    gain,
    setGain,
  };
}

export default useSilenceDetectionWaveform;
