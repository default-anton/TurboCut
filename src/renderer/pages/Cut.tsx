import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Col, Row, Space, Divider } from 'antd';

import { useProjectConfig } from 'renderer/hooks/useProjectConfig';
import { useExport } from 'renderer/hooks/useExport';
import { useTranscription } from 'renderer/hooks/useTranscription';

import CutTimeline from 'renderer/components/CutTimeline';
import ExportButton from 'renderer/components/ExportButton';
import TranscriptionEditor from 'renderer/components/TranscriptionEditor';
import { Editor } from 'shared/types';

const DELETE_SEGMENTS_BUTTONS = new Set(['Backspace', 'Delete', 'd', 'x']);
const ADD_SEGMENTS_BUTTONS = new Set(['Enter', 'a']);

const Cut: FC = () => {
  const {
    projectConfig: { transcription, disabledSegmentIds },
    updateDisabledSegmentIds,
  } = useProjectConfig();
  const { exportTimeline, isExporting } = useExport();
  const [segmentAtPlayhead, setSegmentAtPlayhead] = useState<number>(0);
  const textRef = useRef<HTMLElement>(null);
  const { applyEdits } = useTranscription();

  useEffect(() => {
    const element = textRef.current;
    if (element && element.scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [segmentAtPlayhead]);

  useEffect(() => {
    const handleKeyUp = async (event: KeyboardEvent) => {
      if (
        !DELETE_SEGMENTS_BUTTONS.has(event.key) &&
        !ADD_SEGMENTS_BUTTONS.has(event.key)
      ) {
        return;
      }

      const selection = window.getSelection();

      if (!selection) return;

      const changedSegments = new Set<number>();

      for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        const startElem = Array.prototype.find.call(
          range.startContainer.parentElement?.childNodes,
          (node) => range.startContainer === node
        );
        const endElem = Array.prototype.find.call(
          range.endContainer.parentElement?.childNodes,
          (node) => range.endContainer === node
        );

        if (!startElem || !endElem) {
          continue;
        }

        let start = '';
        if (startElem.dataset && startElem.dataset.segmentId) {
          start = startElem.dataset.segmentId;
        } else if (startElem.closest) {
          start = startElem
            .closest('[data-segment-id]')
            ?.getAttribute('data-segment-id');
        } else if (startElem.parentElement && startElem.parentElement.closest) {
          start = startElem.parentElement
            ?.closest('[data-segment-id]')
            ?.getAttribute('data-segment-id');
        } else {
          continue;
        }

        let end = '';
        if (endElem.dataset && endElem.dataset.segmentId) {
          end = endElem.dataset.segmentId;
        } else if (endElem.closest) {
          end = endElem
            .closest('[data-segment-id]')
            ?.getAttribute('data-segment-id');
        } else if (endElem.parentElement && endElem.parentElement.closest) {
          end = endElem.parentElement
            ?.closest('[data-segment-id]')
            ?.getAttribute('data-segment-id');
        } else {
          continue;
        }

        const from = parseInt(start || '-1', 10);
        const to = parseInt(end || '-1', 10);

        if (from !== -1 && to !== -1) {
          for (let j = from; j <= to; j++) {
            changedSegments.add(j);
          }
        }
      }

      if (ADD_SEGMENTS_BUTTONS.has(event.key)) {
        await updateDisabledSegmentIds(
          new Set([
            ...Array.from(disabledSegmentIds).filter(
              (id) => !changedSegments.has(id)
            ),
          ])
        );
      } else if (DELETE_SEGMENTS_BUTTONS.has(event.key)) {
        await updateDisabledSegmentIds(
          new Set([
            ...Array.from(disabledSegmentIds),
            ...Array.from(changedSegments),
          ])
        );
      }
    };

    window.addEventListener('keyup', handleKeyUp);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabledSegmentIds, updateDisabledSegmentIds]);

  const handleExport = useCallback(
    async (editor: Editor) => {
      const clips = await applyEdits(disabledSegmentIds);
      await exportTimeline(editor, clips);
    },
    [applyEdits, disabledSegmentIds, exportTimeline]
  );

  return (
    <>
      <Row justify="center">
        <Col className="col">
          <CutTimeline
            disabledSegmentIds={disabledSegmentIds}
            setSegmentAtPlayhead={(segmentId) => {
              if (segmentId !== null && segmentId !== segmentAtPlayhead) {
                setSegmentAtPlayhead(segmentId);
              }
            }}
          />
        </Col>
      </Row>

      <Row justify="center">
        <Col className="col">
          <Divider orientation="left">Transcription</Divider>

          <TranscriptionEditor
            transcription={transcription}
            segmentAtPlayhead={segmentAtPlayhead}
            disabledSegmentIds={disabledSegmentIds}
            ref={textRef}
          />

          <Space wrap>
            <ExportButton
              handleExport={handleExport}
              loading={isExporting}
              disabled={isExporting}
            />
          </Space>
        </Col>
      </Row>
    </>
  );
};

export default Cut;
