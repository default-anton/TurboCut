import { createHash } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { access, constants } from 'fs/promises';
import path from 'path';
import { Clip } from '../shared/types';

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

export const renderTimelineAudio = async (
  inPath: string,
  projectDir: string,
  clips: Clip[]
): Promise<string> => {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(clips) + inPath);
  const clipsHash = hash.digest('hex');
  const outPath = path.join(projectDir, 'cache', `${clipsHash}.timeline.mp3`);

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
  silentClips: Array<Clip>,
  videoDuration: number
): Array<Clip> => {
  const nonSilentClips: Array<Clip> = [];

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

export const getSilentClips = async (
  filePath: string,
  minSilenceLen: number,
  silenceThresh: number,
  padding: number,
  minNonSilenceLen: number
): Promise<{
  silentClips: Clip[];
  nonSilentClips: Clip[];
}> => {
  const videoDuration = await getVideoDuration(filePath);

  return new Promise((resolve, reject) => {
    const silenceClips: Array<Clip> = [];
    // use a temporary mono audio file in tmp to detect silence
    const outputAudioFile = `${filePath}.mono.wav`;
    let clipStart: number | null = null;

    ffmpeg(filePath)
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
  projectDir: string
): Promise<string> => {
  const hash = createHash('sha256');
  hash.update(inPath);
  const inHash = hash.digest('hex');
  const outPath = path.join(projectDir, 'cache', `${inHash}.compressed.wav`);

  try {
    await access(outPath, constants.R_OK | constants.W_OK);

    // If the file exists, return it
    return outPath;
  } catch (error) {
    // If the file doesn't exist, render it
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .noVideo()
      .audioFrequency(44100)
      .audioChannels(1)
      .audioBitrate('64k')
      .output(outPath)
      .on('end', () => {
        resolve(outPath);
      })
      .on('error', (err: Error) => {
        reject(err);
      })
      .run();
  });
};
