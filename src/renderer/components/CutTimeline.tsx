import { useEffect, useRef, FC, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import WaveSurferRegions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min';
import { RegionParams } from 'wavesurfer.js/src/plugin/regions';

import { theme, Button } from 'antd';
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
      console.log('ready');
    });

    waveSurferRef.current.on('error', (err) => {
      console.log('error', err);
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

      setSegmentAtPlayhead(currentSegmentAtPlayhead);

      // skip to the end of the region if the current time is within a disabled region
      for (const id of disabledSegmentIds) {
        const t = transcription[id];

        if (currentTime >= t.start && currentTime <= t.end) {
          skipRegionInProgress.current = true;
          waveSurferRef.current!.seekTo(t.end / audioFileDuration);
          setTimeout(() => {
            skipRegionInProgress.current = false;
          }, 0);
          break;
        }
      }
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

    waveSurferRef.current.on('timeupdate', onAudioPositionChange);

    return () => {
      waveSurferRef.current?.un('timeupdate', onAudioPositionChange);
    };
  }, [
    audioFileDuration,
    disabledSegmentIds,
    transcription,
    setSegmentAtPlayhead,
  ]);

  const handlePlayPause = () => {
    if (!waveSurferRef.current) return;

    setIsPlaying(!waveSurferRef.current.isPlaying());

    waveSurferRef.current.playPause();
  };

  return (
    <>
      <div ref={waveformRef} id="waveform" />

      <div id="waveform-timeline" />

      <Button
        onClick={handlePlayPause}
        style={{ marginTop: token.marginMD }}
        type={isPlaying ? 'default' : 'primary'}
        danger={isPlaying}
      >
        {isPlaying ? (
          <>
            <PauseCircleOutlined /> Pause
          </>
        ) : (
          <>
            <PlayCircleOutlined /> Play
          </>
        )}
      </Button>
    </>
  );
};

export default CutTimeline;
