import { access, constants, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

import checkDiskSpace from 'check-disk-space';
import { app, dialog } from 'electron';

import { ProjectConfig } from '../shared/types';

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

    return JSON.parse(config) as ProjectConfig;
  } catch (error) {
    throw new Error(
      'The selected file is either inaccessible, lacks sufficient permissions, or is not a valid project file'
    );
  }
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
    name: path.basename(result.filePath, '.ffai'),
    dir,
    filePath: '',
    clips: [],
    transcription: [],
  };

  try {
    await mkdir(path.join(dir, 'cache'));
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw new Error('Unable to create cache directory');
    }
  }

  try {
    await writeFile(result.filePath, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error('Unable to create project file');
  }

  return config;
}

export async function updateProject(
  projectConfig: ProjectConfig
): Promise<void> {
  await writeFile(
    path.join(projectConfig.dir, `${projectConfig.name}.ffai`),
    JSON.stringify(projectConfig, null, 2)
  );
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
