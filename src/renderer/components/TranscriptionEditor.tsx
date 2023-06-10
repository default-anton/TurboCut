import { forwardRef } from 'react';
import { Card, Typography } from 'antd';

import { Transcription } from 'shared/types';
import styles from './TranscriptionEditor.module.scss';

const { Text } = Typography;

interface Props {
  transcription: Transcription;
  segmentAtPlayhead: number | null;
  disabledSegmentIds: Set<number>;
}

const TranscriptionEditor = forwardRef<HTMLElement, Props>(
  ({ transcription, segmentAtPlayhead, disabledSegmentIds }, ref) => (
    <Card className={styles.card}>
      {transcription.map(({ id, text }) => (
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
      ))}
    </Card>
  )
);

export default TranscriptionEditor;
