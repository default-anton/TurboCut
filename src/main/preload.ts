// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

import createEDLWithSilenceRemoved from './exporters/davinci';
import {
  getSilentClips,
  compressAudioFile,
  renderCompressedAudio,
} from './ffmpeg';
import { transcribe } from './openai';

const electronHandler = {
  getSilentClips: async (
    ...args: Parameters<typeof getSilentClips>
  ): ReturnType<typeof getSilentClips> => {
    return ipcRenderer.invoke('getSilentClips', ...args);
  },
  createEDLWithSilenceRemoved: async (
    ...args: Parameters<typeof createEDLWithSilenceRemoved>
  ): ReturnType<typeof createEDLWithSilenceRemoved> => {
    return ipcRenderer.invoke('createEDLWithSilenceRemoved', ...args);
  },
  compressAudioFile: async (
    ...args: Parameters<typeof compressAudioFile>
  ): ReturnType<typeof compressAudioFile> => {
    return ipcRenderer.invoke('compressAudioFile', ...args);
  },
  renderCompressedAudio: async (
    ...args: Parameters<typeof renderCompressedAudio>
  ): ReturnType<typeof renderCompressedAudio> => {
    return ipcRenderer.invoke('renderCompressedAudio', ...args);
  },
  transcribe: async (
    ...args: Parameters<typeof transcribe>
  ): ReturnType<typeof transcribe> => {
    return ipcRenderer.invoke('transcribe', ...args);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
