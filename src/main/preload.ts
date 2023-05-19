// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

import createEDL from './exporters/davinci';
import {
  getSilentClips,
  compressAudioFile,
  renderCompressedAudio,
} from './ffmpeg';
import {
  showSaveDialog,
  openProject,
  createProject,
  updateProject,
} from './projects';
import { transcribe } from './openai';

const electronHandler = {
  getSilentClips: async (
    ...args: Parameters<typeof getSilentClips>
  ): ReturnType<typeof getSilentClips> => {
    return ipcRenderer.invoke('getSilentClips', ...args);
  },
  createEDL: async (
    ...args: Parameters<typeof createEDL>
  ): ReturnType<typeof createEDL> => {
    return ipcRenderer.invoke('createEDL', ...args);
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
  showSaveDialog: async (
    ...args: Parameters<typeof showSaveDialog>
  ): ReturnType<typeof showSaveDialog> => {
    return ipcRenderer.invoke('showSaveDialog', ...args);
  },
  openProject: async (
    ...args: Parameters<typeof openProject>
  ): ReturnType<typeof openProject> => {
    return ipcRenderer.invoke('openProject', ...args);
  },
  createProject: async (
    ...args: Parameters<typeof createProject>
  ): ReturnType<typeof createProject> => {
    return ipcRenderer.invoke('createProject', ...args);
  },
  updateProject: async (
    ...args: Parameters<typeof updateProject>
  ): ReturnType<typeof updateProject> => {
    return ipcRenderer.invoke('updateProject', ...args);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
