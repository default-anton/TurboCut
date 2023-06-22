// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

import createEDL from './exporters/davinci';
import {
  getSilentClips,
  renderTimelineAudio,
  getVideoDuration,
  splitAudioIfLargerThan,
} from './ffmpeg';
import {
  showSaveDialog,
  openProject,
  createProject,
  updateProject,
} from './projects';
import Transcriber from './transcriber';

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
  renderTimelineAudio: async (
    ...args: Parameters<typeof renderTimelineAudio>
  ): ReturnType<typeof renderTimelineAudio> => {
    return ipcRenderer.invoke('renderTimelineAudio', ...args);
  },
  getVideoDuration: async (
    ...args: Parameters<typeof getVideoDuration>
  ): ReturnType<typeof getVideoDuration> => {
    return ipcRenderer.invoke('getVideoDuration', ...args);
  },
  splitAudioIfLargerThan: async (
    ...args: Parameters<typeof splitAudioIfLargerThan>
  ): ReturnType<typeof splitAudioIfLargerThan> => {
    return ipcRenderer.invoke('splitAudioIfLargerThan', ...args);
  },
  transcribe: async (
    ...args: Parameters<typeof Transcriber.prototype.transcribe>
  ): ReturnType<typeof Transcriber.prototype.transcribe> => {
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
  setOpenAiApiKey: async (apiKey: string): Promise<void> => {
    return ipcRenderer.invoke('setOpenAiApiKey', apiKey);
  },
  getOpenAiApiKey: async (): Promise<string> => {
    return ipcRenderer.invoke('getOpenAiApiKey');
  },
};

export type LogHandler = {
  error(...params: any[]): void;
  warn(...params: any[]): void;
  info(...params: any[]): void;
  debug(...params: any[]): void;
};

const logHandler: LogHandler = {
  info: async (...args: Parameters<LogHandler['info']>): Promise<void> => {
    ipcRenderer.send('logInfo', ...args);
  },
  warn: async (...args: Parameters<LogHandler['warn']>): Promise<void> => {
    ipcRenderer.send('logWarn', ...args);
  },
  error: async (...args: Parameters<LogHandler['error']>): Promise<void> => {
    ipcRenderer.send('logError', ...args);
  },
  debug: async (...args: Parameters<LogHandler['debug']>): Promise<void> => {
    ipcRenderer.send('logDebug', ...args);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
contextBridge.exposeInMainWorld('log', logHandler);

export type ElectronHandler = typeof electronHandler;
