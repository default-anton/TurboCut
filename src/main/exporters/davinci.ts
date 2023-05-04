import fs from 'fs';
import { Interval, VideoInfo } from 'shared/types';

function generateEDL(
  title: string,
  sourceClipName: string,
  intervals: Array<Interval>,
  frameRate: number = 23.976,
  sourceStartTimecode: number = 0
): string {
  function formatTimecode(frames: number): string {
    const frame = Math.round(frames) % Math.round(frameRate);
    const seconds = Math.floor(frames / frameRate) % 60;
    const minutes = Math.floor(frames / (frameRate * 60)) % 60;
    const hours = Math.floor(frames / (frameRate * 60 * 60));

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}:${String(frame).padStart(2, '0')}`;
  }

  let edl = `TITLE: ${title}\nFCM: NON-DROP FRAME\n\n`;

  let recordStart = 0;
  intervals.forEach((interval, index) => {
    const srcStart = Math.round(
      (interval.start - sourceStartTimecode) * frameRate
    );
    const srcEnd = Math.round(
      (interval.end ?? 0 - sourceStartTimecode) * frameRate
    );

    const recStart = recordStart;
    const recEnd = recordStart + srcEnd - srcStart;

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

export default async function createEDLWithSilenceRemoved(
  silentIntervals: Array<Interval>,
  videoInfo: VideoInfo,
  outputPath: string,
  clipName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const nonSilentIntervals = getNonSilentIntervals(
      silentIntervals,
      videoInfo.duration
    );

    const edl = generateEDL(
      'Silence Removed',
      clipName,
      nonSilentIntervals,
      videoInfo.frameRate
    );

    fs.writeFile(outputPath, edl, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
