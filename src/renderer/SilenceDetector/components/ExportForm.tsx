import React from 'react';
import { Form, Row, Col, Spin, Select } from 'antd';

import styles from './ExportForm.module.scss';

interface ExportFormProps {
  loading: boolean;
  frameRate: number;
  setFrameRate: (frameRate: number) => void;
}

export const ExportForm: React.FC<ExportFormProps> = ({
  loading,
  frameRate,
  setFrameRate,
}) => (
  <Spin spinning={loading}>
    <Form layout="vertical">
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="Frame Rate" extra="Frames per second">
            <Select
              defaultValue={frameRate.toString()}
              className={styles.select}
              onChange={(value: string) => setFrameRate(parseFloat(value))}
              options={[
                { value: '23.976', label: '23.976' },
                { value: '24', label: '24' },
                { value: '25', label: '25' },
                { value: '29.97', label: '29.97' },
                { value: '30', label: '30' },
                { value: '50', label: '50' },
                { value: '59.94', label: '59.94' },
                { value: '60', label: '60' },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </Spin>
);

export default ExportForm;
