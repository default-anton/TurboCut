import { createHash } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { access, constants, stat } from 'fs/promises';
import path from 'path';
import { Clip } from '../shared/types';
import { createCacheDir } from './util';

export const getVideoDuration = async (pathToFile: string): Promise<number> => {
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

const splitAudio = (
  audioPath: string,
  startSeconds: number,
  endSeconds: number,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(audioPath)
      .setStartTime(startSeconds)
      .setDuration(endSeconds - startSeconds)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

export const splitAudioIfLargerThan = async (
  audioPath: string,
  limitInMB: number
): Promise<string[]> => {
  const totalSizeInMB = (await stat(audioPath)).size / (1024 * 1024);

  if (totalSizeInMB <= limitInMB) {
    return [audioPath];
  }

  const totalDurationInSecs = await getVideoDuration(audioPath);
  const bitRate = (totalSizeInMB * 8) / totalDurationInSecs; // in Mbps
  const splitDuration = (limitInMB * 8) / bitRate; // the duration for each split file
  const outputPaths: string[] = [];

  let start = 0;
  let i = 1;
  while (start < totalDurationInSecs) {
    let end = start + splitDuration;
    if (end > totalDurationInSecs) {
      end = totalDurationInSecs;
    }
    const outputPath = path.join(
      path.dirname(audioPath),
      `${i}-${path.basename(audioPath)}`
    );
    await splitAudio(audioPath, start, end, outputPath);
    outputPaths.push(outputPath);
    start = end;
    i++;
  }

  return outputPaths;
};

export const renderTimelineAudio = async (
  inPath: string,
  projectDir: string,
  clips: Clip[],
  extension: 'mp3' | 'wav'
): Promise<string> => {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(clips) + inPath);
  const clipsHash = hash.digest('hex');
  const outPath = path.join(
    projectDir,
    'cache',
    `${clipsHash}.timeline.${extension}`
  );

  createCacheDir(projectDir);

  try {
    await access(outPath, constants.R_OK | constants.W_OK);

    // If the file exists, return it
    return outPath;
  } catch (error) {
    // If the file doesn't exist, render it
  }

  const selectFilter = clips
    .map((clip) => `between(t,${clip.start},${clip.end})`)
    .join('+');

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
      .on('end', () => resolve(outPath))
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
};

const getNonSilentClips = (
  silentClips: Clip[],
  videoDuration: number
): Clip[] => {
  const nonSilentClips: Clip[] = [];

  // Start from the beginning of the video
  let currentStart = 0;

  silentClips.forEach((silentClip) => {
    // If there is a gap between the current start time and the beginning of the silent clip, add a non-silent clip
    if (currentStart < silentClip.start) {
      nonSilentClips.push({
        start: currentStart,
        end: silentClip.start,
      });
    }

    // Move the current start time to the end of the silent clip
    currentStart = silentClip.end;
  });

  // If there is a gap between the last silent clip and the end of the video, add a non-silent clip
  if (currentStart < videoDuration) {
    nonSilentClips.push({ start: currentStart, end: videoDuration });
  }

  return nonSilentClips;
};

export const getSilentClips = async ({
  filePath,
  minSilenceLen,
  silenceThresh,
  startPad,
  endPad,
  minNonSilenceLen,
}: {
  filePath: string;
  minSilenceLen: number;
  silenceThresh: number;
  startPad: number;
  endPad: number;
  minNonSilenceLen: number;
}): Promise<{
  silentClips: Clip[];
  nonSilentClips: Clip[];
}> => {
  const videoDuration = await getVideoDuration(filePath);

  return new Promise((resolve, reject) => {
    const silenceClips: Clip[] = [];
    // use a temporary mono audio file in tmp to detect silence
    const outputAudioFile = `${filePath}.mono.wav`;
    let clipStart: number | null = null;

    ffmpeg(filePath)
      .noVideo()
      .audioFrequency(44100)
      .audioChannels(1)
      .audioBitrate('64k')
      .audioFilters(
        `silencedetect=n=${silenceThresh}dB:d=${minSilenceLen / 1000}`
      )
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
        const extendedSilenceClips: Clip[] = [{ ...silenceClips[0] }];

        // If the first non-silence clip is shorter than the minimum non-silence length, extend the first silence clip
        // to the beginning of the video.
        if (extendedSilenceClips[0].start < minNonSilenceLen / 1000) {
          extendedSilenceClips[0].start = 0;
        }

        let i = 0;

        while (i < silenceClips.length - 1) {
          // Create a shallow copy to avoid modifying the original clip
          const currentClip =
            extendedSilenceClips[extendedSilenceClips.length - 1];
          const nextClip = silenceClips[i + 1];
          const nonSilenceDuration = nextClip.start - currentClip.end;

          if (nonSilenceDuration < minNonSilenceLen / 1000) {
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

          if (nonSilenceDuration >= minNonSilenceLen / 1000) {
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
          clipStart = parseFloat(start) + startPad / 1000;
        } else if (silenceEndRegex.test(line)) {
          const [, end] = line.match(silenceEndRegex) as RegExpMatchArray;
          silenceClips.push({
            start: clipStart!,
            end: parseFloat(end) - endPad / 1000,
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
