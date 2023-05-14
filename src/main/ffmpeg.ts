import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Clip } from '../shared/types';
import { getNonSilentClips } from './exporters/davinci';

const getVideoDuration = async (pathToFile: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(pathToFile, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        if (!metadata.format || !metadata.format.duration) {
          reject(new Error('Could not get video duration'));
          return;
        }

        resolve(metadata.format.duration);
      }
    });
  });
};

export const renderCompressedAudio = async (
  inPath: string,
  outPath: string,
  clips: Clip[]
): Promise<void> => {
  // Generate select filter string
  const selectFilter = clips
    .map((clip) => `between(t,${clip.start},${clip.end})`)
    .join('+');

  // Create a new ffmpeg command
  const command = ffmpeg(inPath)
    .audioFilters(`aselect='${selectFilter}',asetpts=N/SR/TB`)
    .noVideo()
    .audioFrequency(44100)
    .audioChannels(1)
    .audioBitrate('64k')
    .output(outPath);

  // Run the ffmpeg command
  return new Promise((resolve, reject) => {
    command
      .on('end', () => resolve())
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
};

export const getSilentClips = async (
  inputFile: string,
  minSilenceLen: number,
  silenceThresh: number,
  padding: number,
  minNonSilenceLen: number
): Promise<{
  silentClips: Clip[];
  nonSilentClips: Clip[];
}> => {
  const videoDuration = await getVideoDuration(inputFile);

  return new Promise((resolve, reject) => {
    const silenceClips: Array<Clip> = [];
    // use a temporary mono audio file in tmp to detect silence
    const outputAudioFile = `${inputFile}.mono.wav`;
    let clipStart: number | null = null;

    ffmpeg(inputFile)
      .noVideo()
      .audioFrequency(44100)
      .audioChannels(1)
      .audioBitrate('64k')
      .audioFilters(`silencedetect=n=${silenceThresh}dB:d=${minSilenceLen}`)
      .on('end', () => {
        if (silenceClips.length === 0) {
          fs.unlinkSync(outputAudioFile);
          resolve({
            silentClips: [],
            nonSilentClips: [{ start: 0, end: videoDuration }],
          });
          return;
        }

        // Extend silence clips to fill ultra-short non-silence clips
        const extendedSilenceClips: Array<Clip> = [{ ...silenceClips[0] }];
        let i = 0;

        while (i < silenceClips.length - 1) {
          // Create a shallow copy to avoid modifying the original clip
          const currentClip =
            extendedSilenceClips[extendedSilenceClips.length - 1];
          const nextClip = silenceClips[i + 1];
          const nonSilenceDuration = nextClip.start - currentClip.end;

          if (nonSilenceDuration < minNonSilenceLen) {
            currentClip.end = nextClip.end;
          } else if (nextClip.end > currentClip.end) {
            extendedSilenceClips.push({ ...nextClip });
          }

          i++;
        }

        // Add the last silence clip to the list if it hasn't been merged already
        if (i === silenceClips.length - 1) {
          const currentClip =
            extendedSilenceClips[extendedSilenceClips.length - 1];
          const nextClip = silenceClips[i];
          const nonSilenceDuration = nextClip.start - currentClip.end;

          if (nonSilenceDuration >= minNonSilenceLen) {
            extendedSilenceClips.push({ ...nextClip });
          } else {
            currentClip.end = nextClip.end;
          }
        }

        fs.unlinkSync(outputAudioFile);
        resolve({
          silentClips: extendedSilenceClips,
          nonSilentClips: getNonSilentClips(
            extendedSilenceClips,
            videoDuration
          ),
        });
      })
      .on('stderr', (line: string) => {
        const silenceStartRegex = /silence_start: (\d+(\.\d+)?)/;
        const silenceEndRegex = /silence_end: (\d+(\.\d+)?)/;

        if (silenceStartRegex.test(line)) {
          const [, start] = line.match(silenceStartRegex) as RegExpMatchArray;
          clipStart = parseFloat(start) + padding;
        } else if (silenceEndRegex.test(line)) {
          const [, end] = line.match(silenceEndRegex) as RegExpMatchArray;
          silenceClips.push({
            start: clipStart!,
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

export const compressAudioFile = async (
  inPath: string,
  outPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .noVideo()
      .audioFrequency(44100)
      .audioChannels(1)
      .audioBitrate('64k')
      .output(outPath)
      .on('end', () => {
        resolve();
      })
      .on('error', (err: Error) => {
        reject(err);
      })
      .run();
  });
};
