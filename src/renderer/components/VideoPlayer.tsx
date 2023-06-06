import { useEffect, useRef, FC, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from 'antd';
import { useProjectConfig } from 'renderer/hooks/useProjectConfig';

interface VideoPlayerProps {
  disabledSegmentIds: Set<number>;
}

const VideoPlayer: FC<VideoPlayerProps> = ({ disabledSegmentIds }) => {
  const skipRegionInProgress = useRef(false);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const {
    projectConfig: { transcription, filePath, dir, speech },
  } = useProjectConfig();

  const [audioFile, setAudioFile] = useState<string | undefined>(undefined);
  const [audioFileDuration, setAudioFileDuration] = useState<
    number | undefined
  >(undefined);

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
    if (
      !waveformRef.current ||
      !audioFile ||
      !audioFileDuration
    )
      return;

    // Initialize Wavesurfer.js
    waveSurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
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
  }, [filePath, audioFile, audioFileDuration]);

  useEffect(() => {
    if (!waveSurferRef.current || !audioFileDuration) return;

    const onAudioProcess = () => {
      if (!waveSurferRef.current || skipRegionInProgress.current) return;

      const currentTime = waveSurferRef.current.getCurrentTime();

      // skip to the end of the region if the current time is within a disabled region
      disabledSegmentIds.forEach((id) => {
        const t = transcription[id];

        if (currentTime >= t.start && currentTime <= t.end) {
          skipRegionInProgress.current = true;
          waveSurferRef.current!.seekTo(t.end / audioFileDuration);
          setTimeout(() => {
            skipRegionInProgress.current = false;
          }, 0);
        }
      });
    };

    waveSurferRef.current.on('audioprocess', onAudioProcess);

    return () => {
      waveSurferRef.current?.un('audioprocess', onAudioProcess);
    };
  }, [audioFileDuration, disabledSegmentIds, transcription]);

  const handlePlayPause = () => {
    waveSurferRef.current?.playPause();
  };

  return (
    <div>
      <div ref={waveformRef} id="waveform" />
      <Button onClick={handlePlayPause}>Play/Pause</Button>
    </div>
  );
};

export default VideoPlayer;
