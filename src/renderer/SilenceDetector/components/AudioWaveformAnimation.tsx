import React from 'react';

interface AudioWaveformAnimationProps {
  isLoading: boolean;
}

export const AudioWaveformAnimation: React.FC<AudioWaveformAnimationProps> = ({
  isLoading,
}) => (
  <>
    {isLoading && (
      <div className="audio-waveform-animation">
        {Array.from({ length: 120 }).map((_, index) => (
          <div key={index} className="bar" />
        ))}
      </div>
    )}
  </>
);

export default AudioWaveformAnimation;
