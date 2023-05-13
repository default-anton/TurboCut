import fs from 'fs';

import { Configuration, OpenAIApi } from 'openai';
import type { Segment } from '../shared/types';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function transcribe(
  path: string,
  lang: string
): Promise<Segment[]> {
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

  fs.writeFileSync(
    path.replace('.mp3', '.json'),
    JSON.stringify(response.data, null, 2)
  );

  return response.data.segments as Segment[];
}
