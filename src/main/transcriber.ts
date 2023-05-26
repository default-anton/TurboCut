import fs from 'fs';

import { Configuration, OpenAIApi } from 'openai';
import { Transcription, TranscriptionBackend } from '../shared/types';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

const transcribeWithOpenAI = async (
  pathToAudioFile: string,
  lang: string
): Promise<Transcription> => {
  const response = await openai.createTranscription(
    fs.createReadStream(pathToAudioFile) as any,
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

  return (response.data as any).segments as Transcription;
};

export async function transcribe(
  pathToAudioFile: string,
  lang: string,
  backend: TranscriptionBackend
): Promise<Transcription> {
  if (backend === TranscriptionBackend.OpenAIWhisper) {
    return transcribeWithOpenAI(pathToAudioFile, lang);
  }

  throw new Error(`Unknown transcription backend: ${backend}`);
}

export default transcribe;
