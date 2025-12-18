import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, XCircle, Filter, ChevronRight, Activity, BarChart3 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatTimestamp, getLabelBadgeClass, getConfidenceColor, truncate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { VerificationResult, PublicItem } from '@/types';

const pipelineSteps = [
  { id: 'reliability', name: 'Source Reliability', icon: Activity },
  { id: 'relevance', name: 'Relevance Match', icon: Filter },
  { id: 'geo', name: 'Geo Consistency', icon: CheckCircle },
  { id: 'confirm', name: 'Cross-confirmation', icon: BarChart3 },
  { id: 'label', name: 'Label + Confidence', icon: CheckCircle },
];

export default function VerificationPage() {
  const { projectId } = useParams();
  const { getProject } = useData();
  const project = projectId ? getProject(projectId) : null;

  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ item: PublicItem; verification: VerificationResult } | null>(null);
  const [currentStep, setCurrentStep] = useState(4);

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  const getItemWithVerification = () => {
    return project.publicItems.map(item => ({
      item,
      verification: project.verificationResults.find(v => v.itemId === item.id),
    })).filter(({ verification }) => {
      if (!verification) return false;
      if (showVerifiedOnly && verification.label !== 'Verified') return false;
      return true;
    });
  };

  const items = getItemWithVerification();

  const confidenceDistribution = {
    high: items.filter(i => i.verification && i.verification.finalConfidence >= 0.7).length,
    medium: items.filter(i => i.verification && i.verification.finalConfidence >= 0.4 && i.verification.finalConfidence < 0.7).length,
    low: items.filter(i => i.verification && i.verification.finalConfidence < 0.4).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verification Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Assess credibility and confidence of public sources</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="verified-only" className="text-sm">Show Verified Only</Label>
          <Switch
            id="verified-only"
            checked={showVerifiedOnly}
            onCheckedChange={setShowVerifiedOnly}
          />
        </div>
      </div>

      {/* Pipeline Stepper */}
      <Card className="command-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {pipelineSteps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  idx <= currentStep ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <step.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-6">
        {/* Main Table */}
        <div className="col-span-3">
          <Card className="command-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Public Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">ID</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Snippet</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Source</th>
                      <th className="text-left py-3 px-2 text-muted-foreground font-medium">Location/Time</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium">Cross-Confirm</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium">Confidence</th>
                      <th className="text-center py-3 px-2 text-muted-foreground font-medium">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(({ item, verification }) => (
                      <tr 
                        key={item.id}
                        onClick={() => setSelectedItem({ item, verification: verification! })}
                        className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-2 font-mono text-xs">{item.id}</td>
                        <td className="py-3 px-2 max-w-[200px]">
                          <p className="truncate">{item.headline || truncate(item.text, 50)}</p>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                            {item.sourceType}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="text-xs">
                            <p className="text-foreground">{item.claimedLocationText || '-'}</p>
                            <p className="font-mono text-muted-foreground">{formatTimestamp(item.postedAt)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-medium">{verification?.crossConfirmCount || 0}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16">
                              <Progress 
                                value={(verification?.finalConfidence || 0) * 100} 
                                className="h-1.5"
                              />
                            </div>
                            <span className={cn('text-xs font-mono', getConfidenceColor(verification?.finalConfidence || 0))}>
                              {Math.round((verification?.finalConfidence || 0) * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={getLabelBadgeClass(verification?.label || 'Unverified')}>
                            {verification?.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confidence Distribution */}
        <div className="space-y-4">
          <Card className="command-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Confidence Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-public-verified">High (70%+)</span>
                  <span className="font-medium">{confidenceDistribution.high}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-public-verified transition-all"
                    style={{ width: `${(confidenceDistribution.high / items.length) * 100 || 0}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-public-unverified">Medium (40-70%)</span>
                  <span className="font-medium">{confidenceDistribution.medium}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-public-unverified transition-all"
                    style={{ width: `${(confidenceDistribution.medium / items.length) * 100 || 0}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-public-suspicious">Low (&lt;40%)</span>
                  <span className="font-medium">{confidenceDistribution.low}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-public-suspicious transition-all"
                    style={{ width: `${(confidenceDistribution.low / items.length) * 100 || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="command-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Items</span>
                <span className="font-medium">{project.publicItems.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-public-verified" />
                  Verified
                </span>
                <span className="font-medium text-public-verified">
                  {project.verificationResults.filter(v => v.label === 'Verified').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-public-unverified" />
                  Unverified
                </span>
                <span className="font-medium text-public-unverified">
                  {project.verificationResults.filter(v => v.label === 'Unverified').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-public-suspicious" />
                  Suspicious
                </span>
                <span className="font-medium text-public-suspicious">
                  {project.verificationResults.filter(v => v.label === 'Suspicious').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="w-[500px] sm:w-[540px]">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm">{selectedItem.item.id}</span>
                  <span className={getLabelBadgeClass(selectedItem.verification.label)}>
                    {selectedItem.verification.label}
                  </span>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Content</h4>
                  <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                    {selectedItem.item.headline || selectedItem.item.text}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Source</h4>
                    <p className="text-sm text-muted-foreground">{selectedItem.item.sourceType}</p>
                    {selectedItem.item.platform && (
                      <p className="text-xs text-muted-foreground">{selectedItem.item.platform}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Location</h4>
                    <p className="text-sm text-muted-foreground">{selectedItem.item.claimedLocationText || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Verification Scores</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Relevance</span>
                        <span>{Math.round(selectedItem.verification.relevance * 100)}%</span>
                      </div>
                      <Progress value={selectedItem.verification.relevance * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Source Reliability</span>
                        <span>{Math.round(selectedItem.verification.sourceReliability * 100)}%</span>
                      </div>
                      <Progress value={selectedItem.verification.sourceReliability * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Geo Consistency</span>
                        <span>{Math.round(selectedItem.verification.geoConsistency * 100)}%</span>
                      </div>
                      <Progress value={selectedItem.verification.geoConsistency * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Cross-confirm Count</span>
                        <span>{selectedItem.verification.crossConfirmCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">
                    {selectedItem.verification.label === 'Suspicious' ? 'Why Suspicious' : 'Evidence'}
                  </h4>
                  <ul className="space-y-2">
                    {selectedItem.verification.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className={cn(
                          'mt-1.5 h-1.5 w-1.5 rounded-full',
                          selectedItem.verification.label === 'Suspicious' ? 'bg-public-suspicious' : 'bg-primary'
                        )} />
                        <span className="text-muted-foreground">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Final Confidence</span>
                    <span className={cn('text-2xl font-bold', getConfidenceColor(selectedItem.verification.finalConfidence))}>
                      {Math.round(selectedItem.verification.finalConfidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
