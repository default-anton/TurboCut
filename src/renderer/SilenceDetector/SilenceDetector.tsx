import React, { useCallback, useState } from 'react';
import { message, Button, Layout, Modal, Row, Col, Space, Card } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';
import { AudioOutlined } from '@ant-design/icons';

import { Interval } from '../../shared/types';
import AudioFileInput from './components/AudioFileInput';
import DetectSilenceForm from './components/DetectSilenceForm';
import Waveform from './components/Waveform';
import { useAudioFileInput } from './hooks/useAudioFileInput';
import { useSilenceDetection } from './hooks/useSilenceDetection';
import { useWaveform } from './hooks/useWaveform';
import { DETECT_SILENCE } from '../messages';

import styles from './SilenceDetector.module.scss';
import ExportButton from './components/ExportButton';
import { useExport } from './hooks/useExport';

interface SilenceDetectorProps {}

const SilenceDetector: React.FC<SilenceDetectorProps> = () => {
  const [isDetectingSilence, setIsDetectingSilence] = useState<boolean>(false);
  const [minSilenceLen, setMinSilenceLen] = useState<number>(1);
  const [minNonSilenceLen, setMinNonSilenceLen] = useState<number>(0.8);
  const [silenceThresh, setSilenceThresh] = useState<number>(-33);
  const [padding, setPadding] = useState<number>(0.2);
  const [intervals, setIntervals] = useState<Array<Interval>>([]);
  const [detectSilenceModalOpen, setDetectSilenceModalOpen] =
    useState<boolean>(false);
  const resetIntervals = useCallback(() => {
    setIntervals([]);
  }, []);

  const { inputFile, setInputFile, isLoading, stopLoading, pathToAudioFile } =
    useAudioFileInput(resetIntervals);
  const handleDetectSilenceClick = useSilenceDetection(
    inputFile,
    minSilenceLen,
    minNonSilenceLen,
    silenceThresh,
    padding,
    setIntervals,
    () => {
      setDetectSilenceModalOpen(false);
      setIsDetectingSilence(true);
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
  const { waveformRef, handleScroll, duration } = useWaveform(
    pathToAudioFile,
    isLoading,
    stopLoading,
    intervals
  );
  const { exportTimeline, isExporting } = useExport(
    inputFile,
    intervals,
    duration
  );

  const showDetectSilenceModal = () => {
    setDetectSilenceModalOpen(true);
  };

  return (
    <Layout>
      <Content>
        <Row justify="center">
          <Col className={styles.col}>
            <Space
              direction="vertical"
              size="middle"
              style={{ display: 'flex' }}
            >
              <Card size="small">
                <AudioFileInput loading={isLoading} onChange={setInputFile} />
              </Card>
            </Space>
          </Col>
        </Row>
        <Waveform
          waveformRef={waveformRef}
          onWheel={handleScroll}
          isLoading={isLoading}
        />
        <Row justify="center">
          <Col className={styles.col}>
            <Space direction="horizontal" size="middle">
              <Button
                disabled={!inputFile || isLoading || isDetectingSilence}
                loading={isDetectingSilence}
                type="primary"
                onClick={showDetectSilenceModal}
                icon={<AudioOutlined />}
              >
                Detect silence
              </Button>
              <ExportButton
                handleExport={exportTimeline}
                loading={isExporting}
                disabled={
                  intervals.length === 0 ||
                  !inputFile ||
                  isLoading ||
                  isExporting
                }
              />
            </Space>
          </Col>
        </Row>
      </Content>
      <Footer />
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
    </Layout>
  );
};

export default SilenceDetector;
