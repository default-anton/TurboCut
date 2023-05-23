import { FC, useEffect } from 'react';

import { Spin } from 'antd';

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
  const { waveformRef, handleWheel } = useSilenceDetectionWaveform();

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
      <Waveform waveformRef={waveformRef} />
      <DetectSilenceForm
        settings={settings}
        onSubmit={detectSilence}
        onApply={applySilenceDetection}
      />
    </Spin>
  );
};

export default SilenceDetector;
