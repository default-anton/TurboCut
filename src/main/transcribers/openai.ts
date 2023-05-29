import fs from 'fs';

import { Configuration, OpenAIApi } from 'openai';

import { Transcription } from 'shared/types';

const transcribe = async ({
  apiKey,
  pathToAudioFile,
  languageCode,
}: {
  apiKey: string;
  pathToAudioFile: string;
  languageCode?: string;
}): Promise<Transcription> => {
  const config = new Configuration({ apiKey });
  const openai = new OpenAIApi(config);
  const response = await openai.createTranscription(
    fs.createReadStream(pathToAudioFile) as any,
    'whisper-1',
    undefined,
    'verbose_json',
    0.7,
    languageCode,
    { maxContentLength: Infinity, maxBodyLength: Infinity }
  );

  if (response.status !== 200) {
    throw new Error(`Transcription failed. ${response.data}`);
  }

  return (response.data as any).segments as Transcription;
};

export default transcribe;
