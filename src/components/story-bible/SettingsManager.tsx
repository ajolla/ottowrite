import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MapPin, Edit3, Trash2, Image } from 'lucide-react';
import { Setting } from '@/types';

interface SettingsManagerProps {
  settings: Setting[];
  onCreateSetting: () => void;
  onEditSetting: (setting: Setting) => void;
  onDeleteSetting: (settingId: string) => void;
  selectedSetting?: Setting;
  onSelectSetting: (setting: Setting) => void;
}

export const SettingsManager = ({ 
  settings, 
  onCreateSetting, 
  onEditSetting, 
  onDeleteSetting,
  selectedSetting,
  onSelectSetting 
}: SettingsManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSettings = settings.filter(setting =>
    setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SettingsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={onCreateSetting} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSettings.map((setting) => (
            <Card 
              key={setting.id}
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                selectedSetting?.id === setting.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectSetting(setting)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      {setting.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {setting.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSetting(setting);
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {setting.imageUrl && (
                  <div className="w-full h-32 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                <div>
                  <div className="text-sm font-medium mb-1">Atmosphere</div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {setting.atmosphere}
                  </p>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Significance</div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {setting.significance}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const SettingDetail = ({ setting }: { setting: Setting }) => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <MapPin className="h-6 w-6 mr-2 text-primary" />
            {setting.name}
          </h2>
          <p className="text-muted-foreground mt-1">{setting.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => onEditSetting(setting)}>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => onDeleteSetting(setting.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visual Reference</CardTitle>
          </CardHeader>
          <CardContent>
            {setting.imageUrl ? (
              <div className="w-full h-48 bg-accent/20 rounded-lg flex items-center justify-center">
                <Image className="h-12 w-12 text-muted-foreground" />
              </div>
            ) : (
              <div className="w-full h-48 bg-accent/10 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center">
                  <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No image added</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atmosphere & Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {setting.atmosphere}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Story Significance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {setting.significance}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {setting.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {setting.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (selectedSetting) {
    return <SettingDetail setting={selectedSetting} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <MapPin className="h-6 w-6 mr-2" />
          Locations & Settings
        </h2>
        <p className="text-muted-foreground">
          Create and manage the places where your story unfolds
        </p>
      </div>
      
      <SettingsList />
    </div>
  );
};