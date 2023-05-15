import { useCallback, useState } from 'react';
import { message } from 'antd';

import { Clip, Editor } from '../../shared/types';
import { useProjectConfig } from './useProjectConfig';

export function useExport(
  clips: Clip[],
  duration: number
): { exportTimeline: (editor: Editor) => Promise<void>; isExporting: boolean } {
  const { projectConfig: { filePath } = {} } = useProjectConfig();
  const [isExporting, setIsExporting] = useState(false);

  const exportTimeline = useCallback(
    async (editor: Editor) => {
      if (!filePath) {
        message.error('Please select a file first');
        return;
      }

      if (editor !== Editor.DaVinciResolve) {
        message.error('Export method not implemented yet');
        return;
      }

      const clipName = filePath.split('/').pop() as string;
      setIsExporting(true);
      message.loading({
        content: `Exporting to ${editor}...`,
        duration: 0,
        key: 'exporting',
      });

      const exported = await window.electron.createEDLWithSilenceRemoved(
        `Export to ${editor}`,
        clips,
        { duration, path: filePath },
        clipName
      );

      setIsExporting(false);
      if (exported) {
        message.success({ content: 'File exported!', key: 'exporting' });
      } else {
        message.warning({ content: 'Export cancelled', key: 'exporting' });
      }
    },
    [filePath, clips, duration]
  );

  return { exportTimeline, isExporting };
}

export default useExport;
