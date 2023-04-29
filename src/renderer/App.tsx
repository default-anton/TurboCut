import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import SilenceDetector from './SilenceDetector';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SilenceDetector />} />
      </Routes>
    </Router>
  );
}
