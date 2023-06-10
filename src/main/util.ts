/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { mkdir } from 'fs/promises';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export async function createDir(dir: string) {
  try {
    await mkdir(dir);
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw new Error('Unable to create cache directory');
    }
  }
}

export async function createCacheDir(projectDir: string) {
  return createDir(path.join(projectDir, 'cache'));
}
