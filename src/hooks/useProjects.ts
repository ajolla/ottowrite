import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Project } from '@/types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch projects user owns or is a member of
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members!inner(
            role,
            user_id
          )
        `)
        .or(`user_id.eq.${user.id},project_members.user_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedProjects: Project[] = data.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description || '',
        genre: project.genre || 'General',
        type: project.type,
        wordCount: project.word_count || 0,
        targetWordCount: project.target_word_count,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at)
      }));

      setProjects(formattedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'wordCount'>) => {
    if (!user) {
      toast.error('You must be logged in to create projects');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: projectData.title,
          description: projectData.description,
          genre: projectData.genre,
          type: projectData.type,
          target_word_count: projectData.targetWordCount
        })
        .select()
        .single();

      if (error) throw error;

      // Create project owner membership
      await supabase
        .from('project_members')
        .insert({
          project_id: data.id,
          user_id: user.id,
          role: 'owner'
        });

      const newProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        genre: data.genre || 'General',
        type: data.type,
        wordCount: 0,
        targetWordCount: data.target_word_count,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setProjects(prev => [newProject, ...prev]);
      toast.success('Project created successfully!');
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Failed to create project');
      return null;
    }
  }, [user]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          title: updates.title,
          description: updates.description,
          genre: updates.genre,
          type: updates.type,
          target_word_count: updates.targetWordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      const updatedProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        genre: data.genre || 'General',
        type: data.type,
        wordCount: data.word_count || 0,
        targetWordCount: data.target_word_count,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      toast.success('Project updated successfully!');
      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Failed to update project');
      return null;
    }
  }, [user]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id); // Only owner can delete

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully!');
      return true;
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error('Failed to delete project');
      return false;
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  };
}