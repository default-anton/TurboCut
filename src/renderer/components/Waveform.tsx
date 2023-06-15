import React from 'react';
import { theme, FloatButton } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

import styles from './Waveform.module.scss';

interface WaveformProps {
  waveformRef: React.RefObject<HTMLDivElement>;
  playing: boolean;
  onPlayPause: () => void;
}

const Waveform: React.FC<WaveformProps> = ({
  waveformRef,
  playing,
  onPlayPause,
}) => {
  const { token } = theme.useToken();

  return (
    <>
      <div className={styles.waveform} ref={waveformRef} />
      <div id="waveform-timeline" className={styles['waveform-timeline']} />

      <FloatButton
        onClick={onPlayPause}
        type={playing ? 'default' : 'primary'}
        icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        tooltip={<div>{playing ? 'Pause' : 'Play'}</div>}
        style={{ right: `calc(50% - ${token.controlHeightLG}px)` }}
      />
    </>
  );
};

export default Waveform;
