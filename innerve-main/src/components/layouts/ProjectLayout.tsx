import { Outlet } from 'react-router-dom';
import { StatusBar } from '@/components/StatusBar';
import { ProjectSidebar } from '@/components/ProjectSidebar';

export function ProjectLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StatusBar />
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar />
        <main className="flex-1 overflow-auto p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
