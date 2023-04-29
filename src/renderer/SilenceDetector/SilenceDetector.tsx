import React, { useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import WaveSurferRegions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min';
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min';
import { RegionParams } from 'wavesurfer.js/src/plugin/regions';

import { Interval } from '../../shared/types';

import './SilenceDetector.scss';

interface SilenceDetectorProps {}

const SilenceDetector: React.FC<SilenceDetectorProps> = () => {
  const skipRegionInProgress = React.useRef(false);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [minSilenceLen, setMinSilenceLen] = useState<number>(1.5);
  const [silenceThresh, setSilenceThresh] = useState<number>(-35);
  const [intervals, setIntervals] = useState<Array<Interval>>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setInputFile(file);
      setIsLoading(true);
      setIntervals([]);
    }
  };

  const handleDetectSilenceClick = async () => {
    if (inputFile) {
      const silentIntervals = await window.electron.getSilentIntervals(
        inputFile.path,
        minSilenceLen,
        silenceThresh
      );
      setIntervals(silentIntervals);
    }
  };

  const waveformRef = React.useRef<HTMLDivElement>(null);
  const wavesurferRef = React.useRef<WaveSurfer | null>(null);

  const handlePlayPauseClick = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying((prev) => !prev);
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
    if (!waveformRef.current || !inputFile) return;

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      plugins: [
        CursorPlugin.create({
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

    wavesurferRef.current.loadBlob(inputFile);

    wavesurferRef.current.on('ready', () => {
      setIsLoading(false);
    });

    const onAudioProcess = () => {
      if (!wavesurferRef.current || skipRegionInProgress.current) return;

      const currentTime = wavesurferRef.current.getCurrentTime();
      const regions = wavesurferRef.current.regions.list;

      for (const regionId in regions) {
        const region = regions[regionId];
        if (region.start <= currentTime && region.end >= currentTime) {
          skipRegionInProgress.current = true;
          wavesurferRef.current.seekTo(
            region.end / wavesurferRef.current.getDuration()
          );
          setTimeout(() => {
            skipRegionInProgress.current = false;
          }, 0);
          break;
        }
      }
    };

    wavesurferRef.current.on('audioprocess', onAudioProcess);

    return () => {
      wavesurferRef.current?.destroy();
      wavesurferRef.current?.un('audioprocess', onAudioProcess);
    };
  }, [inputFile]);

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
      // Spacebar key code is 32
      if (event.keyCode === 32) {
        handlePlayPauseClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPauseClick]);

  return (
    <div className="silence-detector">
      <div className="input-file">
        <label htmlFor="input-file">
          Select a file
          <input
            id="input-file"
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileChange}
          />
        </label>
        {inputFile && <div className="file-name">{inputFile.name}</div>}
      </div>
      <div className="input-parameters">
        <div className="input-min-silence-len">
          <label htmlFor="input-min-silence-len">
            Minimum Silence Length:
            <input
              id="input-min-silence-len"
              type="number"
              value={minSilenceLen}
              onChange={(event) =>
                setMinSilenceLen(parseFloat(event.target.value))
              }
            />
          </label>
        </div>
        <div className="input-silence-thresh">
          <label htmlFor="input-silence-thresh">
            Silence Threshold:
            <input
              id="input-silence-thresh"
              type="number"
              value={silenceThresh}
              onChange={(event) =>
                setSilenceThresh(parseFloat(event.target.value))
              }
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDetectSilenceClick}
        disabled={!inputFile}
      >
        Detect silence
      </button>

      {isLoading && (
        <div className="audio-waveform-animation">
          {Array.from({ length: 120 }).map((_, index) => (
            <div key={index} className="bar" />
          ))}
        </div>
      )}

      <div
        className="waveform"
        ref={waveformRef}
        onWheel={handleScroll}
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
      />
      <div
        id="waveform-timeline"
        className="waveform-timeline"
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
      />

      <button
        type="button"
        onClick={handlePlayPauseClick}
        disabled={!inputFile}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};

export default SilenceDetector;
