import { FC, useCallback, useEffect } from 'react';

import { Spin, Space, Divider } from 'antd';

import { Editor } from 'shared/types';

import { useExport } from 'renderer/hooks/useExport';
import { useProjectConfig } from 'renderer/hooks/useProjectConfig';
import { useSilenceDetectionWaveform } from 'renderer/hooks/useSilenceDetectionWaveform';
import { UseSilenceDetection } from 'renderer/hooks/useSilenceDetection';

import DetectSilenceForm from './DetectSilenceForm';
import Waveform from './Waveform';

import ExportButton from './ExportButton';

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
    gain,
    setGain,
  } = useSilenceDetectionWaveform();
  const { projectConfig: { speech } = {} } = useProjectConfig();
  const { exportTimeline, isExporting } = useExport();

  const handleExport = useCallback(
    async (editor: Editor, frameRate: number) => {
      await exportTimeline(editor, frameRate, speech);
    },
    [exportTimeline, speech]
  );

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
          gain={gain}
          onChangeGain={setGain}
        />

        <Divider orientation="left">Spam Detection</Divider>

        <DetectSilenceForm
          settings={settings}
          onSubmit={detectSilence}
          onApply={applySilenceDetection}
        />

        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          disabled={isExporting}
        />
      </Space>
    </Spin>
  );
};

export default SilenceDetector;
