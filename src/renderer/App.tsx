import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import SilenceDetector from './SilenceDetector';

import 'antd/dist/reset.css';
import { message } from 'antd';

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
