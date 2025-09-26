import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  MessageSquare, 
  Lightbulb, 
  RefreshCw, 
  Palette, 
  Users, 
  MapPin, 
  Clock,
  BookOpen,
  PenTool,
  Zap,
  Target,
  X
} from 'lucide-react';
import { AITool } from '@/types';

interface AdvancedAIAssistantProps {
  onClose: () => void;
  selectedText?: string;
  currentContext?: {
    characters: string[];
    settings: string[];
    genre: string;
    currentScene?: string;
  };
}

export const AdvancedAIAssistant = ({ onClose, selectedText, currentContext }: AdvancedAIAssistantProps) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('brainstorming');

  const aiTools: AITool[] = [
    // Brainstorming Tools
    {
      id: 'plot-ideas',
      name: 'Plot Ideas',
      description: 'Generate fresh plot twists and story directions',
      category: 'brainstorming',
      icon: 'lightbulb',
      prompt: 'Generate 5 creative plot ideas for my story'
    },
    {
      id: 'what-if',
      name: 'What If Generator',
      description: 'Explore alternate scenarios and possibilities',
      category: 'brainstorming',
      icon: 'zap',
      prompt: 'What if scenarios to explore new story directions'
    },
    {
      id: 'character-ideas',
      name: 'Character Development',
      description: 'Develop character backgrounds and motivations',
      category: 'brainstorming',
      icon: 'users',
      prompt: 'Help me develop this character further'
    },
    {
      id: 'world-building',
      name: 'World Building',
      description: 'Expand your story world and settings',
      category: 'brainstorming',
      icon: 'map-pin',
      prompt: 'Help me develop the world and settings'
    },

    // Rewriting Tools
    {
      id: 'rewrite-style',
      name: 'Style Rewrite',
      description: 'Adjust tone, voice, and writing style',
      category: 'rewriting',
      icon: 'pen-tool',
      prompt: 'Rewrite this passage in a different style'
    },
    {
      id: 'expand-text',
      name: 'Expand Scene',
      description: 'Add depth and detail to scenes',
      category: 'rewriting',
      icon: 'refresh-cw',
      prompt: 'Expand and add more detail to this scene'
    },
    {
      id: 'tighten-prose',
      name: 'Tighten Prose',
      description: 'Make writing more concise and impactful',
      category: 'rewriting',
      icon: 'target',
      prompt: 'Make this passage more concise and impactful'
    },

    // Dialogue Tools
    {
      id: 'dialogue-natural',
      name: 'Natural Dialogue',
      description: 'Make conversations more authentic',
      category: 'dialogue',
      icon: 'message-square',
      prompt: 'Make this dialogue more natural and authentic'
    },
    {
      id: 'dialogue-subtext',
      name: 'Add Subtext',
      description: 'Layer meaning beneath conversations',
      category: 'dialogue',
      icon: 'book-open',
      prompt: 'Add subtext and hidden meaning to this dialogue'
    },

    // Description Tools
    {
      id: 'sensory-details',
      name: 'Sensory Details',
      description: 'Enhance descriptions with sensory elements',
      category: 'description',
      icon: 'palette',
      prompt: 'Add rich sensory details to this description'
    },
    {
      id: 'atmosphere',
      name: 'Atmosphere',
      description: 'Create mood and atmosphere',
      category: 'description',
      icon: 'clock',
      prompt: 'Enhance the atmosphere and mood of this scene'
    },

    // Structure Tools
    {
      id: 'scene-structure',
      name: 'Scene Structure',
      description: 'Analyze and improve scene construction',
      category: 'structure',
      icon: 'target',
      prompt: 'Analyze and improve the structure of this scene'
    },
    {
      id: 'pacing',
      name: 'Pacing Analysis',
      description: 'Optimize story pacing and flow',
      category: 'structure',
      icon: 'clock',
      prompt: 'Analyze and improve the pacing of this section'
    }
  ];

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      'lightbulb': Lightbulb,
      'zap': Zap,
      'users': Users,
      'map-pin': MapPin,
      'pen-tool': PenTool,
      'refresh-cw': RefreshCw,
      'target': Target,
      'message-square': MessageSquare,
      'book-open': BookOpen,
      'palette': Palette,
      'clock': Clock,
    };
    return icons[iconName] || Sparkles;
  };

  const categorizedTools = aiTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, AITool[]>);

  const handleToolClick = async (tool: AITool) => {
    setIsProcessing(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
  };

  const handleCustomPrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPrompt('');
    setIsProcessing(false);
  };

  const ToolGrid = ({ tools }: { tools: AITool[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {tools.map((tool) => {
        const Icon = getIcon(tool.icon);
        return (
          <Card
            key={tool.id}
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => handleToolClick(tool)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm">{tool.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {tool.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="w-80 bg-background border-l border-border flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Writing Assistant</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {selectedText && (
        <div className="p-4 bg-accent/20 border-b border-border">
          <div className="text-xs font-medium mb-1">Selected Text:</div>
          <div className="text-xs text-muted-foreground bg-background p-2 rounded border max-h-20 overflow-y-auto">
            {selectedText}
          </div>
        </div>
      )}

      {currentContext && (
        <div className="p-4 border-b border-border">
          <div className="text-xs font-medium mb-2">Current Context:</div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">{currentContext.genre}</Badge>
            {currentContext.characters.slice(0, 2).map(char => (
              <Badge key={char} variant="outline" className="text-xs">{char}</Badge>
            ))}
            {currentContext.characters.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{currentContext.characters.length - 2} more
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 p-4">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="brainstorming" className="text-xs">Ideas</TabsTrigger>
            <TabsTrigger value="rewriting" className="text-xs">Rewrite</TabsTrigger>
            <TabsTrigger value="dialogue" className="text-xs">Dialogue</TabsTrigger>
            <TabsTrigger value="description" className="text-xs">Describe</TabsTrigger>
            <TabsTrigger value="structure" className="text-xs">Structure</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-96">
            {Object.entries(categorizedTools).map(([category, tools]) => (
              <TabsContent key={category} value={category} className="mt-0">
                <ToolGrid tools={tools} />
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        <div className="mt-4 space-y-3">
          <div className="text-sm font-medium">Custom Request</div>
          <Textarea
            placeholder="Ask the AI anything about your writing..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <Button 
            onClick={handleCustomPrompt}
            disabled={!prompt.trim() || isProcessing}
            className="w-full"
            size="sm"
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
      </div>
    </div>
  );
};