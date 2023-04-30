import React from 'react';

interface InputParametersProps {
  minSilenceLen: number;
  setMinSilenceLen: (value: number) => void;
  silenceThresh: number;
  setSilenceThresh: (value: number) => void;
  padding: number;
  setPadding: (value: number) => void;
}

export const InputParameters: React.FC<InputParametersProps> = ({
  minSilenceLen,
  setMinSilenceLen,
  silenceThresh,
  setSilenceThresh,
  padding,
  setPadding,
}) => (
  <div className="input-parameters">
    <div className="input-min-silence-len">
      <label htmlFor="input-min-silence-len">
        Minimum Silence Length:
        <input
          id="input-min-silence-len"
          type="number"
          value={minSilenceLen}
          onChange={(event) => setMinSilenceLen(parseFloat(event.target.value))}
        />
      </label>
    </div>
    <div className="input-silence-thresh">
      <label htmlFor="input-silence-thresh">
        Silence Threshold:
        <input
          id="input-silence-thresh"
          type="number"
          value={silenceThresh}
          onChange={(event) => setSilenceThresh(parseFloat(event.target.value))}
        />
      </label>
    </div>
    <div className="input-padding">
      <label htmlFor="input-padding">
        Padding:
        <input
          id="input-padding"
          type="number"
          value={padding}
          onChange={(event) => setPadding(parseFloat(event.target.value))}
        />
      </label>
    </div>
  </div>
);

export default InputParameters;
