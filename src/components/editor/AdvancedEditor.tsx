import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Eye,
  FileText,
  BarChart3,
  Clock,
  Target
} from 'lucide-react';
import { Document } from '@/types';
import { AIEditorChat } from '@/components/ai/AIEditorChat';

interface AdvancedEditorProps {
  document: Document | null;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  showStatistics?: boolean;
  selectedText?: string;
  onTextSelection?: (text: string) => void;
}

export const AdvancedEditor = ({ 
  document, 
  onContentChange, 
  onTitleChange, 
  showStatistics = true,
  selectedText,
  onTextSelection 
}: AdvancedEditorProps) => {
  const [title, setTitle] = useState(document?.title || 'Untitled Document');
  const [content, setContent] = useState(document?.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
    }
  }, [document]);

  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const reading = Math.ceil(words / 250); // Average reading speed

    setWordCount(words);
    setCharCount(chars);
    setReadingTime(reading);
  }, [content]);

  const handleFormat = (command: string, value?: string) => {
    window.document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onTitleChange(newTitle);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && onTextSelection) {
      onTextSelection(selection.toString().trim());
    }
  };

  const handleInsertContent = (content: string, insertType: 'cursor' | 'replace' | 'append') => {
    if (!editorRef.current) return;

    const cleanContent = content.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    
    if (insertType === 'replace' && selectedText) {
      // Replace selected text
      const currentContent = editorRef.current.innerHTML;
      const newContent = currentContent.replace(selectedText, cleanContent);
      setContent(newContent);
      onContentChange(newContent);
      editorRef.current.innerHTML = newContent;
    } else if (insertType === 'append') {
      // Append to end of document
      const newContent = content + (content ? '\n\n' : '') + cleanContent;
      setContent(newContent);
      onContentChange(newContent);
      editorRef.current.innerHTML = newContent;
    } else {
      // Insert at cursor position (default)
      editorRef.current.focus();
      
      // Get current selection/cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Create a text node or HTML element
        const contentNode = window.document.createElement('span');
        contentNode.innerHTML = cleanContent;
        range.insertNode(contentNode);
        
        // Move cursor after inserted content
        range.setStartAfter(contentNode);
        range.setEndAfter(contentNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Update content
        const newContent = editorRef.current.innerHTML;
        setContent(newContent);
        onContentChange(newContent);
      }
    }
  };

  const formatButtons = [
    { command: 'bold', icon: Bold, label: 'Bold' },
    { command: 'italic', icon: Italic, label: 'Italic' },
    { command: 'underline', icon: Underline, label: 'Underline' },
    { command: 'strikeThrough', icon: Strikethrough, label: 'Strikethrough' },
  ];

  const alignmentButtons = [
    { command: 'justifyLeft', icon: AlignLeft, label: 'Align Left' },
    { command: 'justifyCenter', icon: AlignCenter, label: 'Align Center' },
    { command: 'justifyRight', icon: AlignRight, label: 'Align Right' },
  ];

  const listButtons = [
    { command: 'insertUnorderedList', icon: List, label: 'Bullet List' },
    { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered List' },
  ];

  const headingButtons = [
    { command: 'formatBlock', value: 'h1', icon: Heading1, label: 'Heading 1' },
    { command: 'formatBlock', value: 'h2', icon: Heading2, label: 'Heading 2' },
    { command: 'formatBlock', value: 'h3', icon: Heading3, label: 'Heading 3' },
    { command: 'formatBlock', value: 'p', icon: Type, label: 'Paragraph' },
  ];

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Document Selected</h3>
          <p className="text-muted-foreground">
            Select or create a document to start writing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Enhanced Toolbar */}
      <div className="border-b border-border bg-background p-4">
        <div className="space-y-3">
          {/* Primary formatting tools */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-1 pr-3">
              {formatButtons.map(({ command, icon: Icon, label }) => (
                <Button
                  key={command}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat(command)}
                  className="h-8 w-8"
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center space-x-1 px-3">
              {headingButtons.map(({ command, value, icon: Icon, label }) => (
                <Button
                  key={`${command}-${value}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat(command, value)}
                  className="h-8 w-8"
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center space-x-1 px-3">
              {alignmentButtons.map(({ command, icon: Icon, label }) => (
                <Button
                  key={command}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat(command)}
                  className="h-8 w-8"
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center space-x-1 px-3">
              {listButtons.map(({ command, icon: Icon, label }) => (
                <Button
                  key={command}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat(command)}
                  className="h-8 w-8"
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('formatBlock', 'blockquote')}
                className="h-8 w-8"
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1" />

            <Button
              variant={showPreview ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-8"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          {/* Statistics bar */}
          {showStatistics && (
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <BarChart3 className="h-4 w-4" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center space-x-1">
                <Type className="h-4 w-4" />
                <span>{charCount} characters</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
              {selectedText && (
                <Badge variant="secondary" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  Text selected
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Title */}
      <div className="px-8 pt-8 pb-4 border-b border-border">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder-muted-foreground"
          placeholder="Document title..."
        />
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex pb-16"> {/* Add padding bottom for chat */}
        {!showPreview ? (
          <div className="flex-1 px-8 py-8">
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
              onMouseUp={handleTextSelect}
              onKeyUp={handleTextSelect}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        ) : (
          <ScrollArea className="flex-1 px-8 py-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </ScrollArea>
        )}
      </div>

      {/* AI Chat Interface */}
      <AIEditorChat
        selectedText={selectedText}
        onInsertContent={handleInsertContent}
        documentTitle={title}
        currentContent={content}
      />
    </div>
  );
};