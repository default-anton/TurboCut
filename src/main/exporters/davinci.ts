import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { Clip, VideoInfo } from 'shared/types';
import { js2xml } from 'xml-js';
import { dialog } from 'electron';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

function framesToSeconds(frames: number, frameRate: number): number {
  // Rounding the frame rate to the nearest integer is necessary to avoid floating point errors
  return Math.round((frames / frameRate) * 10) / 10;
}

function timecodeToFrames(timecode: string, frameRate: number): number {
  const [hours, minutes, seconds, frames] = timecode.split(/[:;]/).map(Number);
  // Rounding the frame rate to the nearest integer is necessary to avoid floating point errors
  return Math.floor(
    (hours * 3600 + minutes * 60 + seconds) * Math.round(frameRate) + frames
  );
}

function frameRateToFrameDuration(frameRate: number): string {
  return (
    {
      23.976: '1001/24000s',
      24: '100/2400s',
      25: '1/25s',
      29.97: '1001/30000s',
      30: '1/30s',
      50: '1/50s',
      59.94: '1001/60000s',
      60: '1/60s',
    }[frameRate] || '1001/24000s'
  );
}

function generateFCPXML(
  pathToSource: string,
  sourceClipName: string,
  sourceDuration: number,
  clips: Array<Clip>,
  frameRate: number,
  timecodeInSeconds: number,
  leaveGaps: boolean
): string {
  const [numerator, denominator] = frameRateToFrameDuration(frameRate)
    .split('/')
    .map((n) => parseInt(n, 10));
  const assetId = 'r1';
  const assetStart = numerator * Math.floor(timecodeInSeconds * frameRate);
  const assetDuration = numerator * Math.floor(sourceDuration * frameRate);
  const spineElemements: any[] = [];

  const fcpxml2 = {
    declaration: { attributes: { version: '1.0', encoding: 'UTF-8' } },
    elements: [
      {
        type: 'element',
        name: 'fcpxml',
        attributes: { version: '1.10' },
        elements: [
          {
            type: 'element',
            name: 'resources',
            elements: [
              {
                type: 'element',
                name: 'format',
                attributes: {
                  id: 'r0',
                  name: `FFVideoFormat3840x2160p${(
                    Math.round(frameRate * 100) / 100
                  )
                    .toString()
                    .replace('.', '')}`,
                  frameDuration: frameRateToFrameDuration(frameRate),
                  width: '3840',
                  height: '2160',
                },
              },
              {
                type: 'element',
                name: 'asset',
                attributes: {
                  id: assetId,
                  name: sourceClipName,
                  start: `${assetStart}/${denominator}s`,
                  duration: `${assetDuration}/${denominator}s`,
                  format: 'r1',
                  hasAudio: '1',
                  audioSources: '1',
                  audioChannels: '1',
                },
                elements: [
                  {
                    type: 'element',
                    name: 'media-rep',
                    attributes: {
                      src: `file://${pathToSource}`,
                      kind: 'original-media',
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'element',
            name: 'library',
            elements: [
              {
                type: 'element',
                name: 'event',
                attributes: { name: `TurboCut ${sourceClipName}` },
                elements: [
                  {
                    type: 'element',
                    name: 'project',
                    attributes: { name: `TurboCut ${sourceClipName}` },
                    elements: [
                      {
                        type: 'element',
                        name: 'sequence',
                        attributes: {
                          tcStart: '0/1s',
                          format: 'r0',
                          tcFormat: 'NDF',
                        },
                        elements: [
                          {
                            type: 'element',
                            name: 'spine',
                            elements: spineElemements,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  let offset = 0;

  clips.forEach((clip, index) => {
    const sourceStart = numerator * Math.floor(timecodeInSeconds * frameRate);
    const start =
      numerator * Math.floor((timecodeInSeconds + clip.start) * frameRate);
    const end =
      numerator * Math.floor((timecodeInSeconds + clip.end) * frameRate);
    const duration = end - start;

    // Add a gap clip to the timeline if the clip does not start at the beginning of the timeline
    if (leaveGaps && index === 0 && start > sourceStart) {
      const gapDuration = start - sourceStart;
      spineElemements.push({
        type: 'element',
        name: 'gap',
        attributes: {
          duration: `${gapDuration}/${denominator}s`,
        },
      });
      offset = gapDuration;
    }

    if (leaveGaps && clips[index - 1] && clip.start > clips[index - 1].end) {
      const prevClipEnd =
        numerator *
        Math.floor((timecodeInSeconds + clips[index - 1].end) * frameRate);
      const gapDuration = start - prevClipEnd;
      spineElemements.push({
        type: 'element',
        name: 'gap',
        attributes: {
          duration: `${gapDuration}/${denominator}s`,
        },
      });
      offset += gapDuration;
    }

    // Add the clip to the timeline
    spineElemements.push({
      type: 'element',
      name: 'asset-clip',
      attributes: {
        offset: `${offset}/${denominator}s`,
        enabled: '1',
        ref: assetId,
        duration: `${duration}/${denominator}s`,
        lane: '2',
        name: sourceClipName,
        start: `${start}/${denominator}s`,
      },
    });

    offset += duration;
  });

  return js2xml(fcpxml2, { compact: false, spaces: 4 });
}

async function getStartTimecode(filePath: string): Promise<string> {
  const probeData = await new Promise<FfprobeData>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  // Duration of the entire file (in seconds)
  const videoStream = probeData.streams.find(
    (stream: any) => stream.codec_type === 'video'
  );
  const qtStream = probeData.streams.find(
    (stream: any) => stream.codec_type === 'data'
  );

  const startTimecodeFormat = probeData.format.tags?.timecode;
  const startTimecodeStream = videoStream?.tags?.timecode;
  const startTimecodeQt = qtStream?.tags?.timecode;
  const startTimecodeStreamStart = videoStream?.start_time;

  return (
    startTimecodeFormat ||
    startTimecodeStream ||
    startTimecodeQt ||
    startTimecodeStreamStart ||
    '00:00:00:00'
  );
}

// eslint-disable-next-line import/prefer-default-export
export async function createFCPXML(
  title: string,
  clips: Array<Clip>,
  videoInfo: VideoInfo,
  clipName: string,
  frameRate: number,
  leaveGaps: boolean = false
): Promise<boolean> {
  // Show the save file dialog and get the user's chosen path
  const result = await dialog.showSaveDialog({
    title,
    defaultPath: `${videoInfo.path.split('/').pop()}.fcpxmld`,
    filters: [{ name: 'FCPXML 1.10', extensions: ['fcpxmld'] }],
  });

  if (result.canceled || result.filePath === undefined) {
    return false;
  }

  const startTimecode = await getStartTimecode(videoInfo.path);

  const startFrame = timecodeToFrames(startTimecode, frameRate);
  const startTimecodeInSeconds = framesToSeconds(startFrame, frameRate);

  const xml = generateFCPXML(
    videoInfo.path,
    clipName,
    videoInfo.duration,
    clips,
    frameRate,
    startTimecodeInSeconds,
    leaveGaps
  );

  try {
    await mkdir(result.filePath!);
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw new Error('Failed to create directory');
    }
  }

  await writeFile(path.join(result.filePath!, 'Info.fcpxml'), xml, 'utf8');

  return true;
}
