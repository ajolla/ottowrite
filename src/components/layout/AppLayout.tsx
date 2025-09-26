import { useState } from 'react';
import { ProjectSwitcher } from '../project/ProjectSwitcher';
import { EnhancedSidebar } from './EnhancedSidebar';
import { AdvancedEditor } from '../editor/AdvancedEditor';
import { AdvancedAIAssistant } from '../ai/AdvancedAIAssistant';
import { ProjectManager } from '../project/ProjectManager';
import { CharacterManager } from '../story-bible/CharacterManager';
import { SettingsManager } from '../story-bible/SettingsManager';
import { TimelineManager } from '../story-bible/TimelineManager';
import { SceneCards } from '../structure/SceneCards';
import { CollaborationPanel } from '../collaboration/CollaborationPanel';
import { SecurityDashboard } from '../security/SecurityDashboard';
import { IntellectualPropertyManager } from '../security/IntellectualPropertyManager';
import { Button } from '@/components/ui/button';
import { Users, Settings, PenTool } from 'lucide-react';
import { Project, Document, Character, Setting, TimelineEvent, SceneCard } from '@/types';
import { useMockData } from '@/hooks/useMockData';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export const AppLayout = () => {
  const {
    mockCurrentUser,
    mockProjects,
    mockDocuments,
    mockCharacters,
    mockSettings,
    mockTimelineEvents,
    mockSceneCards,
    mockProjectMembers,
    mockComments,
    mockAssignments,
    mockVersions,
    mockSecuritySettings,
    mockComplianceReports,
    mockAuditLogs,
    mockIntellectualProperties,
  } = useMockData();

  const [currentProject, setCurrentProject] = useState<Project | null>(mockProjects[0]);
  const [documents] = useState<Document[]>(mockDocuments);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(mockDocuments[0]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [currentSection, setCurrentSection] = useState('editor');
  const [selectedText, setSelectedText] = useState<string>('');

  const renderMainContent = () => {
    if (!currentProject) {
      return (
        <ProjectManager 
          projects={mockProjects} 
          onSelectProject={setCurrentProject} 
          onCreateProject={() => {}}
        />
      );
    }

    switch (currentSection) {
      case 'overview':
        return (
          <ProjectManager 
            projects={mockProjects} 
            onSelectProject={setCurrentProject} 
            onCreateProject={() => {}}
            selectedProject={currentProject}
          />
        );
      case 'characters':
        return (
          <CharacterManager 
            characters={mockCharacters} 
            onCreateCharacter={() => {}} 
            onEditCharacter={() => {}} 
            onSelectCharacter={() => {}} 
          />
        );
      case 'settings':
        return (
          <SettingsManager 
            settings={mockSettings} 
            onCreateSetting={() => {}} 
            onEditSetting={() => {}} 
            onDeleteSetting={() => {}} 
            onSelectSetting={() => {}} 
          />
        );
      case 'timeline':
        return (
          <TimelineManager 
            events={mockTimelineEvents} 
            onCreateEvent={() => {}} 
            onEditEvent={() => {}} 
            onDeleteEvent={() => {}} 
          />
        );
      case 'scenes':
        return (
          <SceneCards 
            scenes={mockSceneCards} 
            onCreateScene={() => {}} 
            onEditScene={() => {}} 
            onDeleteScene={() => {}} 
            onReorderScenes={() => {}} 
          />
        );
      case 'security':
        return (
          <SecurityDashboard
            projectId={currentProject?.id || ''}
            securitySettings={mockSecuritySettings}
            complianceReports={mockComplianceReports}
            auditLogs={mockAuditLogs}
            onUpdateSettings={() => {}}
            onGenerateReport={() => {}}
            onRequestDataDeletion={() => {}}
            onEnable2FA={() => {}}
          />
        );
      case 'ip-management':
        return (
          <IntellectualPropertyManager
            projectId={currentProject?.id || ''}
            intellectualProperties={mockIntellectualProperties}
            onCreateIP={() => {}}
            onUpdateIP={() => {}}
            onRegisterCopyright={() => {}}
            onUploadContract={() => {}}
          />
        );
      case 'editor':
      default:
        return (
          <div className="flex-1 flex flex-col">
            {/* Enhanced toolbar with collaboration features */}
            <div className="border-b border-border bg-background px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ProjectSwitcher
                    projects={mockProjects}
                    currentProject={currentProject}
                    onSelectProject={setCurrentProject}
                    onCreateProject={() => {}}
                    onManageProjects={() => setCurrentSection('overview')}
                    projectMembers={mockProjectMembers}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                  <Button
                    variant={showCollaboration ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCollaboration(!showCollaboration)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Collaborate
                  </Button>
                  
                  <Button
                    variant={showAIAssistant ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    AI Assistant
                  </Button>
                </div>
              </div>
            </div>
            
            <AdvancedEditor
              document={selectedDocument}
              onContentChange={() => {}}
              onTitleChange={() => {}}
              selectedText={selectedText}
              onTextSelection={setSelectedText}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <EnhancedSidebar
        currentProject={currentProject || undefined}
        documents={documents.filter(doc => doc.projectId === currentProject?.id)}
        selectedDocument={selectedDocument || undefined}
        onSelectDocument={setSelectedDocument}
        onCreateDocument={() => {}}
        onNavigateToSection={setCurrentSection}
        currentSection={currentSection}
      />
      
      <div className="flex-1 flex">
        {renderMainContent()}
        
        {showCollaboration && currentProject && (
          <CollaborationPanel
            projectMembers={mockProjectMembers[currentProject.id] || []}
            comments={mockComments}
            assignments={mockAssignments}
            versions={mockVersions}
            currentUser={mockCurrentUser}
            onClose={() => setShowCollaboration(false)}
            onInviteUser={() => {}}
            onAddComment={() => {}}
            onCreateAssignment={() => {}}
          />
        )}
        
        {showAIAssistant && (
          <AdvancedAIAssistant 
            onClose={() => setShowAIAssistant(false)}
            selectedText={selectedText}
            currentContext={{
              characters: mockCharacters.map(c => c.name),
              settings: mockSettings.map(s => s.name),
              genre: currentProject?.genre || 'General',
              currentScene: selectedDocument?.title
            }}
          />
        )}
      </div>
    </div>
  );
};