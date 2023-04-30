import React from 'react';

interface AudioFileInputProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  inputFile: File | null;
}

export const AudioFileInput: React.FC<AudioFileInputProps> = ({
  onChange,
  inputFile,
}) => (
  <div className="input-file">
    <label htmlFor="input-file">
      Select a file
      <input
        id="input-file"
        type="file"
        accept="audio/*,video/*"
        onChange={onChange}
      />
    </label>
    {inputFile && <div className="file-name">{inputFile.name}</div>}
  </div>
);

export default AudioFileInput;
