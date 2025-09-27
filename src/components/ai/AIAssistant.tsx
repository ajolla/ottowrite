import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { X, Sparkles, RefreshCw, Lightbulb, PenTool } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

interface AIAssistantProps {
  onClose: () => void;
  selectedText?: string;
  onInsertText?: (text: string) => void;
}

export const AIAssistant = ({ onClose, selectedText = '', onInsertText }: AIAssistantProps) => {
  const [prompt, setPrompt] = useState('');
  const {
    isProcessing,
    continueWriting,
    rewriteText,
    brainstormIdeas,
    customRequest
  } = useAI();

  const aiTools = [
    {
      id: 'continue',
      name: 'Continue Writing',
      description: 'AI continues your story naturally',
      icon: PenTool,
      action: () => handleContinueWriting(),
    },
    {
      id: 'rewrite',
      name: 'Rewrite',
      description: 'Improve selected text',
      icon: RefreshCw,
      action: () => handleRewrite(),
    },
    {
      id: 'brainstorm',
      name: 'Brainstorm',
      description: 'Generate creative ideas',
      icon: Lightbulb,
      action: () => handleBrainstorm(),
    },
  ];

  const handleContinueWriting = async () => {
    if (!selectedText) {
      toast.error('Please select some text to continue from');
      return;
    }

    const response = await continueWriting(selectedText);
    if (response && onInsertText) {
      onInsertText(response.content);
      toast.success('Content generated successfully!');
    }
  };

  const handleRewrite = async () => {
    if (!selectedText) {
      toast.error('Please select some text to rewrite');
      return;
    }

    const response = await rewriteText(selectedText);
    if (response && onInsertText) {
      onInsertText(response.content);
      toast.success('Text rewritten successfully!');
    }
  };

  const handleBrainstorm = async () => {
    const topic = selectedText || 'story ideas';
    const response = await brainstormIdeas(topic);
    if (response && onInsertText) {
      onInsertText(response.content);
      toast.success('Ideas generated successfully!');
    }
  };

  const handleCustomPrompt = async () => {
    if (!prompt.trim()) return;

    const response = await customRequest(prompt);
    if (response && onInsertText) {
      onInsertText(response.content);
      toast.success('Response generated successfully!');
      setPrompt('');
    }
  };

  return (
    <div className="w-80 border-l border-border-subtle bg-surface flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Tools */}
      <div className="p-4 space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Quick Actions
        </h4>
        
        {aiTools.map((tool) => (
          <Card key={tool.id} className="p-3 hover:bg-accent cursor-pointer transition-colors">
            <Button
              variant="ghost"
              className="w-full justify-start p-0 h-auto"
              onClick={tool.action}
            >
              <tool.icon className="h-4 w-4 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">{tool.name}</div>
                <div className="text-xs text-muted-foreground">{tool.description}</div>
              </div>
            </Button>
          </Card>
        ))}
      </div>

      {/* Custom Prompt */}
      <div className="p-4 border-t border-border-subtle">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Custom Request
        </h4>
        
        <Textarea
          placeholder="Ask AI to help with your writing..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-20 mb-3"
        />
        
        <Button 
          onClick={handleCustomPrompt}
          disabled={!prompt.trim() || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Send Request
            </>
          )}
        </Button>
      </div>

      {/* Usage Info */}
      <div className="mt-auto p-4 border-t border-border-subtle">
        <div className="text-xs text-muted-foreground">
          <p className="mb-1">💡 Select text in your document for context-aware suggestions</p>
          <p>✨ AI responses will appear in your editor</p>
        </div>
      </div>
    </div>
  );
};