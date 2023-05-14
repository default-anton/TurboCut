import React from 'react';
import { Transcription } from '../../shared/types';

import styles from './TranscriptionView.module.scss';

interface TranscriptionViewProps {
  transcription: Transcription;
  activeSegment: number;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({
  transcription,
  activeSegment,
}) => {
  return (
    <div className={styles.container}>
      {transcription.length > 0 ? (
        transcription.map((segment, index) => (
          <p
            key={segment.segmentId}
            className={`${styles.segment} ${
              index === activeSegment ? styles['segment--active'] : ''
            }`}
            title={`Start Time: ${segment.start}, End Time: ${segment.end}`} // Display timestamps on hover
          >
            {segment.text}
          </p>
        ))
      ) : (
        <p className={`${styles.segment} ${styles['segment--empty']}`}>
          No transcription available
        </p>
      )}
    </div>
  );
};

export default TranscriptionView;
