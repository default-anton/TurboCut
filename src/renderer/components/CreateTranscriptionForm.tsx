import React, { useCallback } from 'react';
import { Button, Col, Form, Row, Select, Spin } from 'antd';
import { FormOutlined } from '@ant-design/icons';

import styles from './CreateTranscriptionForm.module.scss';
import { TranscriptionBackend } from '../../shared/types';
import { useLanguages } from '../hooks/useLanguages';

interface TranscribeProps {
  loading: boolean;
  disabled: boolean;
  onTranscribe: (
    languageCode: string,
    backend: TranscriptionBackend
  ) => Promise<void>;
}

type FormValues = {
  languageCode: string;
  backend: TranscriptionBackend;
};

const CreateTranscriptionForm: React.FC<TranscribeProps> = ({
  loading,
  onTranscribe,
}) => {
  const [form] = Form.useForm<FormValues>();
  const backendWatch = Form.useWatch('backend', form);

  const { languages } = useLanguages(backendWatch as TranscriptionBackend);

  const onSubmit = useCallback(
    async ({ languageCode, backend }: FormValues) => {
      await onTranscribe(languageCode, backend);
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
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          requiredMark
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Language of the video/audio"
                name="languageCode"
                required
                tooltip="The language of the audio or video file to transcribe"
              >
                <Select defaultValue="en">
                  {languages.map((language) => (
                    <Select.Option key={language.code} value={language.code}>
                      {language.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Backend"
                name="backend"
                required
                tooltip="The backend to use for transcription"
              >
                <Select defaultValue={TranscriptionBackend.OpenAIWhisper}>
                  {/* TODO: Add more backends */}
                  {Object.entries(TranscriptionBackend).map(([key, value]) => (
                    <Select.Option key={key} value={value}>
                      {key}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
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
