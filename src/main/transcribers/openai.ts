import fs from 'fs';

import OpenAI from 'openai';

import { Transcription } from 'shared/types';

interface Word {
  word: string;
  start: number;
  end: number;
}

const transcribe = async ({
  apiKey,
  pathToAudioFile,
  languageCode,
}: {
  apiKey: string;
  pathToAudioFile: string;
  languageCode?: string;
}): Promise<Transcription> => {
  const openai = new OpenAI({ apiKey });
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(pathToAudioFile) as any,
    model: "whisper-1",
    response_format: "verbose_json",
    language: languageCode,
    timestamp_granularities: ["word"]
  });

  return transcription.words.map((word: Word) => {
    return {
      id: 0,
      start: word.start,
      end: word.end,
      text: word.word,
    };
  });
};

export default transcribe;
