import React, { useCallback, useEffect } from 'react';
import { Button, Col, Form, Input, Row, Select, Spin } from 'antd';
import { FormOutlined } from '@ant-design/icons';

import styles from './CreateTranscriptionForm.module.scss';
import { TranscriptionBackend } from '../../shared/types';
import { useLanguages } from '../hooks/useLanguages';

interface TranscribeProps {
  loading: boolean;
  onTranscribe: (
    languageCode: string,
    backend: TranscriptionBackend
  ) => Promise<void>;
}

type FormValues = {
  languageCode: string;
  backend: TranscriptionBackend;
  apiKey: string;
};

const CreateTranscriptionForm: React.FC<TranscribeProps> = ({
  loading,
  onTranscribe,
}) => {
  const [form] = Form.useForm<FormValues>();
  const backendWatch = Form.useWatch('backend', form);
  const { languages } = useLanguages(backendWatch as TranscriptionBackend);

  useEffect(() => {
    const asyncEffect = async () => {
      if (backendWatch === TranscriptionBackend.OpenAIWhisper) {
        const key = await window.electron.getOpenAiApiKey();
        form.setFieldsValue({ apiKey: key });
      }
    };

    asyncEffect();
  }, [backendWatch, form]);

  const onFinish = useCallback(
    async ({ languageCode, backend, apiKey }: FormValues) => {
      if (backend === TranscriptionBackend.OpenAIWhisper) {
        await window.electron.setOpenAiApiKey(apiKey);
      }

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
          initialValues={{
            languageCode: 'en',
            backend: TranscriptionBackend.OpenAIWhisper,
          }}
          onFinish={onFinish}
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
                <Select
                  showSearch
                  filterOption={(input, option) =>
                    Boolean(
                      option?.value?.toString().includes(input.toLowerCase()) ||
                        option?.children
                          ?.toString()
                          .toLowerCase()
                          .includes(input.toLowerCase())
                    )
                  }
                >
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
                <Select>
                  {Object.entries(TranscriptionBackend).map(([key, value]) => (
                    <Select.Option key={key} value={value}>
                      {key}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {backendWatch === TranscriptionBackend.OpenAIWhisper && (
              <Col span={24}>
                <Form.Item
                  label="OpenAI API Key"
                  name="apiKey"
                  required
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your OpenAI API Key',
                    },
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
            )}
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
