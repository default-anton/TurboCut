import fs from 'fs';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { Interval, VideoInfo } from 'shared/types';
import { dialog } from 'electron';

function framesToTimecode(frames: number, frameRate: number = 23.976): string {
  const fps = Math.round(frameRate);
  // Calculate hours, minutes, and seconds
  const hours = Math.floor(frames / (3600 * fps));
  const minutes = Math.floor((frames % (3600 * fps)) / (60 * fps));
  const seconds = Math.floor(((frames % (3600 * fps)) % (60 * fps)) / fps);
  const frs = Math.floor(((frames % (3600 * fps)) % (60 * fps)) % fps);

  // Format the Timecode as HH:MM:SS:FF
  const timecode = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frs
    .toString()
    .padStart(2, '0')}`;

  return timecode;
}

function timecodeToSeconds(timecode: string, frameRate: number): number {
  // Extract hours, minutes, seconds, and frames from the timecode string
  const [hours, minutes, seconds, frames] = timecode.split(/[:;]/).map(Number);
  return (
    Math.round(
      (Math.floor(
        (hours * 3600 + minutes * 60 + seconds) * Math.round(frameRate) + frames
      ) /
        frameRate) *
        10
    ) / 10
  );
}

function generateEDL(
  title: string,
  sourceClipName: string,
  intervals: Array<Interval>,
  frameRate: number,
  sourceTimecodeInSeconds: number = 0
): string {
  let edl = `TITLE: ${title}\nFCM: NON-DROP FRAME\n\n`;

  let recordStartFrames = 0;
  intervals.forEach((interval, index) => {
    const srcStartFrames = Math.floor(
      (interval.start + sourceTimecodeInSeconds) * frameRate
    );
    const srcEndFrames = Math.floor(
      (interval.end + sourceTimecodeInSeconds) * frameRate
    );
    const recStartFrames = recordStartFrames;
    const recEndFrames = Math.floor(
      recordStartFrames + (interval.end - interval.start) * frameRate
    );

    edl += `${String(index + 1).padStart(
      3,
      '0'
    )}  AX       V     C        ${framesToTimecode(
      srcStartFrames,
      frameRate
    )} ${framesToTimecode(srcEndFrames, frameRate)} ${framesToTimecode(
      recStartFrames,
      frameRate
    )} ${framesToTimecode(recEndFrames, frameRate)}\n`;
    edl += `* FROM CLIP NAME: ${sourceClipName}\n\n`;

    recordStartFrames = recEndFrames;
  });

  return edl;
}

function getNonSilentIntervals(
  silentIntervals: Array<Interval>,
  videoDuration: number
): Array<Interval> {
  const nonSilentIntervals: Array<Interval> = [];

  // Start from the beginning of the video
  let currentStart = 0;

  silentIntervals.forEach((silentInterval) => {
    // If there is a gap between the current start time and the beginning of the silent interval, add a non-silent interval
    if (currentStart < silentInterval.start) {
      nonSilentIntervals.push({
        start: currentStart,
        end: silentInterval.start,
      });
    }

    // Move the current start time to the end of the silent interval
    currentStart = silentInterval.end;
  });

  // If there is a gap between the last silent interval and the end of the video, add a non-silent interval
  if (currentStart < videoDuration) {
    nonSilentIntervals.push({ start: currentStart, end: videoDuration });
  }

  return nonSilentIntervals;
}

async function getVideoMetadata(inputFile: string): Promise<{
  startTimecode: string | undefined;
  frameRate: number;
  videoDuration: number;
}> {
  const probeData = await new Promise<FfprobeData>((resolve, reject) => {
    ffmpeg.ffprobe(inputFile, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  // Duration of the entire file (in seconds)
  const videoDuration = probeData.format.duration;
  const videoStream = probeData.streams.find(
    (stream: any) => stream.codec_type === 'video'
  );
  const qtStream = probeData.streams.find(
    (stream: any) => stream.codec_type === 'data'
  );

  const frameRate =
    videoStream && videoStream.avg_frame_rate
      ? Math.floor(
          videoStream.avg_frame_rate
            .split('/')
            .reduce((a, b) => parseInt(a, 10) / parseInt(b, 10)) * 1000
        ) / 1000
      : 23.976;

  const startTimecodeFormat = probeData.format.tags?.timecode;
  const startTimecodeStream = videoStream?.tags?.timecode;
  const startTimecodeQt = qtStream?.tags?.timecode;
  const startTimecodeStreamStart = videoStream?.start_time;

  if (!videoDuration) {
    throw new Error('Could not determine video duration');
  }

  return {
    frameRate,
    videoDuration,
    startTimecode:
      startTimecodeFormat ||
      startTimecodeStream ||
      startTimecodeQt ||
      startTimecodeStreamStart,
  };
}

export default async function createEDLWithSilenceRemoved(
  title: string,
  silentIntervals: Array<Interval>,
  videoInfo: VideoInfo,
  clipName: string
): Promise<boolean> {
  // Show the save file dialog and get the user's chosen path
  const result = await dialog.showSaveDialog({
    title,
    defaultPath: `${videoInfo.path.split('/').pop()}.edl`,
    filters: [{ name: 'EDL', extensions: ['edl'] }],
  });

  if (result.canceled || result.filePath === undefined) {
    return false;
  }

  const { startTimecode, frameRate, videoDuration } = await getVideoMetadata(
    videoInfo.path
  );

  const startTimecodeSeconds = startTimecode
    ? timecodeToSeconds(startTimecode, frameRate)
    : 0;

  return new Promise((resolve, reject) => {
    const nonSilentIntervals = getNonSilentIntervals(
      silentIntervals,
      videoDuration
    );

    const edl = generateEDL(
      'Silence Removed',
      clipName,
      nonSilentIntervals,
      frameRate,
      startTimecodeSeconds
    );

    const json = JSON.stringify(silentIntervals, null, 2);
    fs.writeFile(`${result.filePath}.json`, json, 'utf8', () => {
      fs.writeFile(result.filePath!, edl, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  });
}
