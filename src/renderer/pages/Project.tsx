import { useState, FC } from 'react';
import { Row, Col, Space, Card } from 'antd';

import AudioFileInput from '../components/AudioFileInput';
import Waveform from '../components/Waveform';
import ExportButton from '../components/ExportButton';
import SilenceDetector from '../components/SilenceDetector';
import TranscriptionButton from '../components/TranscriptionButton';
import TranscriptionView from '../components/TranscriptionView';

import { useTimelineAudioFile } from '../hooks/useTimelineAudioFile';
import { useWaveform } from '../hooks/useWaveform';
import { useExport } from '../hooks/useExport';
import { useSilenceDetection } from '../hooks/useSilenceDetection';
import { useTranscription } from '../hooks/useTranscription';
import { useProjectConfig } from '../hooks/useProjectConfig';

import { Clip } from '../../shared/types';

import 'antd/dist/reset.css';

const CLIPS: Clip[] = [];

const Project: FC = () => {
  const { projectConfig: { transcription } = {} } = useProjectConfig();
  const { isLoading, stopLoading, timelineDuration, pathToTimelineAudioFile } =
    useTimelineAudioFile();
  const { detectSilence } = useSilenceDetection();
  const { waveformRef, handleScroll } = useWaveform({
    filePath: pathToTimelineAudioFile,
    duration: timelineDuration,
    clips: CLIPS,
    stopLoading,
    skipRegions: false,
  });
  const { exportTimeline, isExporting } = useExport();
  const { isLoading: isTranscribing, transcribe } = useTranscription(
    pathToTimelineAudioFile
  );
  const [activeSegment, setActiveSegment] = useState<number>(0);

  return (
    <>
      <Row justify="center">
        <Col className="col">
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Card size="small">
              <AudioFileInput loading={isLoading} />
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
              duration={timelineDuration}
              loading={isLoading}
              detectSilence={detectSilence}
            />
            <ExportButton
              handleExport={exportTimeline}
              loading={isExporting}
              disabled={!pathToTimelineAudioFile || isLoading || isExporting}
            />
            <TranscriptionButton
              loading={isTranscribing}
              disabled={!pathToTimelineAudioFile || isLoading || isExporting}
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
    </>
  );
};

export default Project;
