import React from 'react';
import { theme, FloatButton, Typography, Card, Slider } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
} from '@ant-design/icons';

import styles from './Waveform.module.scss';

const { Text } = Typography;

interface WaveformProps {
  waveformRef: React.RefObject<HTMLDivElement>;
  playing: boolean;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onPlayPause: () => void;
  gain: number;
  onChangeGain: (gain: number) => void;
}

const PLAYBACK_RATE_OPTIONS = [
  { label: '2.0x', value: 2.0 },
  { label: '1.5x', value: 1.5 },
  { label: '1.0x', value: 1.0 },
];

const Waveform: React.FC<WaveformProps> = ({
  waveformRef,
  playing,
  playbackRate,
  onPlaybackRateChange,
  onPlayPause,
  gain,
  onChangeGain,
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
        style={{ left: `calc(50% - ${token.controlHeightLG * 2}px)` }}
      />

      <FloatButton.Group
        trigger="hover"
        style={{ left: `calc(50% - ${token.controlHeightLG / 2}px)` }}
        icon={null}
        closeIcon={null}
        description={
          <Text>
            {
              PLAYBACK_RATE_OPTIONS.find(
                (option) => option.value === playbackRate
              )?.label
            }
          </Text>
        }
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

      <FloatButton.Group
        trigger="hover"
        style={{ left: `calc(50% + ${token.controlHeightLG}px)` }}
        icon={<SoundOutlined />}
      >
        <Card style={{ width: token.sizeXXL * 2 }} hoverable bordered>
          <Slider
            min={0}
            max={400}
            marks={{
              0: '0%',
              100: '100%',
              200: '200%',
              300: '300%',
              400: '400%',
            }}
            onChange={(value) => onChangeGain(value / 100)}
            value={gain * 100}
            style={{
              height: token.sizeXXL * 5,
            }}
            vertical
          />
        </Card>
      </FloatButton.Group>
    </>
  );
};

export default Waveform;
