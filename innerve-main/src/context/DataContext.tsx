import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppData, Project, PublicItem } from '@/types';
import seedData from '@/data/seedData.json';

interface DataContextType {
  data: AppData;
  getProject: (id: string) => Project | undefined;
  addProject: (project: Partial<Project>) => void;
  addPublicItem: (projectId: string, item: PublicItem) => void;
  sourceIsolation: 'military' | 'combined';
  setSourceIsolation: (mode: 'military' | 'combined') => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(seedData as unknown as AppData);
  const [sourceIsolation, setSourceIsolation] = useState<'military' | 'combined'>('combined');

  const getProject = useCallback((id: string) => {
    return data.projects.find(p => p.id === id);
  }, [data.projects]);

  const addProject = useCallback((partialProject: Partial<Project>) => {
    const newProject: Project = {
      id: `PRJ-${String(data.projects.length + 1).padStart(3, '0')}`,
      name: partialProject.name || 'New Project',
      type: partialProject.type || 'investigation',
      region: partialProject.region || 'Unspecified',
      status: 'Active',
      createdBy: 'Demo Analyst',
      createdAt: new Date().toISOString(),
      timeWindow: partialProject.timeWindow || {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      },
      tags: partialProject.tags || [],
      ingestionConfig: {
        keywords: [],
        locationHint: partialProject.region || '',
        radiusKm: 15,
        sources: { social: true, news: true, alerts: false },
      },
      militaryReports: [],
      publicItems: [],
      verificationResults: [],
      entities: [],
      relations: [],
      conflicts: [],
      spotrepVersions: [],
      chat: {
        suggestedPrompts: [
          'What are the key events so far?',
          'List all verified sources.',
          'Summarize conflicts.',
        ],
        qaPairs: [],
      },
      realtimeQueue: {
        enabled: true,
        intervalSeconds: 10,
        toastTemplate: '2 new public updates ingested',
        pendingPublicItems: [],
      },
    };

    setData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));

    return newProject;
  }, [data.projects.length]);

  const addPublicItem = useCallback((projectId: string, item: PublicItem) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? { ...p, publicItems: [...p.publicItems, item] }
          : p
      ),
    }));
  }, []);

  return (
    <DataContext.Provider value={{ data, getProject, addProject, addPublicItem, sourceIsolation, setSourceIsolation }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
