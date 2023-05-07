import fs from 'fs';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { Interval, VideoInfo } from 'shared/types';
import { dialog } from 'electron';

const floor = (num: number): number => Math.floor(num * 1000) / 1000;

function generateEDL(
  title: string,
  sourceClipName: string,
  intervals: Array<Interval>,
  frameRate: number,
  sourceTimecodeInSeconds: number = 0
): string {
  function formatTimecode(frames: number): string {
    const frame = Math.floor(frames % frameRate);
    const seconds = Math.floor((frames / frameRate) % 60);
    const minutes = Math.floor((frames / (frameRate * 60)) % 60);
    const hours = Math.floor(frames / (frameRate * 60 * 60));

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}:${String(frame).padStart(2, '0')}`;
  }

  let edl = `TITLE: ${title}\nFCM: NON-DROP FRAME\n\n`;

  let recordStart = 0;
  intervals.forEach((interval, index) => {
    const srcStart = floor(
      (interval.start + sourceTimecodeInSeconds) * frameRate
    );
    const srcEnd = floor((interval.end + sourceTimecodeInSeconds) * frameRate);
    const recStart = recordStart;
    const recEnd = floor(
      recordStart + (interval.end - interval.start) * frameRate
    );

    edl += `${String(index + 1).padStart(
      3,
      '0'
    )}  AX       V     C        ${formatTimecode(srcStart)} ${formatTimecode(
      srcEnd
    )} ${formatTimecode(recStart)} ${formatTimecode(recEnd)}\n`;
    edl += `* FROM CLIP NAME: ${sourceClipName}\n\n`;

    recordStart = recEnd;
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
    currentStart = silentInterval.end ?? videoDuration;
  });

  // If there is a gap between the last silent interval and the end of the video, add a non-silent interval
  if (currentStart < videoDuration) {
    nonSilentIntervals.push({ start: currentStart, end: null });
  }

  return nonSilentIntervals;
}

async function getStartTimecodeAndFrameRate(
  inputFile: string
): Promise<{ startTimecode: string | undefined; frameRate: number }> {
  const probeData = await new Promise<FfprobeData>((resolve, reject) => {
    ffmpeg.ffprobe(inputFile, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const formatTags = probeData.format.tags;
  const startTimecodeFormat = formatTags?.timecode;

  const videoStream = probeData.streams.find(
    (stream: any) => stream.codec_type === 'video'
  );
  const startTimecodeStreamStart = videoStream?.start_time;
  const startTimecodeStream = videoStream?.tags?.timecode;

  const frameRate =
    videoStream && videoStream.avg_frame_rate
      ? Math.floor(
          videoStream.avg_frame_rate
            .split('/')
            .reduce((a, b) => parseInt(a, 10) / parseInt(b, 10)) * 1000
        ) / 1000
      : 23.976;

  const qtStream = probeData.streams.find(
    (stream: any) => stream.codec_type === 'data'
  );
  const startTimecodeQt = qtStream?.tags?.timecode;

  return {
    frameRate,
    startTimecode:
      startTimecodeFormat ||
      startTimecodeStream ||
      startTimecodeQt ||
      startTimecodeStreamStart,
  };
}

function timecodeToSeconds(timecode: string, frameRate: number): number {
  const [hours, minutes, seconds, frames] = timecode.split(':').map(Number);
  return hours * 60 * 60 + minutes * 60 + seconds + floor(frames / frameRate);
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

  const { startTimecode, frameRate } = await getStartTimecodeAndFrameRate(
    videoInfo.path
  );
  console.log('startTimecode, frameRate', startTimecode, frameRate);
  const startTimecodeSeconds = startTimecode
    ? floor(timecodeToSeconds(startTimecode, frameRate))
    : 0;

  return new Promise((resolve, reject) => {
    const nonSilentIntervals = getNonSilentIntervals(
      silentIntervals,
      videoInfo.duration
    );

    const edl = generateEDL(
      'Silence Removed',
      clipName,
      silentIntervals,
      frameRate,
      startTimecodeSeconds
    );

    fs.writeFile(result.filePath!, edl, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}
