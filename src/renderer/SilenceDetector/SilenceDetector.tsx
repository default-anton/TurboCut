import React, { useCallback, useState } from 'react';
import { message, Button, Layout, Modal, Row, Col, Space, Card } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';
import { AudioOutlined, DownloadOutlined } from '@ant-design/icons';

import { Interval } from '../../shared/types';
import AudioFileInput from './components/AudioFileInput';
import DetectSilenceForm from './components/DetectSilenceForm';
import ExportForm from './components/ExportForm';
import Waveform from './components/Waveform';
import { useAudioFileInput } from './hooks/useAudioFileInput';
import { useSilenceDetection } from './hooks/useSilenceDetection';
import { useConvertToMonoMp3 } from './hooks/useConvertToMonoMp3';
import { useWaveSurfer } from './hooks/useWaveSurfer';
import { DETECT_SILENCE } from '../messages';

import './SilenceDetector.scss';

interface SilenceDetectorProps {}

const SilenceDetector: React.FC<SilenceDetectorProps> = () => {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDetectingSilence, setIsDetectingSilence] = useState<boolean>(false);
  const [frameRate, setFrameRate] = useState<number>(23.976);
  const [minSilenceLen, setMinSilenceLen] = useState<number>(1);
  const [minNonSilenceLen, setMinNonSilenceLen] = useState<number>(1);
  const [silenceThresh, setSilenceThresh] = useState<number>(-30);
  const [padding, setPadding] = useState<number>(0.2);
  const [intervals, setIntervals] = useState<Array<Interval>>([]);
  const [detectSilenceModalOpen, setDetectSilenceModalOpen] =
    useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const handleFileChange = useAudioFileInput(
    setInputFile,
    setIsLoading,
    setIntervals
  );
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
  const { outputPath: audioFileOutputPath } = useConvertToMonoMp3(
    inputFile,
    setIsLoading
  );
  const { waveformRef, handleScroll, duration } = useWaveSurfer(
    audioFileOutputPath,
    isLoading,
    setIsLoading,
    intervals
  );

  const exportToDavinciResolve = useCallback(async () => {
    if (!inputFile) {
      message.error('Please select a file first');
      return;
    }

    // const clipName should basename of inputFile
    const clipName = inputFile.path.split('/').pop() as string;
    setIsExporting(true);
    message.loading({
      content: 'Exporting EDL file...',
      duration: 0,
      key: 'exporting',
    });

    setExportModalOpen(false);
    const exported = await window.electron.createEDLWithSilenceRemoved(
      intervals,
      { duration, frameRate, path: inputFile.path },
      clipName
    );

    setIsExporting(false);
    if (exported) {
      message.success({ content: 'EDL file exported!', key: 'exporting' });
    } else {
      message.warning({ content: 'Export cancelled', key: 'exporting' });
    }
  }, [inputFile, intervals, duration, frameRate]);

  const showDetectSilenceModal = () => {
    setDetectSilenceModalOpen(true);
  };

  const showExportModal = () => {
    setExportModalOpen(true);
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
                  loading={isLoading}
                  onChange={handleFileChange}
                />
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
          <Col style={{ width: '80%', maxWidth: '1200px' }}>
            <Button
              disabled={!inputFile || isLoading || isDetectingSilence}
              loading={isDetectingSilence}
              type="primary"
              onClick={showDetectSilenceModal}
              icon={<AudioOutlined />}
              style={{ marginTop: '1rem' }}
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
          </Col>
        </Row>
        <Row justify="center">
          <Col style={{ width: '80%', maxWidth: '1200px' }}>
            <Button
              type="primary"
              onClick={showExportModal}
              icon={<DownloadOutlined />}
              loading={isExporting}
              disabled={!inputFile || isLoading || isExporting}
              style={{ marginTop: '1rem' }}
            >
              Export to Davinci Resolve
            </Button>
            <Modal
              title="Export Davinci Resolve EDL"
              open={exportModalOpen}
              onOk={() => exportToDavinciResolve()}
              onCancel={() => {
                setExportModalOpen(false);
              }}
              okText="Export"
            >
              <ExportForm frameRate={frameRate} setFrameRate={setFrameRate} />
            </Modal>
          </Col>
        </Row>
      </Content>
      <Footer />
    </Layout>
  );
};

export default SilenceDetector;
