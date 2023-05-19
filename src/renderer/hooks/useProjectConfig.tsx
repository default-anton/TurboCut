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

import { ProjectConfig, Transcription, Clip } from '../../shared/types';

type ProjectActions = {
  openProject: () => void;
  createProject: () => void;
  updateFilePath: (filePath: string) => Promise<void>;
  updateTranscription: (transcription: Transcription) => Promise<void>;
  updateClips: (clips: Clip[]) => Promise<void>;
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
      if (!newProjectConfig) return;

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
      if (!newProjectConfig) return;

      setProjectConfig(newProjectConfig);
      message.success('Project created successfully');
    } catch (e: any) {
      message.error(`Failed to create project: ${e.message}`);
    }
  }, []);
  const updateFilePath = useCallback(
    async (filePath: string) => {
      if (!projectConfig) return;

      const newProjectConfig = { ...projectConfig, filePath };
      await window.electron.updateProject(newProjectConfig);
      setProjectConfig(newProjectConfig);
    },
    [projectConfig]
  );
  const updateTranscription = useCallback(
    async (transcription: Transcription) => {
      if (!projectConfig) return;

      const newProjectConfig = {
        ...projectConfig,
        transcription,
      };
      await window.electron.updateProject(newProjectConfig);
      setProjectConfig(newProjectConfig);
    },
    [projectConfig]
  );
  const updateClips = useCallback(
    async (clips: Clip[]) => {
      if (!projectConfig) return;

      const newProjectConfig = {
        ...projectConfig,
        clips,
      };
      await window.electron.updateProject(newProjectConfig);
      setProjectConfig(newProjectConfig);
    },
    [projectConfig]
  );

  const value = useMemo(
    () => ({
      projectConfig,
      openProject,
      createProject,
      updateFilePath,
      updateTranscription,
      updateClips,
    }),
    [
      projectConfig,
      openProject,
      createProject,
      updateFilePath,
      updateTranscription,
      updateClips,
    ]
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
