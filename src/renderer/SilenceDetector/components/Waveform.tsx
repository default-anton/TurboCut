import React from 'react';

interface WaveformProps {
  waveformRef: React.RefObject<HTMLDivElement>;
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  isLoading: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({
  waveformRef,
  onWheel,
  isLoading,
}) => (
  <>
    <div
      className="waveform"
      ref={waveformRef}
      onWheel={onWheel}
      style={{ visibility: isLoading ? 'hidden' : 'visible' }}
    />
    <div
      id="waveform-timeline"
      className="waveform-timeline"
      style={{ visibility: isLoading ? 'hidden' : 'visible' }}
    />
  </>
);

export default Waveform;
