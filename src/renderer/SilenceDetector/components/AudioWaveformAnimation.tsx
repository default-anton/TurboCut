import React from 'react';

interface AudioWaveformAnimationProps {
  loading: boolean;
}

export const AudioWaveformAnimation: React.FC<AudioWaveformAnimationProps> = ({
  loading,
}) =>
  loading ? (
    <div className="audio-waveform-animation">
      {Array.from({ length: 120 }).map((_, index) => (
        <div key={index} className="bar" />
      ))}
    </div>
  ) : null;

export default AudioWaveformAnimation;
