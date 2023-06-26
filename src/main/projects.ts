import { access, constants, readFile, writeFile } from 'fs/promises';
import path from 'path';

import checkDiskSpace from 'check-disk-space';
import { app, dialog } from 'electron';

import { ProjectConfig, ProjectStep } from '../shared/types';
import { createCacheDir } from './util';

const MIN_DISK_SPACE_IN_BYTES = 100 * 1024 * 1024; // 100 MB

export async function openProject(): Promise<ProjectConfig | undefined> {
  const result = await dialog.showOpenDialog({
    title: 'Open Existing Project',
    properties: ['openFile'],
    filters: [{ name: 'Project Files', extensions: ['ffai'] }],
    buttonLabel: 'Open',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return;
  }

  const configPath = result.filePaths[0];

  try {
    await access(configPath, constants.R_OK | constants.W_OK);
    const config = await readFile(configPath, 'utf-8');

    const projectConfig = JSON.parse(config) as ProjectConfig;
    projectConfig.disabledSegmentIds = new Set(
      projectConfig.disabledSegmentIds
    );
    return projectConfig;
  } catch (error) {
    throw new Error(
      'The selected file is either inaccessible, lacks sufficient permissions, or is not a valid project file'
    );
  }
}

export async function updateProject(
  projectConfig: ProjectConfig
): Promise<void> {
  await writeFile(
    path.join(projectConfig.dir, `${projectConfig.name}.ffai`),
    JSON.stringify(
      projectConfig,
      (_key, value) => {
        return value instanceof Set ? [...value] : value;
      },
      2
    )
  );
}

export async function createProject(): Promise<ProjectConfig | undefined> {
  const result = await dialog.showSaveDialog({
    title: 'Create New Project',
    defaultPath: path.join(app.getPath('desktop'), `Unnamed.ffai`),
    filters: [{ name: 'Project Files', extensions: ['ffai'] }],
    buttonLabel: 'Create',
  });

  if (result.canceled || result.filePath === undefined) {
    return;
  }

  const dir = path.dirname(result.filePath);

  try {
    await access(dir, constants.R_OK | constants.W_OK);
    const { free: available } = await checkDiskSpace(dir);

    if (available < MIN_DISK_SPACE_IN_BYTES) {
      throw new Error('Insufficient space in the selected directory');
    }
  } catch (error) {
    throw new Error(
      'The selected directory is either inaccessible, lacks sufficient permissions, or has insufficient space'
    );
  }

  const config: ProjectConfig = {
    projectStep: ProjectStep.SelectFile,
    name: path.basename(result.filePath, '.ffai'),
    dir,
    filePath: '',
    fileDuration: 0,
    frameRate: 0,
    clips: [],
    silence: [],
    speech: [],
    transcription: [],
    disabledSegmentIds: new Set(),
  };

  createCacheDir(config.dir);

  try {
    await updateProject(config);
  } catch (error) {
    throw new Error('Unable to create project file');
  }

  return config;
}

export const showSaveDialog = async (
  title: string,
  defaultName: string,
  extenion: string
): Promise<string | undefined> => {
  const result = await dialog.showSaveDialog({
    title,
    defaultPath: path.join(
      app.getPath('desktop'),
      `${defaultName}.${extenion}`
    ),
  });

  if (result.canceled || result.filePath === undefined) return;

  const dir = path.dirname(result.filePath);
  await access(dir, constants.R_OK | constants.W_OK);

  return result.filePath;
};
