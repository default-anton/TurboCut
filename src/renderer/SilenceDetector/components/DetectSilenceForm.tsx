import React from 'react';
import { Form, InputNumber, Row, Col, Spin } from 'antd';
import {
  ClockCircleOutlined,
  AudioOutlined,
  BorderOutlined,
} from '@ant-design/icons';

import styles from './DetectSilenceForm.module.scss';

interface DetectSilenceFormProps {
  loading: boolean;
  minSilenceLen: number;
  setMinSilenceLen: (value: number) => void;
  silenceThresh: number;
  setSilenceThresh: (value: number) => void;
  padding: number;
  setPadding: (value: number) => void;
}

export const DetectSilenceForm: React.FC<DetectSilenceFormProps> = ({
  loading,
  minSilenceLen,
  setMinSilenceLen,
  silenceThresh,
  setSilenceThresh,
  padding,
  setPadding,
}) => (
  <Spin spinning={loading}>
    <Form layout="vertical">
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="Minimum Silence Length" extra="Seconds">
            <InputNumber
              value={minSilenceLen}
              onChange={(value) => value && setMinSilenceLen(value)}
              step={0.1}
              min={0.1}
              className={styles['input-number']}
              addonBefore={<ClockCircleOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="Silence Threshold" extra="dB">
            <InputNumber
              value={silenceThresh}
              onChange={(value) => value && setSilenceThresh(value)}
              step={0.1}
              max={0}
              min={-100}
              className={styles['input-number']}
              addonBefore={<AudioOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="Padding" extra="Seconds">
            <InputNumber
              value={padding}
              onChange={(value) => value && setPadding(value)}
              step={0.1}
              min={0}
              className={styles['input-number']}
              addonBefore={<BorderOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </Spin>
);

export default DetectSilenceForm;
