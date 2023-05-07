import React from 'react';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';

export type ExportKey =
  | 'davinci_resolve'
  | 'adobe_preimere_pro'
  | 'final_cut_pro';

const ITEMS: MenuProps['items'] = [
  {
    label: 'to Davinci Resolve',
    key: 'davinci_resolve' as ExportKey,
  },
  {
    label: 'to Adobe Premiere Pro',
    key: 'adobe_preimere_pro' as ExportKey,
  },
  {
    label: 'to Final Cut Pro',
    key: 'final_cut_pro' as ExportKey,
  },
];

interface ExportButtonProps {
  handleExport: (key: ExportKey) => void;
  loading: boolean;
  disabled: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  handleExport,
  loading,
  disabled,
}) => {
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    handleExport(e.key as ExportKey);
  };

  const handleButtonClick = () => handleExport(ITEMS[0]!.key as ExportKey);

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
