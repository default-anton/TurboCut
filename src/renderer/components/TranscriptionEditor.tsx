import { forwardRef, useMemo, FC, ReactNode } from 'react';
import { Card, Typography, Input, Space } from 'antd';

import { Transcription } from 'shared/types';
import styles from './TranscriptionEditor.module.scss';

const { Text, Paragraph } = Typography;

const { Search } = Input;

interface IfParagraphProps {
  condition: boolean;
  children: ReactNode;
  id: number;
}

const IfParagraph: FC<IfParagraphProps> = ({ condition, children, id }) =>
  condition ? <Paragraph data-segment-id={id}>{children}</Paragraph> : children;

interface Props {
  transcription: Transcription;
  segmentAtPlayhead: number;
  disabledSegmentIds: Set<number>;
  selectedSegmentIds: Set<number>;
  onMouseEnterSegment: (id: number) => void;
  onMouseLeaveSegment: () => void;
}

const TranscriptionEditor = forwardRef<HTMLElement, Props>(
  (
    {
      transcription,
      segmentAtPlayhead,
      disabledSegmentIds,
      selectedSegmentIds,
      onMouseEnterSegment,
      onMouseLeaveSegment,
    },
    ref
  ) => {
    const percentile10thIntervalBetweenSegments = useMemo(() => {
      const intervalsBetweenSegments = transcription
        .map(({ start }, index) => start - (transcription[index - 1]?.end || 0))
        .filter((interval) => interval > 0)
        .sort((a, b) => a - b);

      const index = Math.floor(intervalsBetweenSegments.length * 0.1);

      return intervalsBetweenSegments[index];
    }, [transcription]);

    const onSearch = (value: string) => console.log(value);

    return (
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <Card className={styles.searchCard}>
          <Search
            placeholder="Start typing to search..."
            onSearch={onSearch}
            enterButton
            className={styles.search}
          />
        </Card>

        <Card className={styles.card}>
          {transcription.map(({ id, text, start }, index) => (
            <IfParagraph
              key={`${id}-gap`}
              id={id}
              condition={
                start - (transcription[index - 1]?.end || 0) >
                percentile10thIntervalBetweenSegments
              }
            >
              <Text
                ref={id === segmentAtPlayhead ? ref : null}
                delete={disabledSegmentIds.has(id)}
                data-segment-id={id}
                className={`${styles.text} ${
                  selectedSegmentIds.has(id) ? styles['text--selected'] : ''
                }`}
                mark={id === segmentAtPlayhead}
                onMouseEnter={() => onMouseEnterSegment(id)}
                onMouseLeave={() => onMouseLeaveSegment()}
              >
                {text}
              </Text>
            </IfParagraph>
          ))}
        </Card>
      </Space>
    );
  }
);

export default TranscriptionEditor;
