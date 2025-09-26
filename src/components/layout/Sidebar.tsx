import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SidebarProps {
  selectedDocument: string | null;
  onSelectDocument: (id: string | null) => void;
}

export const Sidebar = ({ selectedDocument, onSelectDocument }: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock documents for now
  const documents = [
    { id: '1', title: 'Chapter One: The Beginning', updatedAt: '2 hours ago' },
    { id: '2', title: 'Character Development Notes', updatedAt: '1 day ago' },
    { id: '3', title: 'Plot Outline', updatedAt: '3 days ago' },
  ];

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-border-subtle bg-surface flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Ottowrite</h1>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          className="w-full justify-start"
          onClick={() => onSelectDocument('new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border-subtle">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {filteredDocuments.map((doc) => (
            <Button
              key={doc.id}
              variant={selectedDocument === doc.id ? "secondary" : "ghost"}
              className="w-full justify-start p-3 h-auto mb-1"
              onClick={() => onSelectDocument(doc.id)}
            >
              <FileText className="h-4 w-4 mr-3 flex-shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium truncate">{doc.title}</div>
                <div className="text-xs text-muted-foreground">{doc.updatedAt}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};