// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

import convertToMono from './convertToMono';
import createEDLWithSilenceRemoved from './exporters/davinci';
import getSilentIntervals from './getSilentIntervals';

const electronHandler = {
  getSilentIntervals: (
    ...args: Parameters<typeof getSilentIntervals>
  ): ReturnType<typeof getSilentIntervals> => {
    return ipcRenderer.invoke('getSilentIntervals', ...args);
  },
  createEDLWithSilenceRemoved: (
    ...args: Parameters<typeof createEDLWithSilenceRemoved>
  ): ReturnType<typeof createEDLWithSilenceRemoved> => {
    return ipcRenderer.invoke('createEDLWithSilenceRemoved', ...args);
  },
  convertToMono: (
    ...args: Parameters<typeof convertToMono>
  ): ReturnType<typeof convertToMono> => {
    return ipcRenderer.invoke('convertToMono', ...args);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
