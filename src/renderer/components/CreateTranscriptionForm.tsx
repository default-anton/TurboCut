import React, { useState, useCallback } from 'react';
import { Button, Col, Form, Row, Select, Spin } from 'antd';
import { FormOutlined, EditOutlined, SoundOutlined } from '@ant-design/icons';

import styles from './CreateTranscriptionForm.module.scss';

interface TranscribeProps {
  loading: boolean;
  disabled: boolean;
  onTranscribe: (languageCode: string) => Promise<void>;
}

const CreateTranscriptionForm: React.FC<TranscribeProps> = ({
  loading,
  onTranscribe,
}) => {
  const [form] = Form.useForm<{ languageCode: string }>();

  const onSubmit = useCallback(
    async ({ languageCode }: { languageCode: string }) => {
      await onTranscribe(languageCode);
    },
    [onTranscribe]
  );

  return (
    <div className={styles.transcribe}>
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="horizontal"
          initialValues={{ languageCode: 'en' }}
          onFinish={onSubmit}
          requiredMark
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Transcription Language"
                name="languageCode"
                required
                tooltip="The language of the audio or video file to transcribe"
              >
                <Select defaultValue="en">
                  {/* TODO: Add more languages */}
                  <Select.Option value="en">English</Select.Option>
                  <Select.Option value="uk">Ukrainian</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item>
                <Button
                  icon={<FormOutlined />}
                  aria-label="Start Transcription"
                  htmlType="submit"
                >
                  Transcribe
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </div>
  );
};

export default CreateTranscriptionForm;
