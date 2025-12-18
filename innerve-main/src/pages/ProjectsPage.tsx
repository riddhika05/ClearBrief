import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Activity, Clock, TrendingUp, FolderKanban, Search } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { StatusBar } from '@/components/StatusBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRelative, getStatusClass } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const projectTypes = [
  { value: 'border_incident', label: 'Border Incident' },
  { value: 'urban_security', label: 'Urban Security' },
  { value: 'disaster_relief', label: 'Disaster Relief' },
  { value: 'investigation', label: 'General Investigation' },
];

export default function ProjectsPage() {
  const { data, addProject } = useData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    type: 'investigation',
    region: '',
  });

  const filteredProjects = data.projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = () => {
    if (!newProject.name) return;
    addProject(newProject);
    setIsCreateOpen(false);
    setNewProject({ name: '', type: 'investigation', region: '' });
  };

  const getVerifiedPercentage = (projectId: string) => {
    const project = data.projects.find(p => p.id === projectId);
    if (!project || project.verificationResults.length === 0) return 0;
    const verified = project.verificationResults.filter(v => v.label === 'Verified').length;
    return Math.round((verified / project.verificationResults.length) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StatusBar />
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-primary" />
              Projects
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and monitor crisis intelligence investigations</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g., Border Analysis - Sector East"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newProject.type} onValueChange={(v) => setNewProject({ ...newProject, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region / AOI</Label>
                  <Input
                    value={newProject.region}
                    onChange={(e) => setNewProject({ ...newProject, region: e.target.value })}
                    placeholder="e.g., Sector East AOI"
                  />
                </div>
                <Button onClick={handleCreateProject} className="w-full">Create Project</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredProjects.map(project => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}/overview`)}
              className="command-card p-5 cursor-pointer hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', getStatusClass(project.status))}>
                      <span className={cn('inline-block h-1.5 w-1.5 rounded-full mr-1.5',
                        project.status === 'Active' ? 'bg-public-verified' : 
                        project.status === 'Monitoring' ? 'bg-primary' : 'bg-muted-foreground'
                      )} />
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono text-xs">{project.id}</span>
                    <span>{project.region}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelative(project.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Military Reports</p>
                    <p className="text-lg font-semibold text-military">{project.militaryReports.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Public Items</p>
                    <p className="text-lg font-semibold text-primary">{project.publicItems.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verified %</p>
                    <p className="text-lg font-semibold text-public-verified">{getVerifiedPercentage(project.id)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conflicts</p>
                    <p className={cn('text-lg font-semibold', project.conflicts.length > 0 ? 'text-warning' : 'text-muted-foreground')}>
                      {project.conflicts.length}
                    </p>
                  </div>
                  <div className="w-20 h-10">
                    {/* Mini sparkline placeholder */}
                    <div className="flex items-end gap-0.5 h-full">
                      {[40, 55, 48, 60, 72, 65, 78].map((v, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-public-verified/60 rounded-t"
                          style={{ height: `${v}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
