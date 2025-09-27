import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Calendar, Clock, Users, Star, AlertCircle, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import { TimelineEvent } from '@/types';

interface TimelineManagerProps {
  events: TimelineEvent[];
  onCreateEvent: () => void;
  onEditEvent: (event: TimelineEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const TimelineManager = ({ 
  events, 
  onCreateEvent, 
  onEditEvent, 
  onDeleteEvent 
}: TimelineManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByType, setFilterByType] = useState<string>('all');
  const [filterByImportance, setFilterByImportance] = useState<string>('all');

  const filteredEvents = events
    .filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(event => filterByType === 'all' || event.type === filterByType)
    .filter(event => filterByImportance === 'all' || event.importance === filterByImportance)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getTypeIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'plot-point':
        return Star;
      case 'character-development':
        return Users;
      case 'world-event':
        return AlertCircle;
      default:
        return Calendar;
    }
  };

  const getTypeLabel = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'plot-point':
        return 'Plot Point';
      case 'character-development':
        return 'Character Development';
      case 'world-event':
        return 'World Event';
      default:
        return 'Event';
    }
  };

  const getImportanceColor = (importance: TimelineEvent['importance']): "default" | "secondary" | "destructive" | "outline" => {
    switch (importance) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Clock className="h-6 w-6 mr-2" />
          Story Timeline
        </h2>
        <p className="text-muted-foreground">
          Track events, plot points, and character developments chronologically
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          
          <select
            value={filterByType}
            onChange={(e) => setFilterByType(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Types</option>
            <option value="plot-point">Plot Points</option>
            <option value="character-development">Character Development</option>
            <option value="world-event">World Events</option>
          </select>

          <select
            value={filterByImportance}
            onChange={(e) => setFilterByImportance(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Importance</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <Button onClick={onCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No timeline events yet</h3>
          <p className="text-muted-foreground mb-4">
            Create events to build your story's chronological structure
          </p>
          <Button onClick={onCreateEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Event
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[700px]">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
            
            <div className="space-y-6">
              {filteredEvents.map((event, index) => {
                const Icon = getTypeIcon(event.type);
                
                return (
                  <div key={event.id} className="relative flex items-start space-x-6">
                    {/* Timeline marker */}
                    <div className="relative">
                      <div className="w-4 h-4 bg-primary rounded-full border-2 border-background shadow-sm" />
                    </div>
                    
                    {/* Event card */}
                    <Card className="flex-1 group hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Icon className="h-4 w-4 text-primary" />
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(event.type)}
                              </Badge>
                              <Badge 
                                variant={getImportanceColor(event.importance)}
                                className="text-xs"
                              >
                                {event.importance}
                              </Badge>
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(event.date)}
                              </div>
                            </div>
                            
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {event.description}
                            </CardDescription>
                          </div>
                          
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditEvent(event)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteEvent(event.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {event.charactersInvolved.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Characters involved:</span>
                              {' '}
                              {event.charactersInvolved.join(', ')}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};