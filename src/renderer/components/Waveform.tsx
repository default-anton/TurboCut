import React from 'react';

import styles from './Waveform.module.scss';

interface WaveformProps {
  waveformRef: React.RefObject<HTMLDivElement>;
  loading?: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ waveformRef, loading }) => (
  <>
    <div
      className={styles.waveform}
      ref={waveformRef}
      style={{ visibility: loading ? 'hidden' : 'visible' }}
    />
    <div
      id="waveform-timeline"
      className={styles['waveform-timeline']}
      style={{ visibility: loading ? 'hidden' : 'visible' }}
    />
  </>
);

Waveform.defaultProps = {
  loading: false,
};

export default Waveform;
