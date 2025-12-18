import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('analyst@clearbrief.gov');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast({
      title: "Demo mode: authentication bypassed",
      description: "Welcome to ClearBrief. All features are accessible.",
    });
    
    navigate('/projects');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-background to-accent/5 flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">ClearBrief</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Unified Crisis Intelligence and Investigation Platform
          </p>
          <div className="space-y-4 text-left bg-card/50 rounded-lg p-6 border border-border">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-public-verified mt-2" />
              <p className="text-sm text-muted-foreground">Source-aware crisis intelligence</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">Evidence-first investigation</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-accent mt-2" />
              <p className="text-sm text-muted-foreground">Military + OSINT fusion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ClearBrief</span>
          </div>

          <div className="command-card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Sign in</h2>
              <p className="text-muted-foreground text-sm mt-1">Access the intelligence platform</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@clearbrief.gov"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6 p-3 bg-warning/10 border border-warning/30 rounded-md">
              <p className="text-xs text-warning text-center font-medium">
                DEMO MODE: Click "Sign in" to access all features
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
