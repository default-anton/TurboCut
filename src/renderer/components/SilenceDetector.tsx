import { FC, useEffect } from 'react';

import { Spin, Space, Divider } from 'antd';

import DetectSilenceForm from './DetectSilenceForm';
import Waveform from './Waveform';

import { UseSilenceDetection } from '../hooks/useSilenceDetection';
import { useSilenceDetectionWaveform } from '../hooks/useSilenceDetectionWaveform';

const SilenceDetector: FC<UseSilenceDetection> = ({
  isDetectingSilence,
  detectSilence,
  applySilenceDetection,
  settings,
}) => {
  const {
    waveformRef,
    handleWheel,
    isPlaying,
    playbackRate,
    setPlaybackRate,
    playPause,
  } = useSilenceDetectionWaveform();

  useEffect(() => {
    const ref = waveformRef.current;

    ref?.addEventListener('wheel', handleWheel, {
      passive: false,
    });

    return () => {
      ref?.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel, waveformRef]);

  return (
    <Spin spinning={isDetectingSilence} tip="Detecting silence..." size="large">
      <Space direction="vertical" size="large">
        <Waveform
          waveformRef={waveformRef}
          playing={isPlaying}
          playbackRate={playbackRate}
          onPlaybackRateChange={setPlaybackRate}
          onPlayPause={playPause}
        />

        <Divider orientation="left">Spam Detection</Divider>

        <DetectSilenceForm
          settings={settings}
          onSubmit={detectSilence}
          onApply={applySilenceDetection}
        />
      </Space>
    </Spin>
  );
};

export default SilenceDetector;
