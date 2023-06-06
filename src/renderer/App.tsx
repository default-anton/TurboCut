import { message, Layout } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';

import { ProjectStep } from 'shared/types';

import { useProjectConfig } from './hooks/useProjectConfig';

import Setup from './pages/Setup';
import Startup from './pages/Startup';
import Cut from './pages/Cut';

import 'antd/dist/reset.css';

import './App.scss';

export default function App() {
  const [, contextHolder] = message.useMessage();
  const { projectConfig } = useProjectConfig();

  return (
    <>
      {contextHolder}
      <Layout>
        <Content>
          {projectConfig && projectConfig.projectStep < ProjectStep.Edit && (
            <Setup />
          )}
          {projectConfig && projectConfig.projectStep === ProjectStep.Edit && (
            <Cut />
          )}
          {!projectConfig && <Startup />}
        </Content>
        <Footer />
      </Layout>
    </>
  );
}
