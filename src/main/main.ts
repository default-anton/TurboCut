/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';

import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Store from 'electron-store';

import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
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
import createEDL from './exporters/davinci';
import Transcriber from './transcriber';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

const store = new Store<Record<string, string>>();
const TranscriberInstance = new Transcriber({
  getApiKey: (keyName) => store.get(keyName),
});

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch((err: any) => log.error(`Error installing extensions: ${err}`));
};

const createWindow = async () => {
  if (isDebug) {
    log.info('Running in development');
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: false,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    log.info('Main window is ready to show');

    if (!mainWindow) {
      log.error('"mainWindow" is not defined');
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    log.info('App is ready');

    createWindow();
    // expose getSilentClips to the renderer process by using ipcMain.handle
    ipcMain.handle(
      'getSilentClips',
      async (
        _event,
        ...args: Parameters<typeof getSilentClips>
      ): ReturnType<typeof getSilentClips> => {
        return getSilentClips(...args);
      }
    );
    ipcMain.handle(
      'createEDL',
      async (
        _event,
        ...args: Parameters<typeof createEDL>
      ): ReturnType<typeof createEDL> => {
        return createEDL(...args);
      }
    );
    ipcMain.handle(
      'renderTimelineAudio',
      async (
        _event,
        ...args: Parameters<typeof renderTimelineAudio>
      ): ReturnType<typeof renderTimelineAudio> => {
        return renderTimelineAudio(...args);
      }
    );
    ipcMain.handle(
      'getVideoDuration',
      async (
        _event,
        ...args: Parameters<typeof getVideoDuration>
      ): ReturnType<typeof getVideoDuration> => {
        return getVideoDuration(...args);
      }
    );
    ipcMain.handle(
      'splitAudioIfLargerThan',
      async (
        _event,
        ...args: Parameters<typeof splitAudioIfLargerThan>
      ): ReturnType<typeof splitAudioIfLargerThan> => {
        return splitAudioIfLargerThan(...args);
      }
    );
    ipcMain.handle(
      'transcribe',
      async (
        _event,
        ...args: Parameters<typeof Transcriber.prototype.transcribe>
      ): ReturnType<typeof Transcriber.prototype.transcribe> => {
        return TranscriberInstance.transcribe(...args);
      }
    );
    ipcMain.handle(
      'showSaveDialog',
      async (
        _event,
        ...args: Parameters<typeof showSaveDialog>
      ): ReturnType<typeof showSaveDialog> => {
        return showSaveDialog(...args);
      }
    );
    ipcMain.handle(
      'openProject',
      async (
        _event,
        ...args: Parameters<typeof openProject>
      ): ReturnType<typeof openProject> => {
        return openProject(...args);
      }
    );
    ipcMain.handle(
      'createProject',
      async (
        _event,
        ...args: Parameters<typeof createProject>
      ): ReturnType<typeof createProject> => {
        return createProject(...args);
      }
    );
    ipcMain.handle(
      'updateProject',
      async (
        _event,
        ...args: Parameters<typeof updateProject>
      ): ReturnType<typeof updateProject> => {
        return updateProject(...args);
      }
    );
    ipcMain.handle('setOpenAiApiKey', (_event, key: string): void => {
      store.set('openai_api_key', key);
    });
    ipcMain.handle('getOpenAiApiKey', (): string | undefined => {
      return store.get('openai_api_key');
    });
    ipcMain.on('logInfo', (_event, ...args: any[]): void => {
      log.info(...args);
    });
    ipcMain.on('logError', (_event, ...args: any[]): void => {
      log.error(...args);
    });
    ipcMain.on('logWarn', (_event, ...args: any[]): void => {
      log.warn(...args);
    });
    ipcMain.on('logDebug', (_event, ...args: any[]): void => {
      log.debug(...args);
    });

    app.on('activate', () => {
      log.info('App is activated');
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch((err: any) => {
    log.error(`Error in app.whenReady: ${err}`);
  });

process.on('uncaughtException', (err: any) => {
  log.error('Uncaught exception: ', err);
});
