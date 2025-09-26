import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  Plus, 
  FolderOpen, 
  ChevronDown, 
  ChevronRight,
  Book,
  Users,
  MapPin,
  Clock,
  Target,
  BarChart3,
  Settings,
  Home,
  PenTool,
  Shield,
  Copyright
} from 'lucide-react';
import { Project, Document } from '@/types';

interface EnhancedSidebarProps {
  currentProject?: Project;
  documents: Document[];
  selectedDocument?: Document;
  onSelectDocument: (document: Document) => void;
  onCreateDocument: (type: Document['type']) => void;
  onNavigateToSection: (section: string) => void;
  currentSection: string;
}

export const EnhancedSidebar = ({ 
  currentProject,
  documents,
  selectedDocument,
  onSelectDocument,
  onCreateDocument,
  onNavigateToSection,
  currentSection
}: EnhancedSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['documents', 'story-bible']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const navigationSections = [
    { id: 'overview', label: 'Project Overview', icon: Home, badge: null },
    { id: 'editor', label: 'Editor', icon: PenTool, badge: null },
    { id: 'characters', label: 'Character Bible', icon: Users, badge: null },
    { id: 'settings', label: 'Locations', icon: MapPin, badge: null },
    { id: 'timeline', label: 'Timeline', icon: Clock, badge: null },
    { id: 'scenes', label: 'Scene Cards', icon: Target, badge: null },
    { id: 'structure', label: 'Story Structure', icon: BarChart3, badge: null },
    { id: 'security', label: 'Security & Compliance', icon: Shield, badge: 'Pro' },
    { id: 'ip-management', label: 'IP Management', icon: Copyright, badge: 'Pro' },
    { id: 'analytics', label: 'Writing Analytics', icon: BarChart3, badge: 'Pro' },
  ];

  const documentTypes = [
    { type: 'chapter' as const, label: 'Chapters', icon: Book },
    { type: 'scene' as const, label: 'Scenes', icon: FileText },
    { type: 'character-sheet' as const, label: 'Character Sheets', icon: Users },
    { type: 'setting' as const, label: 'Setting Notes', icon: MapPin },
    { type: 'outline' as const, label: 'Outlines', icon: FolderOpen },
    { type: 'notes' as const, label: 'General Notes', icon: FileText },
  ];

  const getDocumentsByType = (type: Document['type']) => {
    return documents.filter(doc => doc.type === type).sort((a, b) => a.order - b.order);
  };

  const getDocumentIcon = (type: Document['type']) => {
    const typeConfig = documentTypes.find(dt => dt.type === type);
    return typeConfig?.icon || FileText;
  };

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col h-full">
      {/* Project Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold truncate">
            {currentProject?.title || 'Select Project'}
          </h2>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        {currentProject && (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>{currentProject.genre} • {currentProject.type}</span>
              <Badge variant="secondary" className="text-xs">
                {formatWordCount(currentProject.wordCount)} words
              </Badge>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {/* Navigation Sections */}
          <div className="space-y-1">
            {navigationSections.map((section) => {
              const Icon = section.icon;
              const isActive = currentSection === section.id;
              
              return (
                <Button
                  key={section.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onNavigateToSection(section.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="flex-1 text-left">{section.label}</span>
                  {section.badge && (
                    <Badge variant="outline" className="text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          <Separator className="my-4" />

          {/* Documents Section */}
          <Collapsible
            open={expandedSections.has('documents')}
            onOpenChange={() => toggleSection('documents')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Documents</span>
                </div>
                {expandedSections.has('documents') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 pl-2">
              {documentTypes.map((docType) => {
                const typeDocuments = getDocumentsByType(docType.type);
                const Icon = docType.icon;
                
                return (
                  <Collapsible key={docType.type}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between text-sm h-8"
                      >
                        <div className="flex items-center">
                          <Icon className="h-3 w-3 mr-2" />
                          <span className="truncate">{docType.label}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            {typeDocuments.length}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateDocument(docType.type);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-1 pl-4">
                      {typeDocuments.map((document) => (
                        <Button
                          key={document.id}
                          variant={selectedDocument?.id === document.id ? "secondary" : "ghost"}
                          className="w-full justify-between text-xs h-7"
                          onClick={() => onSelectDocument(document)}
                        >
                          <span className="truncate flex-1 text-left">
                            {document.title}
                          </span>
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            {formatWordCount(document.wordCount)}
                          </Badge>
                        </Button>
                      ))}
                      
                      {typeDocuments.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          No {docType.label.toLowerCase()} yet
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onCreateDocument('chapter')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chapter
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onCreateDocument('scene')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Scene
          </Button>
        </div>
      </div>
    </div>
  );
};