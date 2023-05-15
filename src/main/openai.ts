import fs from 'fs';
import { writeFile } from 'fs/promises';

import { Configuration, OpenAIApi } from 'openai';
import type { Transcription } from '../shared/types';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function transcribe(
  path: string,
  lang: string
): Promise<Transcription> {
  const response = await openai.createTranscription(
    fs.createReadStream(path) as any,
    'whisper-1',
    undefined,
    'verbose_json',
    0.7,
    lang,
    { maxContentLength: Infinity, maxBodyLength: Infinity }
  );

  if (response.status !== 200) {
    throw new Error('OpenAI transcription failed');
  }

  console.log(response.data);

  await writeFile(
    path.replace('.mp3', '.json'),
    JSON.stringify(response.data, null, 2)
  );

  return response.data.segments as Transcription;
}
