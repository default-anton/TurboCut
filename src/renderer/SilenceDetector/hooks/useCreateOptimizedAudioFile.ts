import { useEffect, useState } from 'react';

export function useCreateOptimizedAudioFile(inputFile: File | null): {
  pathToOptimizedAudioFile: string | null;
} {
  const [outputPath, setOutputPath] = useState<string | null>(null);

  useEffect(() => {
    if (!inputFile) return;

    const convert = async () => {
      // outputPath is located in the same directory as the input file, but it has a suffix of "-mono.mp3". inputFile.path
      // is the absolute path of the input file which can be any video or audio file that ffmpeg supports.
      const outPath = inputFile.path.replace(/\.[^/.]+$/, '-mono.wav');
      await window.electron.convertToMono(inputFile.path, outPath);
      setOutputPath(outPath);
    };

    convert();
  }, [inputFile]);

  return { pathToOptimizedAudioFile: outputPath };
}

export default useCreateOptimizedAudioFile;
