import React from 'react';
import { theme, FloatButton } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  DoubleRightOutlined,
} from '@ant-design/icons';

import styles from './Waveform.module.scss';

interface WaveformProps {
  waveformRef: React.RefObject<HTMLDivElement>;
  playing: boolean;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onPlayPause: () => void;
}

const PLAYBACK_RATE_OPTIONS = [
  { label: '1.0x', value: 1.0 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2.0 },
];

const Waveform: React.FC<WaveformProps> = ({
  waveformRef,
  playing,
  playbackRate,
  onPlaybackRateChange,
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
        style={{ left: `calc(50% - ${token.controlHeightLG}px)` }}
      />

      <FloatButton.Group
        trigger="hover"
        style={{ left: `calc(50% + ${token.controlHeightLG / 2}px)` }}
        icon={<DoubleRightOutlined />}
      >
        {PLAYBACK_RATE_OPTIONS.map((option) => (
          <FloatButton
            key={option.value}
            description={option.label}
            type={option.value === playbackRate ? 'primary' : 'default'}
            onClick={() => onPlaybackRateChange(option.value)}
          />
        ))}
      </FloatButton.Group>
    </>
  );
};

export default Waveform;
