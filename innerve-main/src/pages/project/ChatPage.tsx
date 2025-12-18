import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Send, Loader2, Shield, AlertCircle, ExternalLink } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { truncate } from '@/lib/formatters';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  timestamp: Date;
}

export default function ChatPage() {
  const { projectId } = useParams();
  const { getProject } = useData();
  const project = projectId ? getProject(projectId) : null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  const getSourceDetails = (sourceId: string) => {
    const milReport = project.militaryReports.find(r => r.id === sourceId);
    if (milReport) {
      const verification = { finalConfidence: milReport.confidence };
      return { type: 'military', item: milReport, verification };
    }
    
    const pubItem = project.publicItems.find(i => i.id === sourceId);
    if (pubItem) {
      const verification = project.verificationResults.find(v => v.itemId === sourceId);
      return { type: 'public', item: pubItem, verification };
    }
    
    return null;
  };

  const generateResponse = (query: string): { answer: string; citations: string[] } => {
    // Check predefined Q&A pairs
    const qaPair = project.chat.qaPairs.find(qa => 
      query.toLowerCase().includes(qa.q.toLowerCase().slice(0, 20))
    );
    
    if (qaPair) {
      return { answer: qaPair.a, citations: qaPair.citations };
    }
    
    // Generate contextual responses based on query keywords
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('conflict') || lowerQuery.includes('unresolved')) {
      const conflicts = project.conflicts.filter(c => c.status === 'Open');
      const citations = conflicts.flatMap(c => c.items.slice(0, 2));
      return {
        answer: `There are ${conflicts.length} active conflicts in this project:\n\n${conflicts.map(c => `• ${c.summary}`).join('\n')}\n\nThese require attention and cross-verification with primary sources.`,
        citations: citations.slice(0, 4),
      };
    }
    
    if (lowerQuery.includes('verified') || lowerQuery.includes('civilian') || lowerQuery.includes('public')) {
      const verified = project.verificationResults.filter(v => v.label === 'Verified');
      const citations = verified.slice(0, 3).map(v => v.itemId);
      return {
        answer: `${verified.length} public items have been verified in this project. These sources have passed reliability, relevance, geo-consistency, and cross-confirmation checks. Verified civilian signals provide corroborating context but should be weighted against military reports.`,
        citations,
      };
    }
    
    if (lowerQuery.includes('spotrep') || lowerQuery.includes('update') || lowerQuery.includes('change')) {
      const latestSpotrep = project.spotrepVersions[project.spotrepVersions.length - 1];
      if (latestSpotrep) {
        return {
          answer: `The latest SPOTREP (${latestSpotrep.id}) was generated covering ${latestSpotrep.timeWindow}.\n\nKey findings:\n• ${latestSpotrep.sections.SITUATION}\n• Confidence: ${latestSpotrep.sections.CONFIDENCE_SUMMARY}`,
          citations: latestSpotrep.sections.SOURCES.slice(0, 4),
        };
      }
    }
    
    // Default response
    return {
      answer: "I can help you analyze this project's intelligence data. I have access to military reports, public items, verification results, and knowledge graph data. Please ask specific questions about events, conflicts, verified sources, or request a summary.",
      citations: [project.militaryReports[0]?.id, project.publicItems[0]?.id].filter(Boolean) as string[],
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Simulate response delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const { answer, citations } = generateResponse(input);
    
    const assistantMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: answer,
      citations,
      timestamp: new Date(),
    };
    
    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            ClearBrief Investigation Assistant
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Grounded Q&A with source citations</p>
        </div>
      </div>

      {/* Rules Banner */}
      <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/30 rounded-lg mb-4">
        <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
        <div className="text-sm">
          <span className="font-medium text-warning">Hard Rules:</span>
          <span className="text-muted-foreground ml-2">
            Answers use only project knowledge + cited sources. No speculation.
          </span>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat Area */}
        <Card className="command-card flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ask questions about this project's intelligence data</p>
                </div>
              )}
              
              {messages.map(message => (
                <div 
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    'max-w-[80%] rounded-lg p-4',
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.citations && message.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                        {message.citations.map(citation => (
                          <button
                            key={citation}
                            onClick={() => setSelectedCitation(citation)}
                            className={cn(
                              'font-mono text-xs px-2 py-1 rounded transition-colors',
                              citation.startsWith('MIL-')
                                ? 'bg-military/20 text-military hover:bg-military/30'
                                : 'bg-primary/20 text-primary hover:bg-primary/30'
                            )}
                          >
                            [{citation}]
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="typing-indicator flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about this project's intelligence..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Suggested Prompts */}
        <Card className="command-card w-72">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Suggested Prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.chat.suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedPrompt(prompt)}
                className="w-full text-left p-3 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                {prompt}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Citation Modal */}
      <Dialog open={!!selectedCitation} onOpenChange={() => setSelectedCitation(null)}>
        <DialogContent className="max-w-lg">
          {selectedCitation && (() => {
            const source = getSourceDetails(selectedCitation);
            if (!source) return <p>Source not found</p>;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded font-medium',
                      source.type === 'military' ? 'bg-military/20 text-military' : 'bg-primary/20 text-primary'
                    )}>
                      {source.type === 'military' ? 'MILITARY' : 'PUBLIC'}
                    </span>
                    <span className="font-mono text-sm">{selectedCitation}</span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Content</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {'text' in source.item ? source.item.text : ''}
                    </p>
                  </div>
                  
                  {source.type === 'military' && 'unit' in source.item && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Unit</h4>
                        <p className="text-sm text-muted-foreground">{source.item.unit}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Location</h4>
                        <p className="text-sm text-muted-foreground">{source.item.location.name}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <span className="text-lg font-bold text-public-verified">
                      {Math.round((source.verification?.finalConfidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
