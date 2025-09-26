import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  ChevronUp, 
  ChevronDown, 
  Bot, 
  User, 
  Plus,
  RotateCcw,
  Copy,
  Sparkles,
  PenTool,
  FileText
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIEditorChatProps {
  selectedText?: string;
  onInsertContent: (content: string, insertType: 'cursor' | 'replace' | 'append') => void;
  documentTitle?: string;
  currentContent?: string;
}

export const AIEditorChat = ({ 
  selectedText, 
  onInsertContent,
  documentTitle,
  currentContent 
}: AIEditorChatProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock AI responses with realistic delays
  const generateAIResponse = async (userPrompt: string): Promise<ChatMessage> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = [
      {
        content: `Here's a dramatic scene based on your request:\n\n"The rain hammered against the windows as Sarah finally confronted her nemesis. Lightning illuminated the abandoned warehouse, casting eerie shadows across the concrete floor. 'You thought you could run forever,' Marcus sneered, his voice echoing in the empty space. Sarah's hand tightened around the evidence that would expose his crimes. 'This ends tonight,' she whispered, stepping into the light."`,
        suggestions: ['Continue this scene', 'Add more dialogue', 'Describe the setting in more detail']
      },
      {
        content: `I've crafted a compelling opening paragraph:\n\n"The letter arrived on a Tuesday, unremarkable in every way except for the black wax seal that bore no family crest, no identifying mark—just a smooth, obsidian surface that seemed to absorb the morning light. Elena had been expecting many things that day: the grocery delivery, her mother's weekly call, perhaps even news about the job interview from last week. But she had not expected her entire world to shift on its axis the moment she broke that seal."`,
        suggestions: ['Write the next paragraph', 'Develop Elena\'s character', 'Explore what was in the letter']
      },
      {
        content: `Here's an enhanced version of your selected text with improved pacing and emotional depth:\n\n"The silence stretched between them like a chasm, filled with all the words they'd never spoken and all the chances they'd let slip away. He wanted to reach out, to bridge that impossible distance, but his hands remained frozen at his sides—trembling monuments to his own cowardice."`,
        suggestions: ['Continue the emotional tension', 'Add internal monologue', 'Introduce a plot twist']
      }
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      id: Date.now().toString() + Math.random(),
      type: 'ai',
      content: randomResponse.content,
      timestamp: new Date(),
      suggestions: randomResponse.suggestions
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      const aiResponse = await generateAIResponse(inputValue);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const quickPrompts = [
    { text: 'Continue writing', icon: PenTool },
    { text: 'Write a dialogue scene', icon: Bot },
    { text: 'Describe the setting', icon: FileText },
    { text: 'Add character development', icon: User }
  ];

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 border-t border-l-0 border-r-0 border-b-0 rounded-none bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <CardHeader className="p-3 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">AI Writing Assistant</span>
            {selectedText && (
              <Badge variant="secondary" className="text-xs">
                Text selected
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {/* Chat Content */}
      {isExpanded && (
        <CardContent className="p-0">
          {/* Messages */}
          <ScrollArea className="h-80 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start a conversation to get AI writing assistance</p>
                <p className="text-xs mt-1">Try asking me to write a scene, continue your story, or improve selected text</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-primary' : 'bg-muted'}`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={`flex-1 space-y-2 ${message.type === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-3 rounded-lg max-w-[85%] ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground ml-auto' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      {/* AI message actions */}
                      {message.type === 'ai' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onInsertContent(message.content, 'cursor')}
                              className="h-7 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Insert at cursor
                            </Button>
                            {selectedText && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onInsertContent(message.content, 'replace')}
                                className="h-7 text-xs"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Replace selected
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onInsertContent(message.content, 'append')}
                              className="h-7 text-xs"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Append
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(message.content)}
                              className="h-7 text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          
                          {/* Suggestions */}
                          {message.suggestions && (
                            <div className="flex flex-wrap gap-1">
                              {message.suggestions.map((suggestion, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setInputValue(suggestion)}
                                  className="h-6 text-xs"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4 text-muted-foreground animate-pulse" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <Separator />

          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="p-4 border-b">
              <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(prompt.text)}
                    className="h-7 text-xs"
                  >
                    <prompt.icon className="h-3 w-3 mr-1" />
                    {prompt.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={selectedText ? "Ask me to improve the selected text..." : "Ask me to write something..."}
                className="flex-1"
                disabled={isGenerating}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || isGenerating}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedText ? `Selected: "${selectedText.slice(0, 50)}${selectedText.length > 50 ? '...' : ''}"` : 
               documentTitle ? `Working on: ${documentTitle}` : 'Type your request and press Enter'}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};