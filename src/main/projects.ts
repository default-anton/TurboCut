import { access, constants, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

import { app, dialog } from 'electron';

import { ProjectConfig } from '../shared/types';

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

  return JSON.parse(await readFile(configPath, 'utf-8')) as ProjectConfig;
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
  await access(dir, constants.R_OK | constants.W_OK);

  const config: ProjectConfig = {
    name: path.basename(result.filePath, '.ffai'),
    dir,
    filePath: '',
    clips: [],
  };

  await mkdir(path.join(dir, 'cache'));
  await writeFile(result.filePath, JSON.stringify(config, null, 2));

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
  access(dir, constants.R_OK | constants.W_OK);

  return result.filePath;
};
