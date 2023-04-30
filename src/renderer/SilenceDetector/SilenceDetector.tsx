import React, { useState } from 'react';
import { Interval } from '../../shared/types';
import { AudioFileInput } from './components/AudioFileInput';
import { InputParameters } from './components/InputParameters';
import { AudioWaveformAnimation } from './components/AudioWaveformAnimation';
import { Waveform } from './components/Waveform';
import { PlayPauseButton } from './components/PlayPauseButton';
import { useAudioFileInput } from './hooks/useAudioFileInput';
import { useSilenceDetection } from './hooks/useSilenceDetection';
import { useWaveSurfer } from './hooks/useWaveSurfer';

import './SilenceDetector.scss';

interface SilenceDetectorProps {}

const SilenceDetector: React.FC<SilenceDetectorProps> = () => {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [minSilenceLen, setMinSilenceLen] = useState<number>(1.5);
  const [silenceThresh, setSilenceThresh] = useState<number>(-35);
  const [intervals, setIntervals] = useState<Array<Interval>>([]);

  const handleFileChange = useAudioFileInput(
    setInputFile,
    setIsLoading,
    setIntervals
  );
  const handleDetectSilenceClick = useSilenceDetection(
    inputFile,
    minSilenceLen,
    silenceThresh,
    setIntervals
  );
  const { waveformRef, handleScroll, handlePlayPauseClick, isPlaying } =
    useWaveSurfer(inputFile, isLoading, setIsLoading, intervals);

  return (
    <div className="silence-detector">
      <AudioFileInput inputFile={inputFile} onChange={handleFileChange} />

      <InputParameters
        minSilenceLen={minSilenceLen}
        silenceThresh={silenceThresh}
        setMinSilenceLen={setMinSilenceLen}
        setSilenceThresh={setSilenceThresh}
      />

      <button
        type="button"
        onClick={handleDetectSilenceClick}
        disabled={!inputFile}
      >
        Detect silence
      </button>

      <AudioWaveformAnimation isLoading={isLoading} />

      <Waveform
        waveformRef={waveformRef}
        onWheel={handleScroll}
        isLoading={isLoading}
      />

      <PlayPauseButton
        onClick={handlePlayPauseClick}
        isPlaying={isPlaying}
        disabled={!inputFile}
      />
    </div>
  );
};

export default SilenceDetector;
