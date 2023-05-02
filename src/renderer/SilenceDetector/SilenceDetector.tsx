import React, { useState } from 'react';
import { Button, Layout, Space, Modal } from 'antd';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import { AudioOutlined } from '@ant-design/icons';

import { Interval } from '../../shared/types';
import AudioFileInput from './components/AudioFileInput';
import InputParameters from './components/InputParameters';
import AudioWaveformAnimation from './components/AudioWaveformAnimation';
import Waveform from './components/Waveform';
import { useAudioFileInput } from './hooks/useAudioFileInput';
import { useSilenceDetection } from './hooks/useSilenceDetection';
import { useConvertToMonoMp3 } from './hooks/useConvertToMonoMp3';
import { useWaveSurfer } from './hooks/useWaveSurfer';

import styles from './SilenceDetector.module.scss';

interface SilenceDetectorProps {}

const SilenceDetector: React.FC<SilenceDetectorProps> = () => {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [minSilenceLen, setMinSilenceLen] = useState<number>(1);
  const [silenceThresh, setSilenceThresh] = useState<number>(-30);
  const [padding, setPadding] = useState<number>(0.2);
  const [intervals, setIntervals] = useState<Array<Interval>>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

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

  const showModal = () => {
    setModalVisible(true);
  };

  const handleOk = () => {
    handleDetectSilenceClick();
    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  return (
    <div className={styles['silence-detector']}>
      <Layout>
        <Header>
          <h1 className={styles['header-title']}>Silence Cutter</h1>
        </Header>
        <Content className={styles['content']}>
          <div className={styles['content-wrapper']}>
            <AudioFileInput onChange={handleFileChange} />
            <AudioWaveformAnimation isLoading={isLoading} />
            <Waveform
              waveformRef={waveformRef}
              onWheel={handleScroll}
              isLoading={isLoading}
            />
            {inputFile && !isLoading && (
              <>
                <Button
                  type="primary"
                  onClick={showModal}
                  icon={<AudioOutlined />}
                >
                  Detect silence
                </Button>
                <Modal
                  title="Silence detection parameters"
                  visible={modalVisible}
                  onOk={handleOk}
                  onCancel={handleCancel}
                  okText="Submit"
                >
                  <InputParameters
                    minSilenceLen={minSilenceLen}
                    silenceThresh={silenceThresh}
                    padding={padding}
                    setMinSilenceLen={setMinSilenceLen}
                    setSilenceThresh={setSilenceThresh}
                    setPadding={setPadding}
                  />
                </Modal>
              </>
            )}
          </div>
        </Content>
        <Footer />
      </Layout>
    </div>
  );
};

export default SilenceDetector;
