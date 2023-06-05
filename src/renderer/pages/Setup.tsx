import { useMemo, FC } from 'react';
import { Row, Col, Space, Card, Steps, theme } from 'antd';

import { ProjectStep } from '../../shared/types';

import AudioFileInput from '../components/AudioFileInput';
import SilenceDetector from '../components/SilenceDetector';
import CreateTranscriptionForm from '../components/CreateTranscriptionForm';

import { useSilenceDetection } from '../hooks/useSilenceDetection';
import { useTranscription } from '../hooks/useTranscription';
import { useProjectConfig } from '../hooks/useProjectConfig';

import 'antd/dist/reset.css';

const Setup: FC = () => {
  const { projectConfig: { projectStep } = {} } = useProjectConfig();
  const {
    isDetectingSilence,
    detectSilence,
    applySilenceDetection,
    settings: silenceDetectionSettings,
  } = useSilenceDetection();
  const { isTranscribing, transcribe } = useTranscription();

  const { token } = theme.useToken();

  const steps = useMemo(() => {
    return [
      {
        key: 'upload',
        title: 'Upload a video or audio file',
        description: 'Upload a video or audio file to get started',
      },
      {
        key: 'detect-silence',
        title: 'Detect Silence',
        description: 'Detect silence in the uploaded file',
      },
      {
        key: 'transcribe',
        title: 'Transcribe',
        description: 'Transcribe the audio file',
      },
    ];
  }, []);

  return (
    <Row justify="center">
      <Col className="col">
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <Steps current={projectStep} items={steps} />
          {projectStep === ProjectStep.SelectFile && (
            <Card>
              <AudioFileInput />
            </Card>
          )}
          {projectStep === ProjectStep.DetectSilence && (
            <Card>
              <SilenceDetector
                isDetectingSilence={isDetectingSilence}
                detectSilence={detectSilence}
                applySilenceDetection={applySilenceDetection}
                settings={silenceDetectionSettings}
              />
            </Card>
          )}
          {projectStep === ProjectStep.Transcribe && (
            <Card>
              <CreateTranscriptionForm
                loading={isTranscribing}
                onTranscribe={transcribe}
              />
            </Card>
          )}
        </Space>
      </Col>
    </Row>
  );
};

export default Setup;
