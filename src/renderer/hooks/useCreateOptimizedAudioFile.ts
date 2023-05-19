import { useEffect, useState } from 'react';
import { useProjectConfig } from './useProjectConfig';

export function useCreateOptimizedAudioFile(): {
  pathToOptimizedAudioFile: string | null;
} {
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const { projectConfig: { filePath, dir } = {} } = useProjectConfig();

  useEffect(() => {
    if (!filePath || !dir) return;

    const convert = async () => {
      const outPath = await window.electron.compressAudioFile(filePath, dir);
      setOutputPath(outPath);
    };

    convert();
  }, [filePath, dir]);

  return { pathToOptimizedAudioFile: outputPath };
}

export default useCreateOptimizedAudioFile;
