// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

import convertToMono from './convertToMono';
import createEDLWithSilenceRemoved from './exporters/davinci';
import { getSilentIntervals } from './ffmpeg';
import { transcribe } from './openai';

const electronHandler = {
  getSilentIntervals: async (
    ...args: Parameters<typeof getSilentIntervals>
  ): ReturnType<typeof getSilentIntervals> => {
    return ipcRenderer.invoke('getSilentIntervals', ...args);
  },
  createEDLWithSilenceRemoved: async (
    ...args: Parameters<typeof createEDLWithSilenceRemoved>
  ): ReturnType<typeof createEDLWithSilenceRemoved> => {
    return ipcRenderer.invoke('createEDLWithSilenceRemoved', ...args);
  },
  convertToMono: async (
    ...args: Parameters<typeof convertToMono>
  ): ReturnType<typeof convertToMono> => {
    return ipcRenderer.invoke('convertToMono', ...args);
  },
  transcribe: async (
    ...args: Parameters<typeof transcribe>
  ): ReturnType<typeof transcribe> => {
    return ipcRenderer.invoke('transcribe', ...args);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
