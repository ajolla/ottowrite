import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  MapPin,
  Sparkles,
  Plus,
  RefreshCw,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

interface Character {
  id: string;
  name: string;
  description: string;
  traits: string[];
  background: string;
}

interface Setting {
  id: string;
  name: string;
  description: string;
  atmosphere: string;
  details: string[];
}

interface AIStoryBibleProps {
  characters: Character[];
  settings: Setting[];
  genre: string;
  onAddCharacter: (character: Character) => void;
  onUpdateCharacter: (character: Character) => void;
  onAddSetting: (setting: Setting) => void;
  onUpdateSetting: (setting: Setting) => void;
}

export const AIStoryBible = ({
  characters,
  settings,
  genre,
  onAddCharacter,
  onUpdateCharacter,
  onAddSetting,
  onUpdateSetting,
}: AIStoryBibleProps) => {
  const [activeTab, setActiveTab] = useState('characters');
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newSettingName, setNewSettingName] = useState('');

  const {
    isProcessing,
    developCharacter,
    describeScene,
    brainstormIdeas,
    customRequest,
  } = useAI();

  const handleGenerateCharacter = async () => {
    if (!newCharacterName.trim()) {
      toast.error('Please enter a character name');
      return;
    }

    const context = {
      characters: characters.map(c => c.name),
      settings: settings.map(s => s.name),
      genre,
    };

    const response = await developCharacter(newCharacterName, context);
    if (response) {
      const newCharacter: Character = {
        id: Date.now().toString(),
        name: newCharacterName,
        description: response.content,
        traits: extractTraits(response.content),
        background: response.content,
      };

      onAddCharacter(newCharacter);
      setNewCharacterName('');
      toast.success('Character generated and added to story bible!');
    }
  };

  const handleGenerateSetting = async () => {
    if (!newSettingName.trim()) {
      toast.error('Please enter a setting name');
      return;
    }

    const context = {
      characters: characters.map(c => c.name),
      settings: settings.map(s => s.name),
      genre,
    };

    const response = await describeScene(newSettingName, 'atmospheric', context);
    if (response) {
      const newSetting: Setting = {
        id: Date.now().toString(),
        name: newSettingName,
        description: response.content,
        atmosphere: extractAtmosphere(response.content),
        details: extractDetails(response.content),
      };

      onAddSetting(newSetting);
      setNewSettingName('');
      toast.success('Setting generated and added to story bible!');
    }
  };

  const handleEnhanceCharacter = async (character: Character) => {
    const prompt = `Expand and enhance this character: ${character.name}\n\nCurrent description: ${character.description}\n\nAdd more depth, specific details, and unique quirks that make this character memorable and three-dimensional.`;

    const context = {
      characters: characters.map(c => c.name),
      settings: settings.map(s => s.name),
      genre,
    };

    const response = await customRequest(prompt, context);
    if (response) {
      const enhancedCharacter: Character = {
        ...character,
        description: response.content,
        traits: extractTraits(response.content),
        background: response.content,
      };

      onUpdateCharacter(enhancedCharacter);
      toast.success('Character enhanced successfully!');
    }
  };

  const handleEnhanceSetting = async (setting: Setting) => {
    const prompt = `Expand and enhance this setting: ${setting.name}\n\nCurrent description: ${setting.description}\n\nAdd more sensory details, history, and unique elements that make this location feel alive and integral to the story.`;

    const context = {
      characters: characters.map(c => c.name),
      settings: settings.map(s => s.name),
      genre,
    };

    const response = await customRequest(prompt, context);
    if (response) {
      const enhancedSetting: Setting = {
        ...setting,
        description: response.content,
        atmosphere: extractAtmosphere(response.content),
        details: extractDetails(response.content),
      };

      onUpdateSetting(enhancedSetting);
      toast.success('Setting enhanced successfully!');
    }
  };

  const handleGenerateRelationships = async () => {
    if (characters.length < 2) {
      toast.error('Add at least 2 characters to generate relationships');
      return;
    }

    const prompt = `Create detailed relationships between these characters: ${characters.map(c => c.name).join(', ')}.

Character descriptions:
${characters.map(c => `${c.name}: ${c.description}`).join('\n\n')}

Generate specific relationships, conflicts, alliances, and dynamics between each pair of characters. Make the relationships complex and story-relevant.`;

    const context = {
      characters: characters.map(c => c.name),
      settings: settings.map(s => s.name),
      genre,
    };

    const response = await customRequest(prompt, context);
    if (response) {
      // Could add to a relationships section or create a new character with relationship info
      toast.success('Character relationships generated! Check the AI assistant for details.');
    }
  };

  const extractTraits = (text: string): string[] => {
    // Simple extraction - could be more sophisticated
    const traitKeywords = ['personality', 'trait', 'characteristic', 'quality'];
    const lines = text.split('\n');
    const traits: string[] = [];

    lines.forEach(line => {
      if (traitKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        const extracted = line.replace(/[-•*]/g, '').trim();
        if (extracted.length > 0 && extracted.length < 50) {
          traits.push(extracted);
        }
      }
    });

    return traits.slice(0, 5); // Limit to 5 traits
  };

  const extractAtmosphere = (text: string): string => {
    const atmosphereKeywords = ['atmosphere', 'mood', 'feeling', 'ambiance'];
    const lines = text.split('\n');

    for (const line of lines) {
      if (atmosphereKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        return line.replace(/[-•*]/g, '').trim();
      }
    }

    return 'Atmospheric';
  };

  const extractDetails = (text: string): string[] => {
    return text.split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3)
      .map(line => line.replace(/[-•*]/g, '').trim());
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Story Bible</h3>
            <Badge variant="secondary">{genre}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateRelationships}
            disabled={isProcessing || characters.length < 2}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Relationships
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="characters" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Characters ({characters.length})</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Settings ({settings.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="flex-1 p-4 space-y-4">
          {/* Add New Character */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Character</CardTitle>
              <CardDescription>
                Enter a character name and let AI develop their personality, background, and traits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Character name..."
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateCharacter()}
                />
                <Button
                  onClick={handleGenerateCharacter}
                  disabled={isProcessing || !newCharacterName.trim()}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Character List */}
          <div className="space-y-3">
            {characters.map((character) => (
              <Card key={character.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{character.name}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEnhanceCharacter(character)}
                      disabled={isProcessing}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Enhance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {character.description.substring(0, 200)}...
                  </p>
                  {character.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {character.traits.map((trait, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-4 space-y-4">
          {/* Add New Setting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Setting</CardTitle>
              <CardDescription>
                Enter a location name and let AI create a vivid, detailed description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Setting name..."
                  value={newSettingName}
                  onChange={(e) => setNewSettingName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateSetting()}
                />
                <Button
                  onClick={handleGenerateSetting}
                  disabled={isProcessing || !newSettingName.trim()}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settings List */}
          <div className="space-y-3">
            {settings.map((setting) => (
              <Card key={setting.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{setting.name}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEnhanceSetting(setting)}
                      disabled={isProcessing}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Enhance
                    </Button>
                  </div>
                  <Badge variant="secondary">{setting.atmosphere}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {setting.description.substring(0, 200)}...
                  </p>
                  {setting.details.length > 0 && (
                    <div className="space-y-1">
                      {setting.details.map((detail, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          • {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};