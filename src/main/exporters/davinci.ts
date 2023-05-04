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

export default async function createEDLWithSilenceRemoved(
  silentIntervals: Array<Interval>,
  videoInfo: VideoInfo,
  outputPath: string,
  clipName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const edl = generateEDL(
      'Silence Removed',
      clipName,
      silentIntervals,
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
