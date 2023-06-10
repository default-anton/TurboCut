import { forwardRef, useMemo } from 'react';
import { Card, Typography } from 'antd';

import { Transcription } from 'shared/types';
import styles from './TranscriptionEditor.module.scss';

const { Text, Paragraph } = Typography;

interface Props {
  transcription: Transcription;
  segmentAtPlayhead: number | null;
  disabledSegmentIds: Set<number>;
}

const TranscriptionEditor = forwardRef<HTMLElement, Props>(
  ({ transcription, segmentAtPlayhead, disabledSegmentIds }, ref) => {
    const percentile10thIntervalBetweenSegments = useMemo(() => {
      const intervalsBetweenSegments = transcription
        .map(({ start }, index) => start - (transcription[index - 1]?.end || 0))
        .filter((interval) => interval > 0)
        .sort((a, b) => a - b);

      const index = Math.floor(intervalsBetweenSegments.length * 0.1);

      return intervalsBetweenSegments[index];
    }, [transcription]);

    return (
      <Card className={styles.card}>
        {transcription.map(
          ({ id, text, start }, index) =>
            (start - (transcription[index - 1]?.end || 0) >
              percentile10thIntervalBetweenSegments && (
              <Paragraph
                key={`${id}-gap`}
                className={styles.gap}
                data-segment-id={id}
              >
                <Text
                  ref={id === segmentAtPlayhead ? ref : null}
                  key={id}
                  delete={disabledSegmentIds.has(id)}
                  data-segment-id={id}
                  className={styles.text}
                  mark={id === segmentAtPlayhead}
                >
                  {text}
                </Text>
              </Paragraph>
            )) || (
              <Text
                ref={id === segmentAtPlayhead ? ref : null}
                key={id}
                delete={disabledSegmentIds.has(id)}
                data-segment-id={id}
                className={styles.text}
                mark={id === segmentAtPlayhead}
              >
                {text}
              </Text>
            )
        )}
      </Card>
    );
  }
);

export default TranscriptionEditor;
