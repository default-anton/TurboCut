import {
  ApiKeyNotSetError,
  Transcription,
  TranscriptionBackend,
} from '../shared/types';

import transcribeWithOpenAI from './transcribers/openai';

type ApiKeyGetter = (keyName: string) => string | undefined;

export default class Transcriber {
  private readonly getApiKey: ApiKeyGetter;

  constructor({ getApiKey }: { getApiKey: ApiKeyGetter }) {
    this.getApiKey = getApiKey;
  }

  async transcribe({
    backend,
    pathToAudioFile,
    languageCode,
  }: {
    backend: TranscriptionBackend;
    pathToAudioFile: string;
    languageCode?: string;
  }): Promise<Transcription> {
    if (backend === TranscriptionBackend.OpenAIWhisper) {
      const apiKey = this.getApiKey('openai_api_key');

      if (!apiKey) {
        throw new ApiKeyNotSetError(TranscriptionBackend.OpenAIWhisper);
      }

      return transcribeWithOpenAI({ apiKey, pathToAudioFile, languageCode });
    }

    throw new Error(`Unknown transcription backend: ${backend}`);
  }
}
