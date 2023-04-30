// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

import { Interval } from '../shared/types';

const electronHandler = {
  getSilentIntervals(
    inputFile: string,
    minSilenceLen: number,
    silenceThresh: number,
    padding: number
  ): Promise<Array<Interval>> {
    return ipcRenderer.invoke(
      'getSilentIntervals',
      inputFile,
      minSilenceLen,
      silenceThresh,
      padding
    );
  },
  convertToMono(inputPath: string, outputPath: string): Promise<void> {
    return ipcRenderer.invoke('convertToMono', inputPath, outputPath);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
