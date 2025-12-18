import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Shield, Globe, CheckCircle, AlertTriangle, Clock, 
  Download, Activity, GitBranch, MessageSquare, RefreshCw
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelative, formatTimestamp, getLabelBadgeClass, getSeverityClass, truncate } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProjectOverview() {
  const { projectId } = useParams();
  const { getProject, addPublicItem, sourceIsolation } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const project = projectId ? getProject(projectId) : null;
  const [realtimeItems, setRealtimeItems] = useState<typeof project.publicItems>([]);

  useEffect(() => {
    if (!project?.realtimeQueue.enabled) return;

    const interval = setInterval(() => {
      if (project.realtimeQueue.pendingPublicItems.length > 0) {
        const newItem = project.realtimeQueue.pendingPublicItems[
          Math.floor(Math.random() * project.realtimeQueue.pendingPublicItems.length)
        ];
        if (newItem && !realtimeItems.find(i => i.id === newItem.id)) {
          setRealtimeItems(prev => [newItem, ...prev.slice(0, 4)]);
          toast({
            title: "New public data ingested",
            description: project.realtimeQueue.toastTemplate,
          });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [project, realtimeItems, toast]);

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  const verifiedCount = project.verificationResults.filter(v => v.label === 'Verified').length;
  const verifiedPercent = project.verificationResults.length > 0 
    ? Math.round((verifiedCount / project.verificationResults.length) * 100)
    : 0;

  const latestSpotrep = project.spotrepVersions[project.spotrepVersions.length - 1];

  const allUpdates = [
    ...project.militaryReports.map(r => ({ ...r, type: 'military' as const, time: r.reportedAt })),
    ...(sourceIsolation === 'combined' 
      ? project.publicItems.map(i => ({ ...i, type: 'public' as const, time: i.postedAt }))
      : []
    ),
    ...realtimeItems.map(i => ({ ...i, type: 'public' as const, time: i.postedAt })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{project.region} · {project.type.replace('_', ' ')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/projects/${projectId}/ingest`)}>
            <Download className="h-4 w-4" />
            Ingest Data
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/projects/${projectId}/verification`)}>
            <Activity className="h-4 w-4" />
            Run Verification
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/projects/${projectId}/knowledge-graph`)}>
            <GitBranch className="h-4 w-4" />
            View Graph
          </Button>
          <Button size="sm" className="gap-2" onClick={() => navigate(`/projects/${projectId}/spotrep`)}>
            <FileText className="h-4 w-4" />
            Generate SPOTREP
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => navigate(`/projects/${projectId}/chat`)}>
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="command-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-military/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-military" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Military Reports</p>
                <p className="text-2xl font-bold text-military">{project.militaryReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="command-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Public Items</p>
                <p className="text-2xl font-bold text-primary">{project.publicItems.length + realtimeItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="command-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-public-verified/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-public-verified" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verified Public %</p>
                <p className="text-2xl font-bold text-public-verified">{verifiedPercent}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="command-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Conflicts</p>
                <p className="text-2xl font-bold text-warning">{project.conflicts.filter(c => c.status === 'Open').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="command-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last SPOTREP</p>
                <p className="text-sm font-medium text-foreground">
                  {latestSpotrep ? formatRelative(latestSpotrep.generatedAt) : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Latest Updates */}
        <div className="col-span-2">
          <Card className="command-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                  Latest Updates
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {sourceIsolation === 'military' ? 'Military Only' : 'Combined View'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
              {allUpdates.map((item, idx) => {
                const verification = 'id' in item && item.type === 'public' 
                  ? project.verificationResults.find(v => v.itemId === item.id)
                  : null;

                return (
                  <div 
                    key={`${item.type}-${'id' in item ? item.id : idx}`}
                    className={cn(
                      'p-3 rounded-lg border',
                      item.type === 'military' ? 'bg-military/5 border-military/20' : 'bg-card border-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === 'military' ? (
                            <span className="badge-military">MILITARY</span>
                          ) : (
                            <>
                              <span className="text-xs px-2 py-0.5 bg-secondary rounded text-secondary-foreground">
                                {(item as any).sourceType?.toUpperCase()}
                              </span>
                              {verification && (
                                <span className={getLabelBadgeClass(verification.label)}>
                                  {verification.label}
                                </span>
                              )}
                            </>
                          )}
                          <span className="font-mono text-xs text-muted-foreground">
                            {'id' in item ? item.id : ''}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {truncate('text' in item ? item.text : '', 150)}
                        </p>
                        {item.type === 'military' && 'unit' in item && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Unit: {item.unit} · {(item as any).location?.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-muted-foreground">
                          {formatTimestamp(item.time)}
                        </p>
                        {verification && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Conf: {Math.round(verification.finalConfidence * 100)}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Open Conflicts */}
        <div>
          <Card className="command-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Open Conflicts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.conflicts.filter(c => c.status === 'Open').map(conflict => (
                <div 
                  key={conflict.id}
                  className={cn('p-3 rounded-lg', getSeverityClass(conflict.severity))}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs">{conflict.id}</span>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded uppercase font-medium',
                      conflict.severity === 'amber' ? 'bg-warning/20 text-warning' : 
                      conflict.severity === 'red' ? 'bg-destructive/20 text-destructive' :
                      'bg-primary/20 text-primary'
                    )}>
                      {conflict.severity}
                    </span>
                  </div>
                  <p className="text-sm">{conflict.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {conflict.items.map(itemId => (
                      <span key={itemId} className="font-mono text-xs bg-background/50 px-1.5 py-0.5 rounded">
                        {itemId}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {project.conflicts.filter(c => c.status === 'Open').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No open conflicts</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
