import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Moon, Sun, Shield, RotateCcw, Sliders, ChevronLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { StatusBar } from '@/components/StatusBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { data } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [reliabilityDefaults, setReliabilityDefaults] = useState({
    official_gov: 80,
    major_news: 70,
    local_news: 55,
    verified_reporter: 50,
    known_user: 35,
    unknown_user: 20,
  });

  const handleReset = () => {
    toast({
      title: "Demo data reset",
      description: "All data has been reset to initial state.",
    });
  };

  const reliabilityLabels: Record<string, string> = {
    official_gov: 'Official Government',
    major_news: 'Major News Outlets',
    local_news: 'Local News',
    verified_reporter: 'Verified Reporters',
    known_user: 'Known Users',
    unknown_user: 'Unknown Users',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StatusBar />
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Configure platform preferences</p>
        </div>

        <div className="space-y-6">
          {/* Demo Mode Banner */}
          <Card className="command-card border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-warning" />
                <div>
                  <h3 className="font-semibold text-foreground">Demo Mode Active</h3>
                  <p className="text-sm text-muted-foreground">
                    Authentication is bypassed. All data is simulated and resets on refresh.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Toggle */}
          <Card className="command-card">
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Customize the visual theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'dark' ? 'Dark mode (Command Center)' : 'Light mode'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardContent>
          </Card>

          {/* Source Reliability Defaults */}
          <Card className="command-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Source Reliability Defaults
              </CardTitle>
              <CardDescription>
                Set default confidence levels for different source types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(reliabilityDefaults).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{reliabilityLabels[key]}</Label>
                    <span className="font-mono text-sm text-primary">{value}%</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([v]) => setReliabilityDefaults(prev => ({ ...prev, [key]: v }))}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="command-card">
            <CardHeader>
              <CardTitle className="text-lg">Data Management</CardTitle>
              <CardDescription>Manage demo data and project state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Reset Demo Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Restore all projects and data to initial demo state
                  </p>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="command-card">
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Application</span>
                  <p className="font-medium">{data.appName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mode</span>
                  <p className="font-medium">{data.demoMode ? 'Demo' : 'Production'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Projects</span>
                  <p className="font-medium">{data.projects.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Version</span>
                  <p className="font-medium font-mono">1.0.0-demo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
