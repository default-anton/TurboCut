import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  FC,
  useMemo,
} from 'react';
import { message } from 'antd';

import { ProjectConfig } from '../../shared/types';

type ProjectActions = {
  openProject: () => void;
  createProject: () => void;
  setProjectFilePath: (filePath: string) => Promise<void>;
};

interface ProjectContextValue extends ProjectActions {
  projectConfig: ProjectConfig | undefined;
}

// Create a Context for the projectConfig
const ProjectConfigContext = createContext<ProjectContextValue | undefined>(
  undefined
);

// Create a Provider component
export const ProjectConfigProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | undefined>(
    undefined
  );
  const openProject = useCallback(async () => {
    try {
      const newProjectConfig = await window.electron.openProject();
      // User cancelled the open project dialog
      if (!newProjectConfig) {
        return;
      }

      setProjectConfig(newProjectConfig);
      message.success('Project opened successfully');
    } catch (e: any) {
      message.error(`Failed to open project: ${e.message}`);
    }
  }, []);
  const createProject = useCallback(async () => {
    try {
      const newProjectConfig = await window.electron.createProject();
      // User cancelled the open project dialog
      if (!newProjectConfig) {
        return;
      }

      setProjectConfig(newProjectConfig);
      message.success('Project created successfully');
    } catch (e: any) {
      message.error(`Failed to create project: ${e.message}`);
    }
  }, []);
  const setProjectFilePath = useCallback(
    async (filePath: string) => {
      if (projectConfig) {
        const newProjectConfig = { ...projectConfig, filePath };
        await window.electron.updateProject(newProjectConfig);
        setProjectConfig(newProjectConfig);
      }
    },
    [projectConfig]
  );

  const value = useMemo(
    () => ({
      projectConfig,
      openProject,
      createProject,
      setProjectFilePath,
    }),
    [projectConfig, openProject, createProject, setProjectFilePath]
  );

  // Provide the projectConfig and related functions to children
  return (
    <ProjectConfigContext.Provider value={value}>
      {children}
    </ProjectConfigContext.Provider>
  );
};

export const useProjectConfig = (): ProjectContextValue => {
  const context = useContext(ProjectConfigContext);
  if (context === undefined) {
    throw new Error(
      'useProjectConfig must be used within a ProjectConfigProvider'
    );
  }
  return context;
};
