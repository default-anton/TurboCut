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
    const meanPauseInterval = useMemo(
      () =>
        transcription.reduce(
          (acc, { start }, index, array) =>
            index === 0 ? acc : acc + start - array[index - 1].end,
          0
        ) / transcription.length,
      [transcription]
    );

    return (
      <Card className={styles.card}>
        {transcription.map(
          ({ id, text, start }, index) =>
            (start - (transcription[index - 1]?.end || 0) >
              meanPauseInterval && (
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
