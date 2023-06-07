import { FC, useEffect, useState } from 'react';
import { Card, Col, Row, Typography } from 'antd';

import CutTimeline from 'renderer/components/CutTimeline';

import { useProjectConfig } from 'renderer/hooks/useProjectConfig';

import styles from './Cut.module.scss';

const { Text } = Typography;

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
          const start = range.startContainer.parentElement;
          const startParent = start?.parentElement;
          const end = range.endContainer.parentElement;
          const endParent = end?.parentElement;

          if (!start || !end) break;

          if (
            start &&
            (start.dataset?.segmentId || startParent?.dataset?.segmentId) &&
            end &&
            (end.dataset?.segmentId || endParent?.dataset?.segmentId)
          ) {
            const from = parseInt(
              start.dataset.segmentId ||
                startParent?.dataset?.segmentId ||
                '-1',
              10
            );
            const to = parseInt(
              end.dataset.segmentId || endParent?.dataset?.segmentId || '-1',
              10
            );

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
    <>
      <Row justify="center">
        <Col className="col">
          <CutTimeline disabledSegmentIds={disabledSegmentIds} />
        </Col>
      </Row>
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
    </>
  );
};

export default Cut;
