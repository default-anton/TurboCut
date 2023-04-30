import { useEffect, useState, Dispatch, SetStateAction } from 'react';

export function useConvertToMonoMp3(
  inputFile: File | null,
  setIsLoading: Dispatch<SetStateAction<boolean>>
): { outputPath: string | null } {
  const [outputPath, setOutputPath] = useState<string | null>(null);

  useEffect(() => {
    if (!inputFile) return;

    const convert = async () => {
      // outputPath is located in the same directory as the input file, but it has a suffix of "-mono.mp3". inputFile.path
      // is the absolute path of the input file which can be any video or audio file that ffmpeg supports.
      const outPath = inputFile.path.replace(/\.[^/.]+$/, '-mono.wav');
      setIsLoading(true);
      await window.electron.convertToMono(inputFile.path, outPath);
      setOutputPath(outPath);
    };

    convert();
  }, [inputFile, setIsLoading]);

  return { outputPath };
}

export default useConvertToMonoMp3;
