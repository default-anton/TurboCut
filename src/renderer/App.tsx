import { message, Layout } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';

import { useProjectConfig } from './hooks/useProjectConfig';

import Project from './pages/Project';
import Startup from './pages/Startup';

import 'antd/dist/reset.css';
import './App.scss';

export default function App() {
  const [, contextHolder] = message.useMessage();
  const { projectConfig: { filePath } } = useProjectConfig();

  return (
    <>
      {contextHolder}
      <Layout>
        <Content>
          {filePath && <Project />}
          {!filePath && <Startup />}
        </Content>
        <Footer />
      </Layout>
    </>
  );
}
