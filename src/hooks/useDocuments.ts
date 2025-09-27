import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Document } from '@/types';

export function useDocuments(projectId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDocuments = useCallback(async () => {
    if (!user || !projectId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const formattedDocuments: Document[] = data.map(doc => ({
        id: doc.id,
        projectId: doc.project_id,
        title: doc.title,
        content: doc.content || '',
        type: doc.type,
        order: doc.order_index,
        wordCount: doc.word_count || 0,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at)
      }));

      setDocuments(formattedDocuments);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [user, projectId]);

  const createDocument = useCallback(async (documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'wordCount'>) => {
    if (!user || !projectId) {
      toast.error('You must be logged in and have a project selected');
      return null;
    }

    try {
      // Calculate word count from content
      const wordCount = documentData.content
        ? documentData.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(word => word.length > 0).length
        : 0;

      const { data, error } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          title: documentData.title,
          content: documentData.content,
          type: documentData.type,
          order_index: documentData.order,
          word_count: wordCount
        })
        .select()
        .single();

      if (error) throw error;

      const newDocument: Document = {
        id: data.id,
        projectId: data.project_id,
        title: data.title,
        content: data.content || '',
        type: data.type,
        order: data.order_index,
        wordCount: data.word_count || 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setDocuments(prev => [...prev, newDocument].sort((a, b) => a.order - b.order));
      toast.success('Document created successfully!');
      return newDocument;
    } catch (err) {
      console.error('Error creating document:', err);
      toast.error('Failed to create document');
      return null;
    }
  }, [user, projectId]);

  const updateDocument = useCallback(async (documentId: string, updates: Partial<Document>) => {
    if (!user) return null;

    try {
      // Calculate word count if content is being updated
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) {
        updateData.content = updates.content;
        updateData.word_count = updates.content
          ? updates.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(word => word.length > 0).length
          : 0;
      }
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.order !== undefined) updateData.order_index = updates.order;

      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      const updatedDocument: Document = {
        id: data.id,
        projectId: data.project_id,
        title: data.title,
        content: data.content || '',
        type: data.type,
        order: data.order_index,
        wordCount: data.word_count || 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setDocuments(prev => prev.map(d => d.id === documentId ? updatedDocument : d));

      // Only show success toast for manual updates, not auto-saves
      if (Object.keys(updates).length > 1 || !updates.content) {
        toast.success('Document updated successfully!');
      }

      return updatedDocument;
    } catch (err) {
      console.error('Error updating document:', err);
      toast.error('Failed to update document');
      return null;
    }
  }, [user]);

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== documentId));
      toast.success('Document deleted successfully!');
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Failed to delete document');
      return false;
    }
  }, [user]);

  const saveContent = useCallback(async (documentId: string, content: string) => {
    if (!user) return false;

    try {
      const wordCount = content
        ? content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(word => word.length > 0).length
        : 0;

      const { error } = await supabase
        .from('documents')
        .update({
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setDocuments(prev => prev.map(d =>
        d.id === documentId
          ? { ...d, content, wordCount, updatedAt: new Date() }
          : d
      ));

      return true;
    } catch (err) {
      console.error('Error saving content:', err);
      return false;
    }
  }, [user]);

  // Auto-save functionality with debouncing
  const autoSave = useCallback(
    debounce(async (documentId: string, content: string) => {
      await saveContent(documentId, content);
    }, 2000),
    [saveContent]
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user || !projectId) return;

    const subscription = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, projectId, fetchDocuments]);

  return {
    documents,
    isLoading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    saveContent,
    autoSave,
    refetch: fetchDocuments
  };
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}