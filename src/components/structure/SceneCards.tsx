import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, GripVertical, Users, MapPin, Target, Edit3, Trash2 } from 'lucide-react';
import { SceneCard } from '@/types';

interface SceneCardsProps {
  scenes: SceneCard[];
  onCreateScene: () => void;
  onEditScene: (scene: SceneCard) => void;
  onDeleteScene: (sceneId: string) => void;
  onReorderScenes: (scenes: SceneCard[]) => void;
}

export const SceneCards = ({ 
  scenes, 
  onCreateScene, 
  onEditScene, 
  onDeleteScene,
  onReorderScenes 
}: SceneCardsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAct, setSelectedAct] = useState<number | 'all'>('all');

  const filteredScenes = scenes
    .filter(scene => 
      scene.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scene.summary.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(scene => selectedAct === 'all' || scene.act === selectedAct)
    .sort((a, b) => a.order - b.order);

  const acts = [...new Set(scenes.map(scene => scene.act).filter(Boolean))].sort();

  const SceneCardComponent = ({ scene, index }: { scene: SceneCard; index: number }) => (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <div className="cursor-move opacity-50 group-hover:opacity-100">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  Scene {scene.order}
                </Badge>
                {scene.act && (
                  <Badge variant="secondary" className="text-xs">
                    Act {scene.act}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {scene.wordCount} words
                </Badge>
              </div>
              <CardTitle className="text-lg">{scene.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {scene.summary}
              </CardDescription>
            </div>
          </div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditScene(scene)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteScene(scene.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Purpose</div>
              <div className="text-muted-foreground line-clamp-1">{scene.purpose}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Setting</div>
              <div className="text-muted-foreground line-clamp-1">{scene.setting}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Characters</div>
              <div className="text-muted-foreground line-clamp-1">
                {scene.charactersPresent.join(', ') || 'None specified'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium">Conflict</div>
            <div className="text-sm text-muted-foreground line-clamp-2">{scene.conflict}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium">Outcome</div>
            <div className="text-sm text-muted-foreground line-clamp-2">{scene.outcome}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Scene Cards</h2>
        <p className="text-muted-foreground">
          Plan and organize your story's scenes with detailed breakdowns
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search scenes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          
          <select
            value={selectedAct}
            onChange={(e) => setSelectedAct(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Acts</option>
            {acts.map(act => (
              <option key={act} value={act}>Act {act}</option>
            ))}
          </select>
        </div>
        
        <Button onClick={onCreateScene}>
          <Plus className="h-4 w-4 mr-2" />
          Add Scene
        </Button>
      </div>

      {filteredScenes.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No scenes yet</h3>
          <p className="text-muted-foreground mb-4">
            Create scene cards to plan your story structure
          </p>
          <Button onClick={onCreateScene}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Scene
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[700px]">
          <div className="space-y-4">
            {filteredScenes.map((scene, index) => (
              <SceneCardComponent key={scene.id} scene={scene} index={index} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};