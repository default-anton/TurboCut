import ffmpeg from 'fluent-ffmpeg';

const convertToMono = async (
  inputPath: string,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioFrequency(44100)
      .audioChannels(1)
      .audioBitrate('64k')
      .output(outputPath)
      .on('end', () => {
        resolve();
      })
      .on('error', (err: Error) => {
        reject(err);
      })
      .run();
  });
};

export default convertToMono;
