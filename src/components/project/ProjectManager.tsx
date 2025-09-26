import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Book, Film, Theater, FileText, Calendar, Target } from 'lucide-react';
import { Project } from '@/types';

interface ProjectManagerProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  selectedProject?: Project;
}

export const ProjectManager = ({ projects, onSelectProject, onCreateProject, selectedProject }: ProjectManagerProps) => {
  const getProjectIcon = (type: Project['type']) => {
    switch (type) {
      case 'novel':
        return Book;
      case 'screenplay':
        return Film;
      case 'stage-play':
        return Theater;
      case 'short-story':
        return FileText;
      default:
        return FileText;
    }
  };

  const getProjectTypeLabel = (type: Project['type']) => {
    switch (type) {
      case 'novel':
        return 'Novel';
      case 'screenplay':
        return 'Screenplay';
      case 'stage-play':
        return 'Stage Play';
      case 'short-story':
        return 'Short Story';
      default:
        return 'Document';
    }
  };

  const calculateProgress = (project: Project) => {
    if (!project.targetWordCount) return 0;
    return Math.min((project.wordCount / project.targetWordCount) * 100, 100);
  };

  return (
    <div className="p-6 bg-background">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Your Projects</h2>
          <p className="text-muted-foreground">Manage your creative writing projects</p>
        </div>
        <Button onClick={onCreateProject} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const Icon = getProjectIcon(project.type);
          const progress = calculateProgress(project);
          
          return (
            <Card 
              key={project.id}
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectProject(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <Badge variant="secondary">
                      {getProjectTypeLabel(project.type)}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {project.genre}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {project.wordCount.toLocaleString()} 
                    {project.targetWordCount && ` / ${project.targetWordCount.toLocaleString()}`} words
                  </span>
                </div>
                
                {project.targetWordCount && (
                  <Progress value={progress} className="h-2" />
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {project.targetWordCount && (
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3" />
                      <span>{Math.round(progress)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <Book className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first creative writing project to get started
          </p>
          <Button onClick={onCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Project
          </Button>
        </div>
      )}
    </div>
  );
};