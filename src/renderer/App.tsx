import { useState } from 'react';
import { message, Layout, Row, Col, Space, Card } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';

import AudioFileInput from './components/AudioFileInput';
import Waveform from './components/Waveform';
import ExportButton from './components/ExportButton';
import SilenceDetector from './components/SilenceDetector';
import TranscriptionButton from './components/TranscriptionButton';
import TranscriptionView from './components/TranscriptionView';

import { useAudioFileInput } from './hooks/useAudioFileInput';
import { useWaveform } from './hooks/useWaveform';
import { useExport } from './hooks/useExport';
import { useSilenceDetection } from './hooks/useSilenceDetection';
import { useTranscription } from './hooks/useTranscription';

import 'antd/dist/reset.css';

import './App.scss';

export default function App() {
  const [, contextHolder] = message.useMessage();
  const { inputFile, setInputFile, isLoading, stopLoading, pathToAudioFile } =
    useAudioFileInput();
  const { silentClips, nonSilentClips, detectSilence } =
    useSilenceDetection(inputFile);
  const { waveformRef, handleScroll, duration } = useWaveform(
    pathToAudioFile,
    isLoading,
    stopLoading,
    silentClips
  );
  const { exportTimeline, isExporting } = useExport(
    inputFile,
    silentClips,
    duration
  );
  const {
    isLoading: isTranscribing,
    transcription,
    transcribe,
  } = useTranscription(pathToAudioFile, nonSilentClips);
  const [activeSegment, setActiveSegment] = useState<number>(0);

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
                    silentClips.length === 0 ||
                    !inputFile ||
                    isLoading ||
                    isExporting
                  }
                />
                <TranscriptionButton
                  loading={isTranscribing}
                  disabled={
                    !inputFile || !pathToAudioFile || isLoading || isExporting
                  }
                  onTranscribe={transcribe}
                />
              </Space>
            </Col>
          </Row>
          {transcription && (
            <Row justify="center">
              <Col className="col">
                <Space direction="horizontal" size="middle">
                  <TranscriptionView
                    transcription={transcription}
                    activeSegment={activeSegment}
                  />
                </Space>
              </Col>
            </Row>
          )}
        </Content>
        <Footer />
      </Layout>
    </>
  );
}
