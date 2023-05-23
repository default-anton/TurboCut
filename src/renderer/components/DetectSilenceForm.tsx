import { FC, useCallback } from 'react';
import { Form, InputNumber, Row, Col, Button, message } from 'antd';
import {
  ClockCircleOutlined,
  AudioOutlined,
  BorderOutlined,
  SoundOutlined,
} from '@ant-design/icons';

import { SilenceDetectionSettings } from '../hooks/useSilenceDetection';

import styles from './DetectSilenceForm.module.scss';

interface DetectSilenceFormProps {
  settings: SilenceDetectionSettings;
  onSubmit: (settings: SilenceDetectionSettings) => Promise<void>;
  onApply: () => Promise<void>;
}

const DetectSilenceForm: FC<DetectSilenceFormProps> = ({
  settings,
  onSubmit,
  onApply,
}) => {
  const [form] = Form.useForm<SilenceDetectionSettings>();

  const handleApply = useCallback(() => {
    form
      .validateFields()
      .then(() => onApply())
      .catch((err: any) => {
        message.error(`Error applying silence detection: ${err.message}`);
      });
  }, [form, onApply]);

  return (
    <Form
      form={form}
      layout="horizontal"
      initialValues={settings}
      onFinish={onSubmit}
      requiredMark
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="Minimum Silence Length"
            name="minSilenceLen"
            extra="Seconds"
            required
            tooltip="The minimum length of silence to detect in seconds"
          >
            <InputNumber
              step={0.1}
              min={0.1}
              className={styles['input-number']}
              addonBefore={<ClockCircleOutlined />}
            />
          </Form.Item>
          <Form.Item
            label="Minimum Non-Silence Length"
            name="minNonSilenceLen"
            extra="Seconds"
            required
            tooltip="The minimum length of non-silence to detect in seconds"
          >
            <InputNumber
              step={0.1}
              min={0.0}
              className={styles['input-number']}
              addonBefore={<ClockCircleOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="Silence Threshold"
            name="silenceThresh"
            extra="dB"
            required
            tooltip="The threshold in dB below which audio is considered silence"
          >
            <InputNumber
              step={0.1}
              max={0}
              min={-100}
              className={styles['input-number']}
              addonBefore={<AudioOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="Padding"
            extra="Seconds"
            name="padding"
            required
            tooltip="The amount of padding to add to the start and end of the audio in seconds"
          >
            <InputNumber
              step={0.1}
              min={0}
              className={styles['input-number']}
              addonBefore={<BorderOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item>
            <Button icon={<AudioOutlined />} htmlType="submit">
              Detect silence
            </Button>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item>
            <Button
              type="primary"
              icon={<SoundOutlined />}
              onClick={handleApply}
            >
              Apply silence detection
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default DetectSilenceForm;
