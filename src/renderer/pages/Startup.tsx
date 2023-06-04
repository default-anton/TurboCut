import { FC } from 'react';
import { Row, Col, Space, Card, Button, Typography } from 'antd';
import styles from './Startup.module.scss';

import { useProjectConfig } from '../hooks/useProjectConfig';

const { Title } = Typography;

const Startup: FC = () => {
  const { openProject, createProject } = useProjectConfig();

  return (
    <Row className={styles.startupPage}>
      <Col>
        <Card className={styles.startupCard}>
          <Title level={2}>Welcome to TurboCut</Title>
          <Space
            direction="vertical"
            size="middle"
            className={styles.buttonSpace}
          >
            <Button
              className={`${styles.button}`}
              type="primary"
              onClick={openProject}
            >
              Open Existing Project
            </Button>
            <Button
              className={`${styles.button} ${styles.createButton}`}
              type="primary"
              onClick={createProject}
            >
              Create New Project
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default Startup;
