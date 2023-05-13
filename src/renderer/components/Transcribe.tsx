import React, { useState, useMemo, useCallback } from 'react';
import { Button, Input, message, Spin } from 'antd';
import './Transcribe.scss';
import { Segment } from '../../shared/types';

interface TranscribeProps {
  disabled: boolean;
  pathToAudioFile: string | null;
}

const Transcribe: React.FC<TranscribeProps> = ({
  disabled,
  pathToAudioFile,
}) => {
  const [transcription, setTranscription] = useState<Segment[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTranscription, setShowTranscription] = useState<boolean>(true);

  const transcriptionText = useMemo(() => {
    if (!transcription) return '';
    return transcription.map((segment) => segment.text).join('');
  }, [transcription]);

  const onTranscribe = useCallback(async () => {
    if (!pathToAudioFile) {
      message.error('Please select an audio file first.');
      return;
    }

    setIsLoading(true);

    try {
      message.info(`Transcribing... ${pathToAudioFile}`);
      setTranscription(await window.electron.transcribe(pathToAudioFile, 'uk'));
    } catch (error) {
      message.error(`Transcription failed. ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [pathToAudioFile]);

  const toggleTranscription = useCallback(() => {
    setShowTranscription((prev) => !prev);
  }, []);

  return (
    <div className="transcribe">
      <Spin spinning={isLoading}>
        <Button disabled={disabled} onClick={onTranscribe}>
          Transcribe
        </Button>
        <Button disabled={disabled} onClick={toggleTranscription}>
          {showTranscription ? 'Hide' : 'Show'} Transcription
        </Button>
      </Spin>
      {showTranscription && transcription && (
        <Input.TextArea
          value={transcriptionText}
          className="transcription-text"
          readOnly
          autoSize={{ minRows: 3, maxRows: 20 }}
        />
      )}
    </div>
  );
};

export default Transcribe;
