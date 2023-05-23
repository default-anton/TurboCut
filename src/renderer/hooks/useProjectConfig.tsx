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

import {
  ProjectConfig,
  Transcription,
  Clip,
  ProjectStep,
} from '../../shared/types';

type AllClips = {
  clips?: Clip[];
  silence?: Clip[];
  speech?: Clip[];
};

type ProjectActions = {
  openProject: () => void;
  createProject: () => void;
  updateFilePath: (filePath: string) => Promise<void>;
  updateTranscription: (transcription: Transcription) => Promise<void>;
  updateClips: (allClips: AllClips) => Promise<void>;
  updateProjectStep: (projectStep: ProjectStep) => Promise<void>;
};

interface ProjectContextValue extends ProjectActions {
  projectConfig: ProjectConfig;
}

// Create a Context for the projectConfig
const ProjectConfigContext = createContext<ProjectContextValue | undefined>(
  undefined
);

// Create a Provider component
export const ProjectConfigProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [projectConfig, setProjectConfig] = useState<
    ProjectConfig | undefined
  >();
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

      const fileDuration = await window.electron.getVideoDuration(filePath);
      const newProjectConfig = {
        ...projectConfig,
        projectStep: ProjectStep.DetectSilence,
        filePath,
        fileDuration,
        // Reset the clips to a single clip spanning the entire file
        clips: [{ start: 0, end: fileDuration }],
      };

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
    async ({ clips, silence, speech }: AllClips) => {
      if (!projectConfig) return;

      const newProjectConfig = {
        ...projectConfig,
      };
      if (clips) newProjectConfig.clips = clips;
      if (silence) newProjectConfig.silence = silence;
      if (speech) newProjectConfig.speech = speech;

      await window.electron.updateProject(newProjectConfig);
      setProjectConfig(newProjectConfig);
    },
    [projectConfig]
  );
  const updateProjectStep = useCallback(
    async (projectStep: ProjectStep) => {
      if (!projectConfig) return;

      const newProjectConfig = {
        ...projectConfig,
        projectStep,
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
      updateProjectStep,
    }),
    [
      projectConfig,
      openProject,
      createProject,
      updateFilePath,
      updateTranscription,
      updateClips,
      updateProjectStep,
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
