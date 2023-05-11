import { message } from 'antd';

import 'antd/dist/reset.css';

import SilenceDetector from './SilenceDetector';

export default function App() {
  const [, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <SilenceDetector />
    </>
  );
}
