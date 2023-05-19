import React from 'react';

import styles from './Waveform.module.scss';

interface WaveformProps {
  waveformRef: React.RefObject<HTMLDivElement>;
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  isLoading: boolean;
}

const Waveform: React.FC<WaveformProps> = ({
  waveformRef,
  onWheel,
  isLoading,
}) => (
  <>
    <div
      className={styles.waveform}
      ref={waveformRef}
      onWheel={onWheel}
      style={{ visibility: isLoading ? 'hidden' : 'visible' }}
    />
    <div
      id="waveform-timeline"
      className={styles['waveform-timeline']}
      style={{ visibility: isLoading ? 'hidden' : 'visible' }}
    />
  </>
);

export default Waveform;
