import {
  forwardRef,
  useMemo,
  FC,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Card, Typography, Input, Space, InputRef } from 'antd';

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
    const searchRef = useRef<InputRef>(null);
    const percentile10thIntervalBetweenSegments = useMemo(() => {
      const intervalsBetweenSegments = transcription
        .map(({ start }, index) => start - (transcription[index - 1]?.end || 0))
        .filter((interval) => interval > 0)
        .sort((a, b) => a - b);

      const index = Math.floor(intervalsBetweenSegments.length * 0.1);

      return intervalsBetweenSegments[index];
    }, [transcription]);

    const onSearch = useCallback((query: string) => {
      if (!window.find(query, false, false, false, false, false, true)) return;

      const selection = window.getSelection();

      if (!selection) return;

      selection.focusNode?.parentElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, []);

    useEffect(() => {
      const handleKeyPress = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
          event.preventDefault();
          searchRef.current?.focus({ cursor: 'all', preventScroll: true });
        }
      };

      document.addEventListener('keydown', handleKeyPress);

      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }, []);

    return (
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <div className={styles.searchCard}>
          <Search
            ref={searchRef}
            allowClear
            placeholder="Start typing to search..."
            onSearch={onSearch}
            enterButton
            className={styles.search}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>

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
