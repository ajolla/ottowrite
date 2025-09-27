import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Bold, Italic, Underline } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useProjects } from '@/hooks/useProjects';

interface DocumentEditorProps {
  documentId: string | null;
  projectId: string | null;
  onToggleAI: () => void;
  showAIAssistant: boolean;
  onCreateDocument?: () => void;
}

export const DocumentEditor = ({ documentId, projectId, onToggleAI, showAIAssistant, onCreateDocument }: DocumentEditorProps) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const editorRef = useRef<HTMLDivElement>(null);
  const { documents, updateDocument, autoSave } = useDocuments(projectId);
  const { createProject } = useProjects();

  // Load document content when documentId changes
  useEffect(() => {
    if (documentId && documents.length > 0) {
      const document = documents.find(d => d.id === documentId);
      if (document) {
        setContent(document.content);
        setTitle(document.title);
      }
    }
  }, [documentId, documents]);

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  const handleStartWriting = () => {
    if (onCreateDocument) {
      onCreateDocument();
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Auto-save content after user stops typing
    if (documentId) {
      autoSave(documentId, newContent);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);

    // Update title in database
    if (documentId) {
      updateDocument(documentId, { title: newTitle });
    }
  };

  if (!documentId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-paper">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Welcome to Ottowrite</h2>
            <p className="text-muted-foreground">
              Your AI-powered creative writing companion. Create a new document or select an existing one to begin your writing journey.
            </p>
          </div>
          <Button onClick={handleStartWriting} className="min-w-32">
            Start Writing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-paper">
      {/* Toolbar */}
      <div className="border-b border-border-subtle bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFormat('bold')}
              className="h-8 w-8"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFormat('italic')}
              className="h-8 w-8"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFormat('underline')}
              className="h-8 w-8"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant={showAIAssistant ? "default" : "outline"}
            size="sm"
            onClick={onToggleAI}
            className="flex items-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Assistant</span>
          </Button>
        </div>
      </div>

      {/* Document Title */}
      <div className="px-6 pt-8 pb-4 border-b border-border-subtle">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full text-3xl font-semibold bg-transparent border-none outline-none placeholder-muted-foreground"
          placeholder="Document title..."
        />
      </div>

      {/* Editor */}
      <div className="flex-1 px-6 py-8">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-full prose prose-lg max-w-none focus:outline-none"
          style={{
            lineHeight: '1.8',
            fontSize: '18px',
            color: 'hsl(var(--foreground))',
          }}
          onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
          suppressContentEditableWarning={true}
        >
          <p className="text-muted-foreground">Start writing your story...</p>
        </div>
      </div>
    </div>
  );
};