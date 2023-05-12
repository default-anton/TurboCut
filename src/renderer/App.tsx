import { message, Layout, Row, Col, Space, Card } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';

import AudioFileInput from './components/AudioFileInput';
import Waveform from './components/Waveform';
import ExportButton from './components/ExportButton';
import SilenceDetector from './components/SilenceDetector';

import { useAudioFileInput } from './hooks/useAudioFileInput';
import { useWaveform } from './hooks/useWaveform';
import { useExport } from './hooks/useExport';
import { useSilenceDetection } from './hooks/useSilenceDetection';

import 'antd/dist/reset.css';
import './App.scss';

export default function App() {
  const [, contextHolder] = message.useMessage();
  const { inputFile, setInputFile, isLoading, stopLoading, pathToAudioFile } =
    useAudioFileInput();
  const { silentIntervals, detectSilence } = useSilenceDetection(inputFile);
  const { waveformRef, handleScroll, duration } = useWaveform(
    pathToAudioFile,
    isLoading,
    stopLoading,
    silentIntervals
  );
  const { exportTimeline, isExporting } = useExport(
    inputFile,
    silentIntervals,
    duration
  );

  return (
    <>
      {contextHolder}
      <Layout>
        <Content>
          <Row justify="center">
            <Col className="col">
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
            <Col className="col">
              <Space direction="horizontal" size="middle">
                <SilenceDetector
                  inputFile={inputFile}
                  loading={isLoading}
                  detectSilence={detectSilence}
                />
                <ExportButton
                  handleExport={exportTimeline}
                  loading={isExporting}
                  disabled={
                    silentIntervals.length === 0 ||
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
      </Layout>
    </>
  );
}
