import React, { useState } from 'react';
import { message, Button, Layout, Modal, Row, Col, Space, Card } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';
import { AudioOutlined } from '@ant-design/icons';

import { Interval } from '../../shared/types';
import AudioFileInput from './components/AudioFileInput';
import InputParameters from './components/InputParameters';
import AudioWaveformAnimation from './components/AudioWaveformAnimation';
import Waveform from './components/Waveform';
import { useAudioFileInput } from './hooks/useAudioFileInput';
import { useSilenceDetection } from './hooks/useSilenceDetection';
import { useConvertToMonoMp3 } from './hooks/useConvertToMonoMp3';
import { useWaveSurfer } from './hooks/useWaveSurfer';
import { DETECT_SILENCE } from '../messages';

import styles from './SilenceDetector.module.scss';

interface SilenceDetectorProps {}

const SilenceDetector: React.FC<SilenceDetectorProps> = () => {
  const [isDetectingSilence, setIsDetectingSilence] = useState<boolean>(false);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [minSilenceLen, setMinSilenceLen] = useState<number>(1);
  const [silenceThresh, setSilenceThresh] = useState<number>(-30);
  const [padding, setPadding] = useState<number>(0.2);
  const [intervals, setIntervals] = useState<Array<Interval>>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handleFileChange = useAudioFileInput(
    setInputFile,
    setIsLoading,
    setIntervals
  );
  const handleDetectSilenceClick = useSilenceDetection(
    inputFile,
    minSilenceLen,
    silenceThresh,
    padding,
    setIntervals,
    () => {
      message.open({
        key: DETECT_SILENCE,
        type: 'loading',
        content: 'Detecting silence...',
        duration: 0,
      });
    },
    () => {
      setIsDetectingSilence(false);
      message.open({
        key: DETECT_SILENCE,
        type: 'success',
        content: 'Silence detected!',
        duration: 2,
      });
    }
  );
  const { outputPath } = useConvertToMonoMp3(inputFile, setIsLoading);
  const { waveformRef, handleScroll } = useWaveSurfer(
    outputPath,
    isLoading,
    setIsLoading,
    intervals
  );

  const showModal = () => {
    setIsDetectingSilence(true);
    setModalVisible(true);
  };

  const handleOk = () => {
    handleDetectSilenceClick();
    setModalVisible(false);
  };

  const handleCancel = () => {
    setIsDetectingSilence(false);
    setModalVisible(false);
  };

  return (
    <Layout>
      <Content>
        <Row justify="center">
          <Col style={{ width: '80%', maxWidth: '1200px' }}>
            <Space
              direction="vertical"
              size="middle"
              style={{ display: 'flex' }}
            >
              <Card title="Video or Audio file" size="small">
                <AudioFileInput
                  loading={isLoading || isDetectingSilence}
                  onChange={handleFileChange}
                />
              </Card>
              <AudioWaveformAnimation loading={isLoading} />
            </Space>
          </Col>
        </Row>
        <Waveform
          waveformRef={waveformRef}
          onWheel={handleScroll}
          isLoading={isLoading}
        />
        <Row justify="center">
          <Col style={{ width: '80%', maxWidth: '1200px' }}>
            {inputFile && !isLoading && (
              <>
                <Button
                  type="primary"
                  onClick={showModal}
                  icon={<AudioOutlined />}
                  loading={isDetectingSilence}
                  style={{ marginTop: '1rem' }}
                >
                  Detect silence
                </Button>
                <Modal
                  title="Silence detection parameters"
                  open={modalVisible}
                  onOk={handleOk}
                  onCancel={handleCancel}
                  okText="Detect"
                >
                  <InputParameters
                    minSilenceLen={minSilenceLen}
                    silenceThresh={silenceThresh}
                    padding={padding}
                    setMinSilenceLen={setMinSilenceLen}
                    setSilenceThresh={setSilenceThresh}
                    setPadding={setPadding}
                  />
                </Modal>
              </>
            )}
          </Col>
        </Row>
      </Content>
      <Footer />
    </Layout>
  );
};

export default SilenceDetector;
