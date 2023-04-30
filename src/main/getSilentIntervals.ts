import ffmpeg from 'fluent-ffmpeg';
import { Interval } from '../shared/types';

const getSilentIntervals = (
  inputFile: string,
  minSilenceLen: number,
  silenceThresh: number
): Promise<Array<Interval>> => {
  return new Promise((resolve, reject) => {
    const silenceIntervals: Array<Interval> = [];
    const outputAudioFile = inputFile
      .replace(/\.[^/.]+$/, '_silence.wav')
      .replace(/.*\//, './');

    ffmpeg(inputFile)
      .audioFilters(`silencedetect=n=${silenceThresh}dB:d=${minSilenceLen}`)
      .on('end', () => {
        resolve(silenceIntervals);
      })
      .on('stderr', (line: string) => {
        const silenceStartRegex = /silence_start: (\d+(\.\d+)?)/;
        const silenceEndRegex = /silence_end: (\d+(\.\d+)?)/;

        if (silenceStartRegex.test(line)) {
          const [, start] = line.match(silenceStartRegex) as RegExpMatchArray;
          silenceIntervals.push({ start: parseFloat(start), end: null });
        } else if (silenceEndRegex.test(line)) {
          const [, end] = line.match(silenceEndRegex) as RegExpMatchArray;
          silenceIntervals[silenceIntervals.length - 1].end = parseFloat(end);
        }
      })
      .on('error', (err: Error) => {
        reject(err);
      })
      .noVideo()
      .output(outputAudioFile)
      .run();
  });
};

export default getSilentIntervals;
