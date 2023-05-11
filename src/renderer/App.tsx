import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { message } from 'antd';

import 'antd/dist/reset.css';

import SilenceDetector from './SilenceDetector';

export default function App() {
  const [, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <Router>
        <Routes>
          <Route path="/" element={<SilenceDetector />} />
        </Routes>
      </Router>
    </>
  );
}
