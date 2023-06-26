import { FC, useCallback } from 'react';
import { Form, Row, Col, Button, message, Slider } from 'antd';
import { AudioOutlined, SoundOutlined } from '@ant-design/icons';

import { SilenceDetectionSettings } from '../hooks/useSilenceDetection';

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

  const msecFormatter = useCallback((value?: number) => {
    return `${value || 0} msec`;
  }, []);

  const dbFormatter = useCallback((value?: number) => {
    return `${value || 0} dB`;
  }, []);

  return (
    <Form
      form={form}
      layout="horizontal"
      initialValues={settings}
      onFinish={onSubmit}
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      requiredMark
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="Silence Threshold"
            name="silenceThresh"
            extra="dB"
            rules={[{ required: true }]}
            tooltip="The threshold in dB below which audio is considered silence"
          >
            <Slider min={-100} max={0} tooltip={{ formatter: dbFormatter }} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="Minimum Silence Duration"
            name="minSilenceLen"
            extra="msec"
            rules={[{ required: true }]}
            tooltip="The minimum duration of silence to remove in milliseconds"
          >
            <Slider
              min={0}
              max={10000}
              tooltip={{ formatter: msecFormatter }}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="Minimum Non-Silence Duration"
            name="minNonSilenceLen"
            extra="msec"
            rules={[{ required: true }]}
            tooltip="The minimum duration of non-silence to detect in milliseconds"
          >
            <Slider
              min={0}
              max={10000}
              tooltip={{ formatter: msecFormatter }}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="Start pad"
            extra="msec"
            name="startPad"
            rules={[{ required: true }]}
            tooltip="The amount of silence to add to the beginning of a clip in milliseconds"
          >
            <Slider
              min={0}
              max={10000}
              tooltip={{ formatter: msecFormatter }}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="End pad"
            extra="msec"
            name="endPad"
            rules={[{ required: true }]}
            tooltip="The amount of silence to add to the end of a clip in milliseconds"
          >
            <Slider
              min={0}
              max={10000}
              tooltip={{ formatter: msecFormatter }}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item style={{ float: 'left' }}>
            <Button icon={<AudioOutlined />} htmlType="submit">
              Detect silence
            </Button>
          </Form.Item>
          <Form.Item style={{ float: 'right' }}>
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
