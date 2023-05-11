import React from 'react';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { Editor } from 'shared/types';

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

interface ExportButtonProps {
  handleExport: (editor: Editor) => void;
  loading: boolean;
  disabled: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  handleExport,
  loading,
  disabled,
}) => {
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    handleExport(e.key as Editor);
  };

  const handleButtonClick = () => handleExport(ITEMS[0]!.key as Editor);

  const menuProps = {
    items: ITEMS,
    onClick: handleMenuClick,
  };

  return (
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
  );
};

export default ExportButton;
