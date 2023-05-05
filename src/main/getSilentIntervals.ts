import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Interval } from '../shared/types';

const getSilentIntervals = async (
  inputFile: string,
  minSilenceLen: number,
  silenceThresh: number,
  padding: number
): Promise<Array<Interval>> => {
  return new Promise((resolve, reject) => {
    const silenceIntervals: Array<Interval> = [];
    // use a temporary mono audio file in tmp to detect silence
    const outputAudioFile = `${inputFile}.mono.wav`;

    ffmpeg(inputFile)
      .noVideo()
      .audioFrequency(44100)
      .audioChannels(1)
      .audioBitrate('192k')
      .audioFilters(`silencedetect=n=${silenceThresh}dB:d=${minSilenceLen}`)
      .on('end', () => {
        resolve(silenceIntervals);
        fs.unlinkSync(outputAudioFile);
      })
      .on('stderr', (line: string) => {
        const silenceStartRegex = /silence_start: (\d+(\.\d+)?)/;
        const silenceEndRegex = /silence_end: (\d+(\.\d+)?)/;

        if (silenceStartRegex.test(line)) {
          const [, start] = line.match(silenceStartRegex) as RegExpMatchArray;
          silenceIntervals.push({
            start: parseFloat(start) + padding,
            end: null,
          });
        } else if (silenceEndRegex.test(line)) {
          const [, end] = line.match(silenceEndRegex) as RegExpMatchArray;
          silenceIntervals[silenceIntervals.length - 1].end =
            parseFloat(end) - padding;
        }
      })
      .on('error', (err: Error) => {
        reject(err);
      })
      .output(outputAudioFile)
      .run();
  });
};

export default getSilentIntervals;
