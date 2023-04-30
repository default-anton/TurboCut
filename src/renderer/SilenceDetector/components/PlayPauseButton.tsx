import React from 'react';

interface PlayPauseButtonProps {
  onClick: () => void;
  disabled: boolean;
  isPlaying: boolean;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
  onClick,
  disabled,
  isPlaying,
}) => (
  <button type="button" onClick={onClick} disabled={disabled}>
    {isPlaying ? 'Pause' : 'Play'}
  </button>
);

export default PlayPauseButton;
