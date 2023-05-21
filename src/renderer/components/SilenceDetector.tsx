import React, { useCallback, useState } from 'react';
import { message, Button, Modal } from 'antd';
import { AudioOutlined } from '@ant-design/icons';

import DetectSilenceForm from './DetectSilenceForm';
import Waveform from './Waveform';

import { DETECT_SILENCE } from '../messages';

import { Clip } from '../../shared/types';
import { UseSilenceDetection } from '../hooks/useSilenceDetection';
import { useProjectConfig } from '../hooks/useProjectConfig';
import { useWaveform } from '../hooks/useWaveform';

interface SilenceDetectorProps {
  duration: number | undefined;
  loading: boolean;
  detectSilence: UseSilenceDetection['detectSilence'];
}

const SilenceDetector: React.FC<SilenceDetectorProps> = ({
  duration,
  loading,
  detectSilence,
}) => {
  const { projectConfig: { filePath } = {} } = useProjectConfig();
  const [silentClips, setSilentClips] = useState<Clip[]>([]);
  const [nonSilentClips, setNonSilentClips] = useState<Clip[]>([]);
  const [isDetectingSilence, setIsDetectingSilence] = useState<boolean>(false);
  const [minSilenceLen, setMinSilenceLen] = useState<number>(1);
  const [minNonSilenceLen, setMinNonSilenceLen] = useState<number>(0.8);
  const [silenceThresh, setSilenceThresh] = useState<number>(-33);
  const [padding, setPadding] = useState<number>(0.2);
  const [detectSilenceModalOpen, setDetectSilenceModalOpen] =
    useState<boolean>(false);

  const stopLoading = useCallback(() => {
    setIsDetectingSilence(false);
  }, []);

  const { waveformRef, handleScroll } = useWaveform({
    filePath,
    duration,
    clips: silentClips,
    stopLoading,
    skipRegions: false,
  });

  const onOk = useCallback(async () => {
    setIsDetectingSilence(true);
    message.open({
      key: DETECT_SILENCE,
      type: 'loading',
      content: 'Detecting silence...',
      duration: 0,
    });

    const result = await detectSilence({
      minSilenceLen,
      minNonSilenceLen,
      silenceThresh,
      padding,
    });
    setIsDetectingSilence(false);

    if (!result) {
      message.open({
        key: DETECT_SILENCE,
        type: 'error',
        content: 'Silence detection failed!',
        duration: 2,
      });
      return;
    }

    setSilentClips(result.silentClips);
    setNonSilentClips(result.nonSilentClips);

    message.open({
      key: DETECT_SILENCE,
      type: 'success',
      content: 'Silence detected!',
      duration: 2,
    });
  }, [detectSilence, minSilenceLen, minNonSilenceLen, silenceThresh, padding]);

  const handleClick = useCallback(async () => {
    setIsDetectingSilence(true);
    setDetectSilenceModalOpen(true);

    const result = await detectSilence({
      minSilenceLen,
      minNonSilenceLen,
      silenceThresh,
      padding,
    });
    setIsDetectingSilence(false);

    if (!result) {
      message.open({
        key: DETECT_SILENCE,
        type: 'error',
        content: 'Silence detection failed!',
        duration: 2,
      });
      return;
    }

    setSilentClips(result.silentClips);
    setNonSilentClips(result.nonSilentClips);

    message.open({
      key: DETECT_SILENCE,
      type: 'success',
      content: 'Silence detected!',
      duration: 2,
    });
  }, [detectSilence, minSilenceLen, minNonSilenceLen, silenceThresh, padding]);

  return (
    <>
      <Button
        disabled={!filePath || loading || isDetectingSilence}
        loading={isDetectingSilence}
        type="primary"
        onClick={handleClick}
        icon={<AudioOutlined />}
      >
        Detect silence
      </Button>
      <Modal
        bodyStyle={{ height: '80vh' }}
        width="90vw"
        centered
        title="Silence detection parameters"
        open={detectSilenceModalOpen}
        onOk={() => onOk()}
        onCancel={() => {
          setDetectSilenceModalOpen(false);
        }}
        okText="Detect"
      >
        <Waveform waveformRef={waveformRef} onWheel={handleScroll} />
        <DetectSilenceForm
          minSilenceLen={minSilenceLen}
          minNonSilenceLen={minNonSilenceLen}
          silenceThresh={silenceThresh}
          padding={padding}
          setMinSilenceLen={setMinSilenceLen}
          setMinNonSilenceLen={setMinNonSilenceLen}
          setSilenceThresh={setSilenceThresh}
          setPadding={setPadding}
        />
      </Modal>
    </>
  );
};

export default SilenceDetector;
