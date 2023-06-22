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
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<number>>(
    new Set()
  );
  const [forwardToSegmentId, setForwardToSegmentId] = useState<number>(-1);
  const [hoveredSegmentId, setHoveredSegmentId] = useState<number>(-1);
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
    const findSegmentIdFromSelection = (node: any): number => {
      let segmentId = '';
      if (node.dataset && node.dataset.segmentId) {
        segmentId = node.dataset.segmentId;
      } else if (node.closest) {
        segmentId = node
          .closest('[data-segment-id]')
          ?.getAttribute('data-segment-id');
      } else if (node.parentElement && node.parentElement.closest) {
        segmentId = node.parentElement
          ?.closest('[data-segment-id]')
          ?.getAttribute('data-segment-id');
      }

      if (segmentId) {
        return parseInt(segmentId || '-1', 10);
      }

      return -1;
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();

      if (!selection) return;

      const segmentsInSelection = new Set<number>();

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

        const from = findSegmentIdFromSelection(startElem);
        const to = findSegmentIdFromSelection(endElem);

        if (from === -1 || to === -1) continue;

        for (let j = from; j <= to; j++) {
          segmentsInSelection.add(j);
        }
      }

      setSelectedSegmentIds(segmentsInSelection);
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyUp = async (event: KeyboardEvent) => {
      if (ADD_SEGMENTS_BUTTONS.has(event.key)) {
        await updateDisabledSegmentIds(
          new Set([
            ...Array.from(disabledSegmentIds).filter(
              (id) => !selectedSegmentIds.has(id)
            ),
          ])
        );
        return;
      }

      if (DELETE_SEGMENTS_BUTTONS.has(event.key)) {
        await updateDisabledSegmentIds(
          new Set([
            ...Array.from(disabledSegmentIds),
            ...Array.from(selectedSegmentIds),
          ])
        );

        return;
      }

      if (event.key === 'g' && hoveredSegmentId !== -1) {
        setForwardToSegmentId(hoveredSegmentId);
      }
    };

    window.addEventListener('keyup', handleKeyUp);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    selectedSegmentIds,
    disabledSegmentIds,
    updateDisabledSegmentIds,
    hoveredSegmentId,
  ]);

  const handleExport = useCallback(
    async (editor: Editor) => {
      const clips = await applyEdits(disabledSegmentIds);
      await exportTimeline(editor, clips);
    },
    [applyEdits, disabledSegmentIds, exportTimeline]
  );

  const unsetHoveredSegmentId = useCallback(() => {
    setHoveredSegmentId(-1);
  }, []);

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
            forwardToSegmentId={forwardToSegmentId}
            setForwardToSegmentId={setForwardToSegmentId}
          />
        </Col>
      </Row>

      <Row justify="center">
        <Col className="col">
          <Divider orientation="left">Transcription</Divider>

          <Space direction="vertical" size="large" style={{ display: 'flex' }}>
            <TranscriptionEditor
              ref={textRef}
              transcription={transcription}
              segmentAtPlayhead={segmentAtPlayhead}
              disabledSegmentIds={disabledSegmentIds}
              selectedSegmentIds={selectedSegmentIds}
              onMouseEnterSegment={setHoveredSegmentId}
              onMouseLeaveSegment={unsetHoveredSegmentId}
            />

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
