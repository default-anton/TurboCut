import React, { useState } from 'react';
import { Button, Layout, Space } from 'antd';
import { Content, Footer, Header } from 'antd/es/layout/layout';

import { Interval } from '../../shared/types';
import AudioFileInput from './components/AudioFileInput';
import InputParameters from './components/InputParameters';
import AudioWaveformAnimation from './components/AudioWaveformAnimation';
import Waveform from './components/Waveform';
import { useAudioFileInput } from './hooks/useAudioFileInput';
import { useSilenceDetection } from './hooks/useSilenceDetection';
import { useConvertToMonoMp3 } from './hooks/useConvertToMonoMp3';
import { useWaveSurfer } from './hooks/useWaveSurfer';

import './SilenceDetector.scss';

interface SilenceDetectorProps {}

const SilenceDetector: React.FC<SilenceDetectorProps> = () => {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [minSilenceLen, setMinSilenceLen] = useState<number>(1);
  const [silenceThresh, setSilenceThresh] = useState<number>(-30);
  const [padding, setPadding] = useState<number>(0.2);
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
    padding,
    setIntervals
  );
  const { outputPath } = useConvertToMonoMp3(inputFile, setIsLoading);
  const { waveformRef, handleScroll } = useWaveSurfer(
    outputPath,
    isLoading,
    setIsLoading,
    intervals
  );

  return (
    <div className="silence-detector">
      <Space direction="vertical" style={{ width: '100%' }} size={[0, 48]}>
        <Layout>
          <Header />

          <Content>
            <Space
              direction="vertical"
              size="middle"
              style={{ display: 'flex' }}
            >
              <AudioFileInput onChange={handleFileChange} />
              <AudioWaveformAnimation isLoading={isLoading} />
              <Waveform
                waveformRef={waveformRef}
                onWheel={handleScroll}
                isLoading={isLoading}
              />
              {inputFile &&
                !isLoading && [
                  <Button type="primary" onClick={handleDetectSilenceClick}>
                    Detect silence
                  </Button>,
                  <InputParameters
                    minSilenceLen={minSilenceLen}
                    silenceThresh={silenceThresh}
                    padding={padding}
                    setMinSilenceLen={setMinSilenceLen}
                    setSilenceThresh={setSilenceThresh}
                    setPadding={setPadding}
                  />,
                ]}
            </Space>
          </Content>

          <Footer />
        </Layout>
      </Space>
    </div>
  );
};

export default SilenceDetector;
