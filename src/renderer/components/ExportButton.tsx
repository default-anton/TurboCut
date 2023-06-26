import React, { useCallback, useState } from 'react';
import { Form, MenuProps, Modal, Select, Dropdown, Space } from 'antd';
import { Editor } from 'shared/types';
import { useProjectConfig } from 'renderer/hooks/useProjectConfig';

const ITEMS: MenuProps['items'] = [
  {
    label: 'to Davinci Resolve',
    key: Editor.DaVinciResolve,
  },
  {
    label: 'to Adobe Premiere Pro',
    key: Editor.PremierePro,
  },
  {
    label: 'to Final Cut Pro',
    key: Editor.FinalCutPro,
  },
];

const FRAME_RATES: number[] = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];

interface ExportButtonProps {
  handleExport: (editor: Editor, frameRate: number) => Promise<void>;
  loading: boolean;
  disabled: boolean;
}

interface ExportProps {
  frameRate: number;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  handleExport,
  loading,
  disabled,
}) => {
  const {
    projectConfig: { frameRate: projectFrameRate },
  } = useProjectConfig();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editor, setEditor] = useState<Editor>(ITEMS[0]!.key as Editor);
  const [form] = Form.useForm<ExportProps>();

  const onSubmit = useCallback(
    async (values: ExportProps) => {
      await handleExport(editor, values.frameRate);
    },
    [handleExport, editor]
  );

  const closeModal = useCallback(() => {
    form.resetFields();
    setIsOpen(false);
  }, [form]);

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    if (projectFrameRate !== 0) {
      await handleExport(e.key as Editor, projectFrameRate);
      return;
    }

    setEditor(e.key as Editor);
    setIsOpen(true);
  };

  const handleButtonClick = useCallback(async () => {
    if (projectFrameRate !== 0) {
      await handleExport(ITEMS[0]!.key as Editor, projectFrameRate);
      return;
    }

    setEditor(ITEMS[0]!.key as Editor);
    setIsOpen(true);
  }, [handleExport, projectFrameRate]);

  const menuProps = {
    items: ITEMS,
    onClick: handleMenuClick,
  };

  return (
    <>
      <Space wrap>
        <Dropdown.Button
          menu={menuProps}
          loading={loading}
          disabled={disabled}
          onClick={handleButtonClick}
          buttonsRender={([leftButton, rightButton]) => [
            leftButton,
            React.cloneElement(rightButton as React.ReactElement<any, string>, {
              loading,
              disabled,
            }),
          ]}
        >
          Export
        </Dropdown.Button>
      </Space>

      <Modal
        centered
        width={400}
        visible={isOpen}
        onOk={form.submit}
        onCancel={closeModal}
      >
        <Form form={form} onFinish={onSubmit} requiredMark>
          <Form.Item
            label="Frame Rate"
            name="frameRate"
            rules={[{ required: true }]}
            tooltip="The frame rate of the video"
            style={{ width: '90%' }}
          >
            <Select>
              {FRAME_RATES.map((fr) => (
                <Select.Option key={fr} value={fr}>
                  {fr}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ExportButton;
