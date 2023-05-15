import { createRoot } from 'react-dom/client';
import App from './App';
import { ProjectConfigProvider } from './hooks/useProjectConfig';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <ProjectConfigProvider>
    <App />
  </ProjectConfigProvider>
);
