import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  PenTool,
  RefreshCw,
  Lightbulb,
  Users,
  MessageSquare,
  Palette,
  Loader2
} from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

interface AIEditorToolbarProps {
  selectedText: string;
  onInsertText: (text: string) => void;
  currentContext?: {
    characters: string[];
    settings: string[];
    genre: string;
    currentScene?: string;
  };
}

export const AIEditorToolbar = ({
  selectedText,
  onInsertText,
  currentContext
}: AIEditorToolbarProps) => {
  const {
    isProcessing,
    continueWriting,
    rewriteText,
    brainstormIdeas,
    developCharacter,
    generateDialogue,
    describeScene,
  } = useAI();

  const handleContinueWriting = async () => {
    if (!selectedText) {
      toast.error('Please select some text to continue from');
      return;
    }

    const response = await continueWriting(selectedText, currentContext);
    if (response) {
      onInsertText('\n\n' + response.content);
      toast.success(`Generated ${response.tokensUsed} tokens with ${response.provider}`);
    }
  };

  const handleRewrite = async () => {
    if (!selectedText) {
      toast.error('Please select some text to rewrite');
      return;
    }

    const response = await rewriteText(selectedText, undefined, currentContext);
    if (response) {
      // Replace selected text with rewritten version
      onInsertText(response.content);
      toast.success(`Rewritten with ${response.provider}`);
    }
  };

  const handleBrainstorm = async () => {
    const topic = selectedText || 'story ideas for this scene';
    const response = await brainstormIdeas(topic, currentContext);
    if (response) {
      onInsertText('\n\n## Ideas:\n' + response.content);
      toast.success('Ideas generated successfully!');
    }
  };

  const handleCharacterDevelopment = async () => {
    let characterName = '';

    if (selectedText) {
      // Try to extract a character name from selected text
      const words = selectedText.split(' ');
      characterName = words.find(word =>
        currentContext?.characters.some(char =>
          char.toLowerCase().includes(word.toLowerCase())
        )
      ) || selectedText.split(' ')[0];
    } else if (currentContext?.characters.length) {
      characterName = currentContext.characters[0];
    } else {
      toast.error('Please select text with a character name or add characters to your story bible');
      return;
    }

    const response = await developCharacter(characterName, currentContext);
    if (response) {
      onInsertText(`\n\n## Character Development: ${characterName}\n${response.content}`);
      toast.success('Character development generated!');
    }
  };

  const handleDialogue = async () => {
    if (!currentContext?.characters.length) {
      toast.error('Please add characters to your story bible first');
      return;
    }

    const characters = currentContext.characters.slice(0, 2); // Use first two characters
    const situation = selectedText || 'a tense conversation';

    const response = await generateDialogue(characters, situation, currentContext);
    if (response) {
      onInsertText('\n\n' + response.content);
      toast.success('Dialogue generated successfully!');
    }
  };

  const handleDescription = async () => {
    let setting = '';

    if (selectedText) {
      setting = selectedText;
    } else if (currentContext?.settings.length) {
      setting = currentContext.settings[0];
    } else {
      setting = 'the current scene';
    }

    const response = await describeScene(setting, 'atmospheric', currentContext);
    if (response) {
      onInsertText('\n\n' + response.content);
      toast.success('Scene description generated!');
    }
  };

  const tools = [
    {
      icon: PenTool,
      label: 'Continue',
      description: 'Continue writing from selected text',
      action: handleContinueWriting,
      disabled: !selectedText,
    },
    {
      icon: RefreshCw,
      label: 'Rewrite',
      description: 'Improve selected text',
      action: handleRewrite,
      disabled: !selectedText,
    },
    {
      icon: Lightbulb,
      label: 'Ideas',
      description: 'Brainstorm creative ideas',
      action: handleBrainstorm,
      disabled: false,
    },
    {
      icon: Users,
      label: 'Character',
      description: 'Develop character details',
      action: handleCharacterDevelopment,
      disabled: false,
    },
    {
      icon: MessageSquare,
      label: 'Dialogue',
      description: 'Generate character dialogue',
      action: handleDialogue,
      disabled: !currentContext?.characters.length,
    },
    {
      icon: Palette,
      label: 'Describe',
      description: 'Add vivid descriptions',
      action: handleDescription,
      disabled: false,
    },
  ];

  return (
    <div className="flex items-center space-x-1 p-2 bg-muted/30 border-b border-border">
      <div className="flex items-center space-x-1 mr-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">AI Tools:</span>
      </div>

      {tools.map((tool) => (
        <Button
          key={tool.label}
          variant="ghost"
          size="sm"
          onClick={tool.action}
          disabled={tool.disabled || isProcessing}
          className="flex items-center space-x-1"
          title={tool.description}
        >
          {isProcessing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <tool.icon className="h-3 w-3" />
          )}
          <span className="text-xs">{tool.label}</span>
        </Button>
      ))}

      {selectedText && (
        <div className="ml-auto text-xs text-muted-foreground">
          {selectedText.length} chars selected
        </div>
      )}
    </div>
  );
};