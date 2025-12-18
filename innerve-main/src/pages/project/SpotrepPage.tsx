import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Clock, Download, Copy, Loader2, ChevronDown, ExternalLink, CheckCircle } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDateTime, formatRelative } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SpotrepVersion } from '@/types';

export default function SpotrepPage() {
  const { projectId } = useParams();
  const { getProject } = useData();
  const { toast } = useToast();
  const project = projectId ? getProject(projectId) : null;

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('SITUATION');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  const versions = project.spotrepVersions;
  const currentVersion = selectedVersion 
    ? versions.find(v => v.id === selectedVersion) 
    : versions[versions.length - 1];

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    toast({
      title: "SPOTREP Generated",
      description: "New version created successfully.",
    });
  };

  const handleCopy = () => {
    if (!currentVersion) return;
    const text = Object.entries(currentVersion.sections)
      .map(([key, value]) => `${key}:\n${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "SPOTREP content has been copied.",
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Export initiated",
      description: "PDF download would start in production.",
    });
  };

  const sectionLabels: Record<string, string> = {
    SITUATION: 'Situation',
    LOCATION: 'Location (AOI)',
    TIME_WINDOW: 'Time Window',
    FRIENDLY_FORCES: 'Friendly Forces',
    OBSERVED_ACTIVITY: 'Observed Activity',
    CIVILIAN_SIGNALS: 'Civilian Signals',
    CONFLICTS_UNCERTAINTIES: 'Conflicts / Uncertainties',
    CONFIDENCE_SUMMARY: 'Confidence Summary',
    SOURCES: 'Sources',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            SPOTREP Generator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and manage situation reports</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!currentVersion}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!currentVersion}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate New SPOTREP
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Version Selector */}
        <div className="col-span-1 space-y-4">
          <Card className="command-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Versions ({versions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {versions.map((version, idx) => (
                <button
                  key={version.id}
                  onClick={() => setSelectedVersion(version.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    (selectedVersion === version.id || (!selectedVersion && idx === versions.length - 1))
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-card border-border hover:bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs">{version.id}</span>
                    {idx === versions.length - 1 && (
                      <span className="text-xs px-1.5 py-0.5 bg-public-verified/20 text-public-verified rounded">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatRelative(version.generatedAt)}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{version.timeWindow}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SPOTREP Content */}
        <div className="col-span-2">
          <Card className="command-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {currentVersion?.id || 'No SPOTREP'}
                </CardTitle>
                {currentVersion && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDateTime(currentVersion.generatedAt)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {currentVersion ? (
                <div className="space-y-2">
                  {Object.entries(currentVersion.sections).map(([key, value]) => (
                    <Collapsible 
                      key={key}
                      open={expandedSection === key}
                      onOpenChange={(open) => setExpandedSection(open ? key : null)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className={cn(
                          'flex items-center justify-between p-3 rounded-lg transition-colors',
                          expandedSection === key ? 'bg-primary/10' : 'bg-muted hover:bg-muted/80'
                        )}>
                          <span className="font-medium text-sm">{sectionLabels[key] || key}</span>
                          <ChevronDown className={cn(
                            'h-4 w-4 transition-transform',
                            expandedSection === key && 'rotate-180'
                          )} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div 
                          className={cn(
                            'p-4 bg-card border border-border rounded-b-lg -mt-1 cursor-pointer',
                            selectedLine === key && 'ring-2 ring-primary'
                          )}
                          onClick={() => setSelectedLine(key)}
                        >
                          {key === 'SOURCES' && Array.isArray(value) ? (
                            <div className="flex flex-wrap gap-2">
                              {value.map((source: string) => (
                                <span 
                                  key={source}
                                  className={cn(
                                    'font-mono text-xs px-2 py-1 rounded',
                                    source.startsWith('MIL-') ? 'bg-military/10 text-military' : 'bg-primary/10 text-primary'
                                  )}
                                >
                                  {source}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-foreground whitespace-pre-wrap">{value as string}</p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No SPOTREP generated yet</p>
                  <Button onClick={handleGenerate} className="mt-4">
                    Generate First SPOTREP
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Source Trace */}
        <div className="col-span-1">
          <Card className="command-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Source Trace</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLine && currentVersion ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Selected Section</h4>
                    <p className="text-xs text-muted-foreground">{sectionLabels[selectedLine]}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Supporting Sources</h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
                      {currentVersion.sections.SOURCES.map((sourceId: string) => {
                        const milReport = project.militaryReports.find(r => r.id === sourceId);
                        const pubItem = project.publicItems.find(i => i.id === sourceId);
                        const item = milReport || pubItem;
                        
                        if (!item) return null;
                        
                        return (
                          <div 
                            key={sourceId}
                            className={cn(
                              'p-3 rounded-lg border',
                              milReport ? 'bg-military/5 border-military/20' : 'bg-card border-border'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn(
                                'text-xs px-1.5 py-0.5 rounded font-medium',
                                milReport ? 'bg-military/20 text-military' : 'bg-primary/20 text-primary'
                              )}>
                                {milReport ? 'MIL' : 'PUB'}
                              </span>
                              <span className="font-mono text-xs">{sourceId}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {'text' in item ? item.text : ''}
                            </p>
                            {milReport && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Unit: {milReport.unit}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Click a section to view supporting sources
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
