import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GitBranch, Filter, Shield, Globe, Link2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Entity, Relation } from '@/types';
import { ForceKnowledgeGraph } from '@/components/ForceKnowledgeGraph';

const entityColors: Record<string, string> = {
  event: 'bg-warning/20 text-warning border-warning/30',
  location: 'bg-primary/20 text-primary border-primary/30',
  unit: 'bg-military/20 text-military border-military/30',
  person: 'bg-accent/20 text-accent border-accent/30',
};

export default function KnowledgeGraphPage() {
  const { projectId } = useParams();
  const { getProject } = useData();
  const project = projectId ? getProject(projectId) : null;

  const [graphType, setGraphType] = useState<'military' | 'combined'>('combined');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(null);

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  const filteredEntities = project.entities.filter(e => filterType === 'all' || e.type === filterType);
  
  const militaryRelations = project.relations.filter(r => {
    const evidence = r.evidence || [];
    return evidence.every(e => e.startsWith('MIL-'));
  });

  const displayedRelations = graphType === 'military' ? militaryRelations : project.relations;
  const conflictRelations = displayedRelations.filter(r => r.type === 'conflicts_with');

  const getEntityById = (id: string) => project.entities.find(e => e.id === id);

  const getLinkedSources = (entityId: string) => {
    const relations = displayedRelations.filter(r => r.from === entityId || r.to === entityId);
    const sourceIds = new Set<string>();
    relations.forEach(r => {
      r.evidence?.forEach(e => sourceIds.add(e));
    });
    return Array.from(sourceIds);
  };

  const relationEvidence = useMemo(() => {
    if (!selectedRelation) return [] as string[];
    return selectedRelation.evidence || [];
  }, [selectedRelation]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            Knowledge Graph
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Explore entities, relations, and evidence chains</p>
        </div>
      </div>

      <Tabs value={graphType} onValueChange={(v) => setGraphType(v as 'military' | 'combined')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="military" className="gap-2">
              <Shield className="h-4 w-4" />
              Military Graph
            </TabsTrigger>
            <TabsTrigger value="combined" className="gap-2">
              <Globe className="h-4 w-4" />
              Combined Graph
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                <SelectItem value="location">Locations</SelectItem>
                <SelectItem value="unit">Units</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={graphType} className="mt-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Graph Stats */}
            <div className="col-span-3 grid grid-cols-4 gap-4">
              <Card className="command-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nodes</span>
                    <span className="text-2xl font-bold text-primary">{filteredEntities.length}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="command-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Edges</span>
                    <span className="text-2xl font-bold text-primary">{displayedRelations.length}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="command-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conflicts</span>
                    <span className="text-2xl font-bold text-warning">{conflictRelations.length}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="command-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sources</span>
                    <span className="text-2xl font-bold text-public-verified">
                      {graphType === 'military' ? project.militaryReports.length : project.militaryReports.length + project.publicItems.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Force Graph */}
            <div className="col-span-2">
              <Card className="command-card h-[500px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    Graph View
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[440px]">
                  <ForceKnowledgeGraph
                    className="h-full"
                    entities={project.entities}
                    relations={displayedRelations}
                    filterType={filterType}
                    onSelectEntity={(e) => {
                      setSelectedEntity(e);
                      setSelectedRelation(null);
                    }}
                    onSelectRelation={(r) => {
                      setSelectedRelation(r);
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Selected Entity / Relation Detail */}
            <div>
              <Card className="command-card h-[500px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Entity Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedRelation ? (
                    <div className="space-y-4">
                      <div className={cn('p-4 rounded-lg border bg-muted')}> 
                        <h3 className="font-semibold">Relation</h3>
                        <p className="font-mono text-xs mt-1">{selectedRelation.id}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline" className="capitalize">{selectedRelation.type.replace('_', ' ')}</Badge>
                          <Badge variant="outline">{Math.round(selectedRelation.confidence * 100)}%</Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Endpoints</h4>
                        <div className="space-y-2">
                          <div className="rounded-lg border bg-background/40 p-2">
                            <p className="text-xs text-muted-foreground">From</p>
                            <p className="text-sm font-medium">{getEntityById(selectedRelation.from)?.name || selectedRelation.from}</p>
                          </div>
                          <div className="rounded-lg border bg-background/40 p-2">
                            <p className="text-xs text-muted-foreground">To</p>
                            <p className="text-sm font-medium">{getEntityById(selectedRelation.to)?.name || selectedRelation.to}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Evidence</h4>
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                          {relationEvidence.map((sourceId) => (
                            <div
                              key={sourceId}
                              className={cn(
                                'px-2 py-1.5 rounded text-xs font-mono',
                                sourceId.startsWith('MIL-') ? 'bg-military/10 text-military' : 'bg-primary/10 text-primary'
                              )}
                            >
                              {sourceId}
                            </div>
                          ))}
                          {relationEvidence.length === 0 && (
                            <p className="text-sm text-muted-foreground">No evidence attached</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : selectedEntity ? (
                    <div className="space-y-4">
                      <div className={cn('p-4 rounded-lg border', entityColors[selectedEntity.type])}>
                        <h3 className="font-semibold">{selectedEntity.name}</h3>
                        <p className="font-mono text-xs mt-1">{selectedEntity.id}</p>
                        <Badge variant="outline" className="mt-2 capitalize">{selectedEntity.type}</Badge>
                      </div>

                      {selectedEntity.timeStart && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Time</h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {selectedEntity.timeStart} - {selectedEntity.timeEnd || 'ongoing'}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-medium mb-2">Linked Sources</h4>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                          {getLinkedSources(selectedEntity.id).map(sourceId => (
                            <div 
                              key={sourceId}
                              className={cn(
                                'px-2 py-1.5 rounded text-xs font-mono',
                                sourceId.startsWith('MIL-') ? 'bg-military/10 text-military' : 'bg-primary/10 text-primary'
                              )}
                            >
                              {sourceId}
                            </div>
                          ))}
                          {getLinkedSources(selectedEntity.id).length === 0 && (
                            <p className="text-sm text-muted-foreground">No linked sources</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Confidence</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-public-verified"
                              style={{ width: '75%' }}
                            />
                          </div>
                          <span className="text-sm font-medium">75%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">Click a node or edge to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
