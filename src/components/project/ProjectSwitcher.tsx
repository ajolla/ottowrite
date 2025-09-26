import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Book, 
  Film, 
  Theater, 
  FileText, 
  Search, 
  Users, 
  Calendar,
  ChevronDown,
  Settings,
  Star,
  Archive
} from 'lucide-react';
import { Project } from '@/types';
import { ProjectMember } from '@/types/collaboration';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectSwitcherProps {
  projects: Project[];
  currentProject?: Project;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onManageProjects: () => void;
  projectMembers: { [projectId: string]: ProjectMember[] };
}

export const ProjectSwitcher = ({ 
  projects, 
  currentProject, 
  onSelectProject, 
  onCreateProject,
  onManageProjects,
  projectMembers 
}: ProjectSwitcherProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllProjects, setShowAllProjects] = useState(false);

  const getProjectIcon = (type: Project['type']) => {
    switch (type) {
      case 'novel': return Book;
      case 'screenplay': return Film;
      case 'stage-play': return Theater;
      case 'short-story': return FileText;
      default: return FileText;
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const ProjectCard = ({ project }: { project: Project }) => {
    const Icon = getProjectIcon(project.type);
    const members = projectMembers[project.id] || [];
    const progress = project.targetWordCount 
      ? Math.min((project.wordCount / project.targetWordCount) * 100, 100)
      : 0;

    return (
      <Card 
        className={`cursor-pointer transition-colors hover:bg-accent/50 ${
          currentProject?.id === project.id ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => onSelectProject(project)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {project.description}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {project.genre}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {project.wordCount.toLocaleString()} words
            </span>
            {project.targetWordCount && (
              <span className="text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {members.length} {members.length === 1 ? 'collaborator' : 'collaborators'}
              </span>
            </div>
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((member) => (
                <Avatar key={member.userId} className="h-5 w-5 border border-background">
                  <AvatarImage src={member.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {member.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 3 && (
                <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-xs">
                  +{members.length - 3}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Project switcher dropdown for the sidebar
  const ProjectDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2">
          <div className="flex items-center space-x-2">
            {currentProject ? (
              <>
                {(() => {
                  const Icon = getProjectIcon(currentProject.type);
                  return <Icon className="h-4 w-4" />;
                })()}
                <span className="truncate">{currentProject.title}</span>
              </>
            ) : (
              <>
                <Book className="h-4 w-4" />
                <span>Select Project</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="start">
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Recent Projects</div>
          {recentProjects.map((project) => {
            const Icon = getProjectIcon(project.type);
            return (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="cursor-pointer"
              >
                <Icon className="h-4 w-4 mr-2" />
                <div className="flex-1">
                  <div className="font-medium">{project.title}</div>
                  <div className="text-xs text-muted-foreground">{project.genre}</div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setShowAllProjects(true)}>
          <Archive className="h-4 w-4 mr-2" />
          View All Projects
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onManageProjects}>
          <Settings className="h-4 w-4 mr-2" />
          Manage Projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Full project manager view
  if (showAllProjects) {
    return (
      <div className="p-6 bg-background">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Writing Projects</h2>
            <p className="text-muted-foreground">Manage all your books, screenplays, and stories</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowAllProjects(false)}>
              Back to Current Project
            </Button>
            <Button onClick={onCreateProject}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>{projects.length} total projects</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Book className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first writing project to get started'}
            </p>
            <Button onClick={searchTerm ? () => setSearchTerm('') : onCreateProject}>
              {searchTerm ? 'Clear Search' : 'Create Your First Project'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return <ProjectDropdown />;
};