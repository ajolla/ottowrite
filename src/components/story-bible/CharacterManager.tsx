import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Users, Heart, Sword, Eye, Edit3 } from 'lucide-react';
import { Character, Relationship } from '@/types';

interface CharacterManagerProps {
  characters: Character[];
  onCreateCharacter: () => void;
  onEditCharacter: (character: Character) => void;
  selectedCharacter?: Character;
  onSelectCharacter: (character: Character) => void;
}

export const CharacterManager = ({ 
  characters, 
  onCreateCharacter, 
  onEditCharacter, 
  selectedCharacter,
  onSelectCharacter 
}: CharacterManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    character.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCharacterInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const CharacterList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={onCreateCharacter} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Character
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharacters.map((character) => (
            <Card 
              key={character.id}
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                selectedCharacter?.id === character.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectCharacter(character)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={character.imageUrl} />
                      <AvatarFallback>{getCharacterInitials(character.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{character.name}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {character.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCharacter(character);
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {character.relationships.slice(0, 3).map((rel, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {rel.relationship}
                    </Badge>
                  ))}
                  {character.relationships.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{character.relationships.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {character.personality}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const CharacterDetail = ({ character }: { character: Character }) => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={character.imageUrl} />
            <AvatarFallback className="text-lg">
              {getCharacterInitials(character.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{character.name}</h2>
            <p className="text-muted-foreground">{character.description}</p>
          </div>
        </div>
        <Button onClick={() => onEditCharacter(character)}>
          <Edit3 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="arc">Character Arc</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Background & Personality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Background</h4>
                <p className="text-sm text-muted-foreground">{character.background}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Personality</h4>
                <p className="text-sm text-muted-foreground">{character.personality}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Goals</h4>
                <p className="text-sm text-muted-foreground">{character.goals}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Conflicts</h4>
                <p className="text-sm text-muted-foreground">{character.conflicts}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="relationships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Relationships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {character.relationships.map((relationship, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                    <div>
                      <div className="font-medium">{relationship.characterName}</div>
                      <div className="text-sm text-muted-foreground">{relationship.description}</div>
                    </div>
                    <Badge variant="outline">{relationship.relationship}</Badge>
                  </div>
                ))}
                {character.relationships.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No relationships defined yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="arc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sword className="h-5 w-5 mr-2" />
                Character Arc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{character.arc}</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{character.notes}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (selectedCharacter) {
    return <CharacterDetail character={selectedCharacter} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Users className="h-6 w-6 mr-2" />
          Character Bible
        </h2>
        <p className="text-muted-foreground">
          Manage your story's characters, relationships, and development arcs
        </p>
      </div>
      
      <CharacterList />
    </div>
  );
};