import { NavLink, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Download, 
  CheckCircle, 
  GitBranch, 
  Map, 
  FileText, 
  MessageSquare,
  ChevronLeft,
  Settings,
  FolderKanban
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const projectNavItems = [
  { to: 'overview', label: 'Overview', icon: LayoutDashboard },
  { to: 'ingest', label: 'Ingest', icon: Download },
  { to: 'verification', label: 'Verification', icon: CheckCircle },
  { to: 'knowledge-graph', label: 'Knowledge Graph', icon: GitBranch },
  { to: 'timeline-map', label: 'Timeline + Map', icon: Map },
  { to: 'spotrep', label: 'SPOTREP', icon: FileText },
  { to: 'chat', label: 'Chat Assistant', icon: MessageSquare },
];

export function ProjectSidebar() {
  const { projectId } = useParams();
  const { getProject, sourceIsolation, setSourceIsolation } = useData();
  const project = projectId ? getProject(projectId) : null;

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="p-3 border-b border-sidebar-border">
        <NavLink to="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          <span>All Projects</span>
        </NavLink>
      </div>

      {project && (
        <div className="p-3 border-b border-sidebar-border">
          <h2 className="font-semibold text-sm text-foreground truncate">{project.name}</h2>
          <p className="text-xs text-muted-foreground mt-1">{project.region}</p>
        </div>
      )}

      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {projectNavItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={`/projects/${projectId}/${item.to}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Source Isolation</label>
          <Select value={sourceIsolation} onValueChange={(v) => setSourceIsolation(v as 'military' | 'combined')}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="military">Military Only</SelectItem>
              <SelectItem value="combined">Combined View</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <NavLink to="/settings">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </NavLink>
      </div>
    </aside>
  );
}
