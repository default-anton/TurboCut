import { useEffect, useState } from 'react';
import { useProjectConfig } from './useProjectConfig';

export function useCreateOptimizedAudioFile(): {
  pathToOptimizedAudioFile: string | null;
} {
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const { projectConfig: { filePath } = {} } = useProjectConfig();

  useEffect(() => {
    if (!filePath) return;

    const convert = async () => {
      // outputPath is located in the same directory as the input file, but it has a suffix of ".compressed.mono.wav".
      // filePath.path is the absolute path of the input file which can be any video or audio file that ffmpeg supports.
      const outPath = filePath.replace(/\.[^/.]+$/, '.compressed.mono.wav');
      await window.electron.compressAudioFile(filePath, outPath);
      setOutputPath(outPath);
    };

    convert();
  }, [filePath]);

  return { pathToOptimizedAudioFile: outputPath };
}

export default useCreateOptimizedAudioFile;
