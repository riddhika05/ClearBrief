import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Search, Globe, FileText, Clock, MapPin, Loader2, CheckCircle, Plus } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { formatTimestamp, formatRelative } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const samplePatrolLog = `07:45Z. Patrol ALPHA-3 reports all clear along Route Delta. No unusual activity observed. Local civilians cooperative. Weather: clear, visibility good. Equipment status: nominal.`;

export default function IngestPage() {
  const { projectId } = useParams();
  const { getProject } = useData();
  const { toast } = useToast();
  const project = projectId ? getProject(projectId) : null;

  const [activeTab, setActiveTab] = useState('military');
  const [militaryText, setMilitaryText] = useState('');
  const [uploadedReports, setUploadedReports] = useState<string[]>([]);
  
  // Public ingestion state
  const [keywords, setKeywords] = useState(project?.ingestionConfig.keywords.join(', ') || '');
  const [location, setLocation] = useState(project?.ingestionConfig.locationHint || '');
  const [radius, setRadius] = useState(String(project?.ingestionConfig.radiusKm || 15));
  const [sources, setSources] = useState({
    social: true,
    news: true,
    alerts: false,
  });
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestProgress, setIngestProgress] = useState(0);
  const [ingestComplete, setIngestComplete] = useState(false);
  const [ingestSummary, setIngestSummary] = useState<{ count: number; sources: string[]; duplicates: number } | null>(null);

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  const handleAddMilitaryReport = () => {
    if (!militaryText.trim()) return;
    setUploadedReports(prev => [...prev, militaryText]);
    setMilitaryText('');
    toast({
      title: "Report added",
      description: "Military report has been added to the queue.",
    });
  };

  const handleAddSample = () => {
    setMilitaryText(samplePatrolLog);
  };

  const handleSimulateFetch = async () => {
    setIsIngesting(true);
    setIngestProgress(0);
    setIngestComplete(false);
    setIngestSummary(null);

    // Simulate progress
    const duration = 1200 + Math.random() * 2300; // 1.2-3.5s
    const steps = 20;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      setIngestProgress(Math.min(100, (i / steps) * 100));
    }

    setIsIngesting(false);
    setIngestComplete(true);
    setIngestSummary({
      count: 3 + Math.floor(Math.random() * 5),
      sources: sources.social && sources.news ? ['Social Media', 'News Outlets'] : 
               sources.social ? ['Social Media'] : ['News Outlets'],
      duplicates: Math.floor(Math.random() * 3),
    });

    toast({
      title: "Ingestion complete",
      description: "New public items have been added to the project.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Ingestion</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload military reports and ingest public OSINT data</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="military" className="gap-2">
            <FileText className="h-4 w-4" />
            Military Upload
          </TabsTrigger>
          <TabsTrigger value="public" className="gap-2">
            <Globe className="h-4 w-4" />
            Public/OSINT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="military" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="command-card">
              <CardHeader>
                <CardTitle className="text-lg">Add Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">Paste patrol log or field note below</p>
                  <Button variant="outline" size="sm" onClick={handleAddSample}>
                    Add Sample Patrol Log
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Report Content</Label>
                  <Textarea
                    value={militaryText}
                    onChange={(e) => setMilitaryText(e.target.value)}
                    placeholder="Paste or type military report content..."
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>

                <Button onClick={handleAddMilitaryReport} disabled={!militaryText.trim()} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Report
                </Button>
              </CardContent>
            </Card>

            <Card className="command-card">
              <CardHeader>
                <CardTitle className="text-lg">Uploaded Reports ({project.militaryReports.length + uploadedReports.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                {uploadedReports.map((report, idx) => (
                  <div key={`new-${idx}`} className="p-3 bg-military/5 border border-military/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge-military">NEW</span>
                      <span className="font-mono text-xs text-muted-foreground">Pending verification</span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{report}</p>
                  </div>
                ))}
                {project.militaryReports.slice(0, 5).map(report => (
                  <div key={report.id} className="p-3 bg-card border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="badge-military">MIL</span>
                        <span className="font-mono text-xs">{report.id}</span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{formatTimestamp(report.reportedAt)}</span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{report.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Unit: {report.unit}</span>
                      <span>{report.location.name}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="command-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <Input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., shelling, evacuation, emergency"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Location
                    </Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location hint"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Radius (km)</Label>
                    <Input
                      type="number"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      placeholder="15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Using project time window</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Sources</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="social" 
                        checked={sources.social}
                        onCheckedChange={(checked) => setSources(s => ({ ...s, social: !!checked }))}
                      />
                      <label htmlFor="social" className="text-sm">Social posts (X, Instagram)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="news" 
                        checked={sources.news}
                        onCheckedChange={(checked) => setSources(s => ({ ...s, news: !!checked }))}
                      />
                      <label htmlFor="news" className="text-sm">News articles</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="alerts" 
                        checked={sources.alerts}
                        onCheckedChange={(checked) => setSources(s => ({ ...s, alerts: !!checked }))}
                      />
                      <label htmlFor="alerts" className="text-sm">Emergency alerts</label>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSimulateFetch} 
                  disabled={isIngesting || (!sources.social && !sources.news && !sources.alerts)}
                  className="w-full gap-2"
                >
                  {isIngesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      Simulate Fetch
                    </>
                  )}
                </Button>

                {isIngesting && (
                  <div className="space-y-2">
                    <Progress value={ingestProgress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {Math.round(ingestProgress)}% - Scanning sources...
                    </p>
                  </div>
                )}

                {ingestComplete && ingestSummary && (
                  <div className="p-4 bg-public-verified/10 border border-public-verified/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-public-verified" />
                      <span className="font-medium text-public-verified">Ingestion Complete</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Items found:</span> <span className="font-medium">{ingestSummary.count}</span></p>
                      <p><span className="text-muted-foreground">Sources:</span> <span className="font-medium">{ingestSummary.sources.join(', ')}</span></p>
                      <p><span className="text-muted-foreground">Duplicates removed:</span> <span className="font-medium">{ingestSummary.duplicates}</span></p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="command-card">
              <CardHeader>
                <CardTitle className="text-lg">Ingested Public Items ({project.publicItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                {project.publicItems.slice(0, 8).map(item => {
                  const verification = project.verificationResults.find(v => v.itemId === item.id);
                  return (
                    <div key={item.id} className="p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-secondary rounded text-secondary-foreground">
                            {item.sourceType.toUpperCase()}
                          </span>
                          <span className="font-mono text-xs">{item.id}</span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{formatTimestamp(item.postedAt)}</span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {item.headline || item.text}
                      </p>
                      {item.claimedLocationText && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.claimedLocationText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
