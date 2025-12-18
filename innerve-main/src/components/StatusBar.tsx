import { Shield, Activity, CheckCircle2, Clock } from 'lucide-react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export function StatusBar() {
  const { syncState } = useSyncStatus();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-10 bg-card border-b border-border flex items-center justify-between px-4 text-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">ClearBrief</span>
        </div>
        
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${syncState.ingestionStatus === 'Active' ? 'bg-public-verified pulse-live' : 'bg-muted'}`} />
            <span className="text-xs">Ingestion Engine: <span className="text-foreground">{syncState.ingestionStatus}</span></span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Activity className={`h-3 w-3 ${syncState.verificationStatus === 'Running' ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-xs">Verification Engine: <span className="text-foreground">{syncState.verificationStatus}</span></span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span className="text-xs font-mono">Last Sync: <span className="text-foreground">{syncState.secondsAgo}s ago</span></span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-warning font-medium">DEMO MODE</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
