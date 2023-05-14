import React, { useState, useCallback } from 'react';
import { Button, Modal, Select, Spin } from 'antd';

import styles from './TranscriptionButton.module.scss';

interface TranscribeProps {
  loading: boolean;
  disabled: boolean;
  onTranscribe: (languageCode: string) => Promise<void>;
}

const TranscriptionButton: React.FC<TranscribeProps> = ({
  loading,
  disabled,
  onTranscribe,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [languageCode, setLanguageCode] = useState('en');

  const onOk = useCallback(async () => {
    setIsModalVisible(false);
    await onTranscribe(languageCode);
  }, [languageCode, onTranscribe]);

  const showModal = useCallback(() => setIsModalVisible(true), []);
  const handleCancel = useCallback(() => setIsModalVisible(false), []);
  const handleLanguageChange = useCallback(
    (value: string) => setLanguageCode(value),
    []
  );

  return (
    <div className={styles.transcribe}>
      <Spin spinning={loading}>
        <Button
          disabled={disabled}
          onClick={showModal}
          aria-label="Start Transcription"
        >
          Transcribe
        </Button>
        <Modal
          title="Transcribe Settings"
          open={isModalVisible}
          onOk={onOk}
          onCancel={handleCancel}
        >
          <Select
            defaultValue="en"
            style={{ width: 120 }}
            onChange={handleLanguageChange}
          >
            {/* TODO: Add more languages */}
            <Select.Option value="en">English</Select.Option>
            <Select.Option value="uk">Ukrainian</Select.Option>
          </Select>
        </Modal>
      </Spin>
    </div>
  );
};

export default TranscriptionButton;
