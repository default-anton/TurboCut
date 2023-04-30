import ffmpeg from 'fluent-ffmpeg';

const convertToMonoMp3 = (
  inputPath: string,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioFrequency(44100)
      .audioChannels(1)
      .audioBitrate('192k')
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

export default convertToMonoMp3;
