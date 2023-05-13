import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Interval } from '../shared/types';

const getSilentIntervals = async (
  inputFile: string,
  minSilenceLen: number,
  silenceThresh: number,
  padding: number,
  minNonSilenceLen: number
): Promise<Array<Interval>> => {
  return new Promise((resolve, reject) => {
    const silenceIntervals: Array<Interval> = [];
    // use a temporary mono audio file in tmp to detect silence
    const outputAudioFile = `${inputFile}.mono.wav`;
    let intervalStart: number | null = null;

    ffmpeg(inputFile)
      .noVideo()
      .audioFrequency(44100)
      .audioChannels(1)
      .audioBitrate('64k')
      .audioFilters(`silencedetect=n=${silenceThresh}dB:d=${minSilenceLen}`)
      .on('end', () => {
        if (silenceIntervals.length === 0) {
          fs.unlinkSync(outputAudioFile);
          resolve([]);
          return;
        }

        // Extend silence intervals to fill ultra-short non-silence intervals
        const extendedSilenceIntervals: Array<Interval> = [
          { ...silenceIntervals[0] },
        ];
        let i = 0;

        while (i < silenceIntervals.length - 1) {
          // Create a shallow copy to avoid modifying the original interval
          const currentInterval =
            extendedSilenceIntervals[extendedSilenceIntervals.length - 1];
          const nextInterval = silenceIntervals[i + 1];
          const nonSilenceDuration = nextInterval.start - currentInterval.end;

          if (nonSilenceDuration < minNonSilenceLen) {
            currentInterval.end = nextInterval.end;
          } else if (nextInterval.end > currentInterval.end) {
            extendedSilenceIntervals.push({ ...nextInterval });
          }

          i++;
        }

        // Add the last silence interval to the list if it hasn't been merged already
        if (i === silenceIntervals.length - 1) {
          const currentInterval =
            extendedSilenceIntervals[extendedSilenceIntervals.length - 1];
          const nextInterval = silenceIntervals[i];
          const nonSilenceDuration = nextInterval.start - currentInterval.end;

          if (nonSilenceDuration >= minNonSilenceLen) {
            extendedSilenceIntervals.push({ ...nextInterval });
          } else {
            currentInterval.end = nextInterval.end;
          }
        }

        resolve(extendedSilenceIntervals);
        fs.unlinkSync(outputAudioFile);
      })
      .on('stderr', (line: string) => {
        const silenceStartRegex = /silence_start: (\d+(\.\d+)?)/;
        const silenceEndRegex = /silence_end: (\d+(\.\d+)?)/;

        if (silenceStartRegex.test(line)) {
          const [, start] = line.match(silenceStartRegex) as RegExpMatchArray;
          intervalStart = parseFloat(start) + padding;
        } else if (silenceEndRegex.test(line)) {
          const [, end] = line.match(silenceEndRegex) as RegExpMatchArray;
          silenceIntervals.push({
            start: intervalStart!,
            end: parseFloat(end) - padding,
          });
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
