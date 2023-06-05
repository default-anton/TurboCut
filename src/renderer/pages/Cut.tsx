import { FC, useEffect, useState } from 'react';
import { Card, Col, Row, Typography } from 'antd';

import { useProjectConfig } from 'renderer/hooks/useProjectConfig';

const { Text } = Typography;

import styles from './Cut.module.scss';

const Cut: FC = () => {
  const {
    projectConfig: { transcription },
  } = useProjectConfig();
  const [disabledSegmentIds, setDisabledSegmentIds] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        const selection = window.getSelection();

        if (!selection) return;

        const selectedSegmentIds = new Set<number>();

        for (let i = 0; i < selection.rangeCount; i++) {
          const range = selection.getRangeAt(i);
          const startParent = range.startContainer.parentElement;
          const endParent = range.endContainer.parentElement;

          if (!startParent || !endParent) break;

          if (
            startParent &&
            startParent.dataset?.segmentId &&
            endParent &&
            endParent.dataset?.segmentId
          ) {
            const from = parseInt(startParent.dataset.segmentId || '-1', 10);
            const to = parseInt(endParent.dataset.segmentId || '-1', 10);

            if (from !== -1 && to !== -1) {
              for (let j = from; j <= to; j++) {
                selectedSegmentIds.add(j);
              }
            }
          }
        }

        // Merge selectedSegmentIds into disabledSegmentIds
        setDisabledSegmentIds(
          (prevDisabledSegmentIds) =>
            new Set([
              ...Array.from(prevDisabledSegmentIds),
              ...Array.from(selectedSegmentIds),
            ])
        );
      }
    };

    window.addEventListener('keyup', handleKeyUp);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <Row justify="center">
      <Col className="col">
        <Card className={styles.card}>
          {transcription.map(({ id, text }) => (
            <Text
              key={id}
              delete={disabledSegmentIds.has(id)}
              data-segment-id={id}
              className={styles.text}
            >
              {text}
            </Text>
          ))}
        </Card>
      </Col>
    </Row>
  );
};

export default Cut;
