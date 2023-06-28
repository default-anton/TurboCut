import { useCallback, useState } from 'react';
import { message } from 'antd';

import { Clip, Editor } from '../../shared/types';
import { useProjectConfig } from './useProjectConfig';

export function useExport(): {
  exportTimeline: (
    editor: Editor,
    frameRate: number,
    leaveGaps: boolean,
    clipsToExport?: Clip[]
  ) => Promise<void>;
  isExporting: boolean;
} {
  const { projectConfig: { filePath, fileDuration, clips } = {} } =
    useProjectConfig();
  const [isExporting, setIsExporting] = useState(false);

  const exportTimeline = useCallback(
    async (
      editor: Editor,
      frameRate: number,
      leaveGaps: boolean,
      clipsToExport?: Clip[]
    ) => {
      if (!filePath || !clips || !fileDuration) {
        message.error('Please select a file first');
        return;
      }

      if (editor !== Editor.DaVinciResolve) {
        message.error('Export method not implemented yet');
        return;
      }

      window.log.info(`Exporting timeline to ${editor}`);

      const clipName = filePath.split('/').pop() as string;
      setIsExporting(true);
      message.loading({
        content: `Exporting to ${editor}...`,
        duration: 0,
        key: 'exporting',
      });

      const exported = await window.electron.createFCPXML(
        `Export to ${editor}`,
        clipsToExport || clips,
        { duration: fileDuration, path: filePath },
        clipName,
        frameRate,
        leaveGaps
      );

      setIsExporting(false);
      if (exported) {
        window.log.info(`Exported timeline to ${editor}`);
        message.success({ content: 'File exported!', key: 'exporting' });
      } else {
        window.log.info(`Export timeline to ${editor} cancelled`);
        message.warning({ content: 'Export cancelled', key: 'exporting' });
      }
    },
    [filePath, clips, fileDuration]
  );

  return { exportTimeline, isExporting };
}

export default useExport;
