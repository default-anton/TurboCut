import React, { useCallback, useState } from 'react';
import { message, Button, Modal } from 'antd';
import { AudioOutlined } from '@ant-design/icons';

import DetectSilenceForm from './DetectSilenceForm';
import { DETECT_SILENCE } from '../messages';
import { UseSilenceDetection } from '../hooks/useSilenceDetection';

interface SilenceDetectorProps {
  inputFile: File | null;
  loading: boolean;
  detectSilence: UseSilenceDetection['detectSilence'];
}

const SilenceDetector: React.FC<SilenceDetectorProps> = ({
  inputFile,
  loading,
  detectSilence,
}) => {
  const [isDetectingSilence, setIsDetectingSilence] = useState<boolean>(false);
  const [minSilenceLen, setMinSilenceLen] = useState<number>(1);
  const [minNonSilenceLen, setMinNonSilenceLen] = useState<number>(0.8);
  const [silenceThresh, setSilenceThresh] = useState<number>(-33);
  const [padding, setPadding] = useState<number>(0.2);
  const [detectSilenceModalOpen, setDetectSilenceModalOpen] =
    useState<boolean>(false);

  const handleDetectSilenceClick = useCallback(async () => {
    setDetectSilenceModalOpen(false);
    setIsDetectingSilence(true);
    message.open({
      key: DETECT_SILENCE,
      type: 'loading',
      content: 'Detecting silence...',
      duration: 0,
    });

    await detectSilence({
      minSilenceLen,
      minNonSilenceLen,
      silenceThresh,
      padding,
    });

    message.open({
      key: DETECT_SILENCE,
      type: 'success',
      content: 'Silence detected!',
      duration: 2,
    });
    setIsDetectingSilence(false);
    setDetectSilenceModalOpen(false);
  }, [detectSilence, minSilenceLen, minNonSilenceLen, silenceThresh, padding]);

  const showDetectSilenceModal = useCallback(() => {
    setDetectSilenceModalOpen(true);
  }, [setDetectSilenceModalOpen]);

  return (
    <>
      <Button
        disabled={!inputFile || loading || isDetectingSilence}
        loading={isDetectingSilence}
        type="primary"
        onClick={showDetectSilenceModal}
        icon={<AudioOutlined />}
      >
        Detect silence
      </Button>
      <Modal
        title="Silence detection parameters"
        open={detectSilenceModalOpen}
        onOk={() => handleDetectSilenceClick()}
        onCancel={() => {
          setDetectSilenceModalOpen(false);
        }}
        okText="Detect"
      >
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
