import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Map, Clock, Filter, Shield, Globe, AlertTriangle, MapPin, ChevronRight } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatTimestamp, formatDate, getLabelBadgeClass, truncate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function TimelineMapPage() {
  const { projectId } = useParams();
  const { getProject, sourceIsolation } = useData();
  const project = projectId ? getProject(projectId) : null;

  const [filter, setFilter] = useState<'all' | 'military' | 'public' | 'verified'>('all');

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  const allEvents = [
    ...project.militaryReports.map(r => ({
      id: r.id,
      type: 'military' as const,
      time: r.reportedAt,
      text: r.text,
      location: r.location,
      unit: r.unit,
    })),
    ...project.publicItems.map(item => {
      const verification = project.verificationResults.find(v => v.itemId === item.id);
      return {
        id: item.id,
        type: 'public' as const,
        time: item.postedAt,
        text: item.headline || item.text,
        location: { name: item.claimedLocationText || 'Unknown' },
        verification,
      };
    }),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const filteredEvents = allEvents.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'military') return e.type === 'military';
    if (filter === 'public') return e.type === 'public';
    if (filter === 'verified') return e.type === 'public' && (e as any).verification?.label === 'Verified';
    return true;
  });

  const locations = project.entities.filter(e => e.type === 'location');

  // Get changes since last SPOTREP
  const lastSpotrep = project.spotrepVersions[project.spotrepVersions.length - 1];
  const lastSpotrepTime = lastSpotrep ? new Date(lastSpotrep.generatedAt) : new Date(0);
  const newEvents = allEvents.filter(e => new Date(e.time) > lastSpotrepTime);
  const newVerified = newEvents.filter(e => e.type === 'public' && (e as any).verification?.label === 'Verified');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Timeline + Map
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Chronological event view with spatial context</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="military">Military Only</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="col-span-2 space-y-4">
          <Card className="command-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Event Timeline ({filteredEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                
                {filteredEvents.map((event, idx) => (
                  <div key={event.id} className="relative flex gap-4 pl-10">
                    {/* Timeline dot */}
                    <div className={cn(
                      'absolute left-2.5 w-3 h-3 rounded-full ring-4 ring-background',
                      event.type === 'military' ? 'bg-military' : 
                      (event as any).verification?.label === 'Verified' ? 'bg-public-verified' :
                      (event as any).verification?.label === 'Suspicious' ? 'bg-public-suspicious' :
                      'bg-public-unverified'
                    )} />
                    
                    <div className={cn(
                      'flex-1 p-4 rounded-lg border',
                      event.type === 'military' ? 'bg-military/5 border-military/20' : 'bg-card border-border'
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {event.type === 'military' ? (
                              <>
                                <Badge className="badge-military">
                                  <Shield className="h-3 w-3 mr-1" />
                                  MILITARY
                                </Badge>
                                {'unit' in event && (
                                  <span className="text-xs text-muted-foreground">{event.unit}</span>
                                )}
                              </>
                            ) : (
                              <>
                                <Badge variant="outline" className="gap-1">
                                  <Globe className="h-3 w-3" />
                                  PUBLIC
                                </Badge>
                                {(event as any).verification && (
                                  <span className={getLabelBadgeClass((event as any).verification.label)}>
                                    {(event as any).verification.label}
                                  </span>
                                )}
                              </>
                            )}
                            <span className="font-mono text-xs text-muted-foreground">{event.id}</span>
                          </div>
                          
                          <p className="text-sm text-foreground">{truncate(event.text, 200)}</p>
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location.name}
                            </span>
                            {'grid' in event.location && event.location.grid && (
                              <span className="font-mono">{event.location.grid}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-mono text-xs text-muted-foreground">{formatTimestamp(event.time)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(event.time)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map + Changes */}
        <div className="space-y-4">
          {/* Map Placeholder */}
          <Card className="command-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Area of Interest</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[250px] bg-muted rounded-lg overflow-hidden">
                {/* Grid pattern background */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                
                {/* AOI Box */}
                <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
                  <span className="text-xs text-primary font-medium bg-background px-2 py-1 rounded">
                    {project.region}
                  </span>
                </div>
                
                {/* Location markers */}
                {locations.slice(0, 4).map((loc, idx) => (
                  <div
                    key={loc.id}
                    className="absolute"
                    style={{
                      top: `${20 + (idx * 15) + Math.random() * 20}%`,
                      left: `${25 + (idx * 12) + Math.random() * 20}%`,
                    }}
                  >
                    <div className="relative group">
                      <MapPin className="h-5 w-5 text-primary drop-shadow-md" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {loc.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{locations.length} locations mapped</span>
                <span className="font-mono">{project.region}</span>
              </div>
            </CardContent>
          </Card>

          {/* Changes since last SPOTREP */}
          <Card className="command-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Changes Since Last SPOTREP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastSpotrep ? (
                <>
                  <div className="text-xs text-muted-foreground">
                    Last SPOTREP: <span className="font-mono">{formatTimestamp(lastSpotrep.generatedAt)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">New Events</span>
                      <span className="font-bold text-primary">{newEvents.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">Newly Verified</span>
                      <span className="font-bold text-public-verified">{newVerified.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">Active Conflicts</span>
                      <span className="font-bold text-warning">
                        {project.conflicts.filter(c => c.status === 'Open').length}
                      </span>
                    </div>
                  </div>
                  
                  {newEvents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">New Event IDs</h4>
                      <div className="flex flex-wrap gap-1">
                        {newEvents.slice(0, 6).map(e => (
                          <span key={e.id} className="font-mono text-xs px-2 py-1 bg-secondary rounded">
                            {e.id}
                          </span>
                        ))}
                        {newEvents.length > 6 && (
                          <span className="text-xs text-muted-foreground">+{newEvents.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No SPOTREP generated yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
