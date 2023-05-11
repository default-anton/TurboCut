import React, { useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import Dragger from 'antd/es/upload/Dragger';

import type { RcFile, UploadFile } from 'antd/es/upload/interface';

interface AudioFileInputProps {
  onChange: (file: File) => void;
  loading?: boolean;
}

export const AudioFileInput: React.FC<AudioFileInputProps> = ({
  onChange,
  loading,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const beforeUpload = (file: RcFile): boolean => {
    setFileList([file]);
    onChange(file);

    return false;
  };

  return (
    <Dragger
      name="file"
      multiple={false}
      accept="audio/*,video/*"
      beforeUpload={beforeUpload}
      showUploadList={{ showRemoveIcon: false, showDownloadIcon: false }}
      fileList={fileList}
      disabled={loading}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        Click or drag file to this area to upload
      </p>
      <p className="ant-upload-hint">Video or audio files are supported</p>
    </Dragger>
  );
};

AudioFileInput.defaultProps = {
  loading: false,
};

export default AudioFileInput;
