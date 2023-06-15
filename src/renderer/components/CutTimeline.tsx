import { useEffect, useRef, FC, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import WaveSurferRegions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min';
import { RegionParams } from 'wavesurfer.js/src/plugin/regions';

import { theme, FloatButton } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

import { useProjectConfig } from 'renderer/hooks/useProjectConfig';
import { Transcription } from 'shared/types';

interface CutTimelineProps {
  disabledSegmentIds: Set<number>;
  setSegmentAtPlayhead: (segmentId: number | null) => void;
}

function findSegmentAtPlayhead(
  transcription: Transcription,
  currentTime: number
): number | null {
  let left = 0;
  let right = transcription.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const t = transcription[mid];

    if (currentTime >= t.start && currentTime <= t.end) {
      return t.id;
    }

    if (currentTime < t.start) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return null;
}

const CutTimeline: FC<CutTimelineProps> = ({
  disabledSegmentIds,
  setSegmentAtPlayhead,
}) => {
  const { token } = theme.useToken();
  const skipRegionInProgress = useRef(false);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const {
    projectConfig: { transcription, filePath, dir, speech },
  } = useProjectConfig();
  const [isPlaying, setIsPlaying] = useState(false);

  const [audioFile, setAudioFile] = useState<string | undefined>(undefined);
  const [audioFileDuration, setAudioFileDuration] = useState<
    number | undefined
  >(undefined);

  const handlePlayPause = useCallback(() => {
    if (!waveSurferRef.current) return;

    setIsPlaying(!waveSurferRef.current.isPlaying());

    waveSurferRef.current.playPause();
  }, []);

  useEffect(() => {
    const resize = () => {
      if (!waveSurferRef.current) return;

      waveSurferRef.current.drawer.containerWidth =
        waveSurferRef.current.drawer.container.clientWidth;
      waveSurferRef.current.drawBuffer();
    };

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!filePath || !dir || !speech) return;

      const pathToAudioFile = await window.electron.renderTimelineAudio(
        filePath,
        dir,
        speech,
        'wav'
      );
      const duration = await window.electron.getVideoDuration(pathToAudioFile);

      setAudioFile(pathToAudioFile);
      setAudioFileDuration(duration);
    };

    run();
  }, [filePath, dir, speech]);

  useEffect(() => {
    if (!waveformRef.current || !audioFile || !audioFileDuration) return;

    // Initialize Wavesurfer.js
    waveSurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: token.colorPrimary,
      progressColor: token.colorFillSecondary,
      height: 256,
      plugins: [
        TimelinePlugin.create({ container: '#waveform-timeline' }),
        WaveSurferRegions.create(),
      ],
    });

    waveSurferRef.current.load(`file://${audioFile}`);

    waveSurferRef.current.on('ready', () => {
      window.log.info(`Audio file ready: ${audioFile}`);
    });

    waveSurferRef.current.on('error', (err) => {
      window.log.error(`Error loading audio file: ${err}`);
    });

    return () => {
      waveSurferRef.current?.destroy();
    };
  }, [filePath, audioFile, audioFileDuration, token]);

  useEffect(() => {
    if (!waveSurferRef.current || !audioFileDuration) return;

    const onAudioPositionChange = () => {
      if (!waveSurferRef.current || skipRegionInProgress.current) return;

      const currentTime = waveSurferRef.current.getCurrentTime();

      const currentSegmentAtPlayhead = findSegmentAtPlayhead(
        transcription,
        currentTime
      );

      if (!currentSegmentAtPlayhead) {
        setSegmentAtPlayhead(null);
        return;
      }

      let newPlayheadSegment = currentSegmentAtPlayhead;
      // skip to the first non-disabled segment
      while (
        newPlayheadSegment < transcription.length &&
        disabledSegmentIds.has(newPlayheadSegment)
      ) {
        newPlayheadSegment++;
      }

      if (newPlayheadSegment === currentSegmentAtPlayhead) {
        setSegmentAtPlayhead(currentSegmentAtPlayhead);
        return;
      }

      skipRegionInProgress.current = true;
      setSegmentAtPlayhead(
        newPlayheadSegment >= transcription.length ? null : newPlayheadSegment
      );
      waveSurferRef.current!.seekTo(
        (transcription[newPlayheadSegment]?.end || audioFileDuration) /
          audioFileDuration
      );
      setTimeout(() => {
        skipRegionInProgress.current = false;
      }, 0);
    };

    waveSurferRef.current.clearRegions();

    disabledSegmentIds.forEach((id) => {
      const t = transcription[id];

      waveSurferRef.current!.addRegion({
        start: t.start,
        end: t.end,
        color: 'rgba(255, 0, 0, 0.2)',
        drag: false,
        resize: false,
      } as RegionParams);
    });

    waveSurferRef.current.on('seek', onAudioPositionChange);
    waveSurferRef.current.on('audioprocess', onAudioPositionChange);

    return () => {
      waveSurferRef.current?.un('seek', onAudioPositionChange);
      waveSurferRef.current?.un('audioprocess', onAudioPositionChange);
    };
  }, [
    audioFileDuration,
    disabledSegmentIds,
    transcription,
    setSegmentAtPlayhead,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause]);

  return (
    <>
      <div ref={waveformRef} id="waveform" />

      <div id="waveform-timeline" />

      <FloatButton
        onClick={handlePlayPause}
        type={isPlaying ? 'default' : 'primary'}
        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        tooltip={<div>{isPlaying ? 'Pause' : 'Play'}</div>}
        style={{ right: `calc(50% - ${token.controlHeightLG / 2}px)` }}
      />
    </>
  );
};

export default CutTimeline;
