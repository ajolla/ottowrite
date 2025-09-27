import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Copyright, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  User,
  Mail,
  PenTool,
  Shield,
  Globe,
  Plus,
  X
} from 'lucide-react';
import { IntellectualProperty, IPWitness, intellectualPropertySchema } from '@/types/security';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface IntellectualPropertyManagerProps {
  projectId: string;
  intellectualProperties: IntellectualProperty[];
  onCreateIP: (ip: Partial<IntellectualProperty>) => void;
  onUpdateIP: (id: string, ip: Partial<IntellectualProperty>) => void;
  onRegisterCopyright: (id: string) => void;
  onUploadContract: (id: string, file: File) => void;
}

export const IntellectualPropertyManager = ({
  projectId,
  intellectualProperties,
  onCreateIP,
  onUpdateIP,
  onRegisterCopyright,
  onUploadContract
}: IntellectualPropertyManagerProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<IntellectualProperty>>({});
  const [witnesses, setWitnesses] = useState<Partial<IPWitness>[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = () => {
    try {
      intellectualPropertySchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive",
      });
      return;
    }

    const ipData: Partial<IntellectualProperty> = {
      ...formData,
      projectId,
      witnesses: witnesses.filter(w => w.name && w.email) as IPWitness[],
    };

    onCreateIP(ipData);
    setShowCreateDialog(false);
    setFormData({});
    setWitnesses([]);
    
    toast({
      title: "IP Record Created",
      description: "Intellectual property record has been created successfully",
    });
  };

  const addWitness = () => {
    setWitnesses([...witnesses, { name: '', email: '', role: '' }]);
  };

  const updateWitness = (index: number, field: keyof IPWitness, value: string) => {
    const updated = [...witnesses];
    updated[index] = { ...updated[index], [field]: value };
    setWitnesses(updated);
  };

  const removeWitness = (index: number) => {
    setWitnesses(witnesses.filter((_, i) => i !== index));
  };

  const getStatusBadge = (ip: IntellectualProperty) => {
    if (ip.registrationNumber) {
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Registered</Badge>;
    }
    if (ip.digitalSignature) {
      return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Signed</Badge>;
    }
    return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Draft</Badge>;
  };

  const CreateIPDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create IP Record
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Intellectual Property Record</DialogTitle>
          <DialogDescription>
            Document ownership and rights for your creative work
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Author Name *</label>
              <Input
                value={formData.authorName || ''}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                placeholder="Full legal name"
                className={formErrors.authorName ? 'border-destructive' : ''}
              />
              {formErrors.authorName && (
                <div className="text-xs text-destructive mt-1">{formErrors.authorName}</div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">Author Email *</label>
              <Input
                type="email"
                value={formData.authorEmail || ''}
                onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
                placeholder="author@example.com"
                className={formErrors.authorEmail ? 'border-destructive' : ''}
              />
              {formErrors.authorEmail && (
                <div className="text-xs text-destructive mt-1">{formErrors.authorEmail}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Work Title *</label>
              <Input
                value={formData.workTitle || ''}
                onChange={(e) => setFormData({ ...formData, workTitle: e.target.value })}
                placeholder="Title of your work"
                className={formErrors.workTitle ? 'border-destructive' : ''}
              />
              {formErrors.workTitle && (
                <div className="text-xs text-destructive mt-1">{formErrors.workTitle}</div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">Work Type *</label>
              <Select
                value={formData.workType}
                onValueChange={(value) => setFormData({ ...formData, workType: value as IntellectualProperty['workType'] })}
              >
                <SelectTrigger className={formErrors.workType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="literary">Literary Work</SelectItem>
                  <SelectItem value="dramatic">Dramatic Work</SelectItem>
                  <SelectItem value="audiovisual">Audiovisual Work</SelectItem>
                  <SelectItem value="sound-recording">Sound Recording</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.workType && (
                <div className="text-xs text-destructive mt-1">{formErrors.workType}</div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Copyright Claimant *</label>
            <Input
              value={formData.copyrightClaimant || ''}
              onChange={(e) => setFormData({ ...formData, copyrightClaimant: e.target.value })}
              placeholder="Name of copyright holder"
              className={formErrors.copyrightClaimant ? 'border-destructive' : ''}
            />
            {formErrors.copyrightClaimant && (
              <div className="text-xs text-destructive mt-1">{formErrors.copyrightClaimant}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Creation Date *</label>
              <Input
                type="date"
                value={formData.creationDate ? formData.creationDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, creationDate: new Date(e.target.value) })}
                className={formErrors.creationDate ? 'border-destructive' : ''}
              />
              {formErrors.creationDate && (
                <div className="text-xs text-destructive mt-1">{formErrors.creationDate}</div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">Publication Date</label>
              <Input
                type="date"
                value={formData.publicationDate ? formData.publicationDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, publicationDate: new Date(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Rights Statement *</label>
            <Textarea
              value={formData.rightsStatement || ''}
              onChange={(e) => setFormData({ ...formData, rightsStatement: e.target.value })}
              placeholder="Describe the rights being claimed and any limitations..."
              className={`min-h-[100px] ${formErrors.rightsStatement ? 'border-destructive' : ''}`}
            />
            {formErrors.rightsStatement && (
              <div className="text-xs text-destructive mt-1">{formErrors.rightsStatement}</div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Witnesses</label>
              <Button type="button" size="sm" variant="outline" onClick={addWitness}>
                <Plus className="h-4 w-4 mr-2" />
                Add Witness
              </Button>
            </div>
            
            <div className="space-y-3">
              {witnesses.map((witness, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-accent/20 rounded-lg">
                  <Input
                    placeholder="Witness name"
                    value={witness.name || ''}
                    onChange={(e) => updateWitness(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={witness.email || ''}
                    onChange={(e) => updateWitness(index, 'email', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Role"
                    value={witness.role || ''}
                    onChange={(e) => updateWitness(index, 'role', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeWitness(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Create IP Record
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Copyright className="h-6 w-6 mr-2" />
            Intellectual Property Management
          </h2>
          <p className="text-muted-foreground">
            Protect and document your creative rights
          </p>
        </div>
        <CreateIPDialog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {intellectualProperties.map((ip) => (
          <Card key={ip.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{ip.workTitle}</CardTitle>
                  <CardDescription>
                    {ip.workType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {ip.authorName}
                  </CardDescription>
                </div>
                {getStatusBadge(ip)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    <User className="h-4 w-4 mr-1" />
                    Copyright Claimant
                  </div>
                  <div className="font-medium">{ip.copyrightClaimant}</div>
                </div>
                
                <div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    Creation Date
                  </div>
                  <div className="font-medium">{ip.creationDate.toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Rights Statement</div>
                <div className="text-sm line-clamp-3">{ip.rightsStatement}</div>
              </div>

              {ip.witnesses.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Witnesses</div>
                  <div className="flex -space-x-2">
                    {ip.witnesses.slice(0, 3).map((witness) => (
                      <Avatar key={witness.id} className="h-6 w-6 border border-background">
                        <AvatarFallback className="text-xs">
                          {witness.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {ip.witnesses.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center text-xs">
                        +{ip.witnesses.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                {!ip.registrationNumber && (
                  <Button 
                    size="sm" 
                    onClick={() => onRegisterCopyright(ip.id)}
                    className="flex-1"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Register Copyright
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.doc,.docx';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        toast.success(`Contract "${file.name}" uploaded successfully`);
                      }
                    };
                    input.click();
                  }}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Contract
                </Button>
              </div>

              {ip.registrationNumber && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center text-green-800 dark:text-green-200">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      Copyright Registered: {ip.registrationNumber}
                    </span>
                  </div>
                  {ip.registrationDate && (
                    <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Registered on {ip.registrationDate.toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {intellectualProperties.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <Copyright className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No IP records yet</h3>
            <p className="text-muted-foreground mb-4">
              Create intellectual property records to protect your creative works
            </p>
            <CreateIPDialog />
          </div>
        )}
      </div>
    </div>
  );
};