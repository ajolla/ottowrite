import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  FileText,
  File,
  Globe,
  Printer,
  Crown,
  Info,
  CheckCircle
} from 'lucide-react';
import { DocumentExportManager } from '@/lib/document-export';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DocumentExporterProps {
  content: string;
  title: string;
  documentId?: string;
}

export const DocumentExporter = ({ content, title, documentId }: DocumentExporterProps) => {
  const { user, profile } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'html'>('pdf');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const userTier = profile?.tier || 'free';
  const isFreeTier = userTier === 'free';

  const handleExport = async () => {
    if (!user) {
      toast.error('Please sign in to export documents');
      return;
    }

    setIsExporting(true);

    try {
      let blob: Blob;
      let filename: string;
      let exportedContent: string;

      switch (exportFormat) {
        case 'pdf':
          blob = await DocumentExportManager.exportToPDF(
            content,
            title,
            user.id,
            userTier,
            documentId
          );
          filename = `${title}.pdf`;
          break;

        case 'docx':
          blob = await DocumentExportManager.exportToDocx(
            content,
            title,
            user.id,
            userTier,
            documentId
          );
          filename = `${title}.docx`;
          break;

        case 'html':
          exportedContent = await DocumentExportManager.exportToHTML(
            content,
            title,
            user.id,
            userTier,
            documentId
          );
          blob = new Blob([exportedContent], { type: 'text/html' });
          filename = `${title}.html`;
          break;

        default:
          throw new Error('Invalid export format');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Document exported as ${exportFormat.toUpperCase()}`);
      setShowExportDialog(false);

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export document');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (!user) {
      toast.error('Please sign in to print documents');
      return;
    }

    DocumentExportManager.printDocumentWithWatermark(content, title, userTier);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'docx':
        return <File className="h-4 w-4" />;
      case 'html':
        return <Globe className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'Perfect for sharing and printing, preserves formatting';
      case 'docx':
        return 'Editable in Microsoft Word and compatible applications';
      case 'html':
        return 'Web-friendly format, opens in any browser';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Print Button */}
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Document
            </DialogTitle>
            <DialogDescription>
              Choose your preferred format to download your document
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Watermark Notice for Free Users */}
            {isFreeTier && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Free Plan:</strong> Exported documents will include a small watermark.
                  <a href="/settings" className="text-primary hover:underline ml-1">
                    Upgrade to Premium
                  </a> to remove watermarks.
                </AlertDescription>
              </Alert>
            )}

            {/* Format Selection */}
            <div className="space-y-3">
              <Label htmlFor="format">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF Document
                    </div>
                  </SelectItem>
                  <SelectItem value="docx">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      Word Document (.docx)
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      HTML Document
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <p className="text-sm text-muted-foreground">
                {getFormatDescription(exportFormat)}
              </p>
            </div>

            {/* Format Features */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {getFormatIcon(exportFormat)}
                  <span className="font-medium">{exportFormat.toUpperCase()} Export</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Preserves formatting and styling</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Ready for sharing and distribution</span>
                  </div>
                  {isFreeTier && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Info className="h-3 w-3" />
                      <span>Includes watermark (bottom-right corner)</span>
                    </div>
                  )}
                  {!isFreeTier && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Crown className="h-3 w-3" />
                      <span>No watermarks (Premium feature)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* File Info */}
            <div className="text-sm text-muted-foreground">
              <div><strong>Title:</strong> {title}</div>
              <div><strong>Content:</strong> {content.length.toLocaleString()} characters</div>
              {user && <div><strong>Author:</strong> {user.email}</div>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt for Free Users */}
      {isFreeTier && (
        <Button variant="outline" size="sm" className="text-orange-600 border-orange-200">
          <Crown className="h-4 w-4 mr-2" />
          Remove Watermarks
        </Button>
      )}
    </div>
  );
};