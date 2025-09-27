import { useState, useEffect } from 'react';
import { useWatermarks } from '@/hooks/useWatermarks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  FileText,
  Download,
  Printer,
  Settings,
  Palette,
  Copy
} from 'lucide-react';
import { WatermarkConfig, WATERMARK_TEMPLATES } from '@/types/watermark';
import { WatermarkSystemManager } from '@/lib/watermark-system';
import { toast } from 'sonner';

export const WatermarkManager = () => {
  const {
    watermarks,
    isLoading,
    createWatermark,
    updateWatermark,
    deleteWatermark,
    toggleWatermark
  } = useWatermarks();
  const [selectedWatermark, setSelectedWatermark] = useState<WatermarkConfig | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state for creating/editing watermarks
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    subText: '',
    position: 'bottom-right' as const,
    style: {
      fontSize: 10,
      color: '#6B7280',
      opacity: 0.8,
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#F9FAFB',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: 8,
      borderRadius: 4
    },
    forUserTiers: ['free'] as ('free' | 'premium' | 'enterprise')[],
    isActive: true
  });

  useEffect(() => {
    loadWatermarks();
  }, []);

  const loadWatermarks = async () => {
    try {
      setIsLoading(true);
      const configs = await WatermarkSystemManager.getAllWatermarkConfigs();
      setWatermarks(configs);
    } catch (error) {
      console.error('Failed to load watermarks:', error);
      toast.error('Failed to load watermark configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const createWatermark = async () => {
    try {
      await WatermarkSystemManager.createWatermarkConfig(formData);
      toast.success('Watermark configuration created successfully');
      setShowCreateDialog(false);
      resetForm();
      loadWatermarks();
    } catch (error) {
      console.error('Failed to create watermark:', error);
      toast.error('Failed to create watermark configuration');
    }
  };

  const updateWatermark = async (id: string, updates: Partial<WatermarkConfig>) => {
    try {
      await WatermarkSystemManager.updateWatermarkConfig(id, updates);
      toast.success('Watermark configuration updated');
      loadWatermarks();
    } catch (error) {
      console.error('Failed to update watermark:', error);
      toast.error('Failed to update watermark configuration');
    }
  };

  const loadTemplate = (template: typeof WATERMARK_TEMPLATES[0]) => {
    setFormData({
      name: template.name,
      text: template.text,
      subText: template.subText || '',
      position: template.position,
      style: template.style,
      forUserTiers: template.forUserTiers,
      isActive: template.isActive
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      text: '',
      subText: '',
      position: 'bottom-right',
      style: {
        fontSize: 10,
        color: '#6B7280',
        opacity: 0.8,
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 8,
        borderRadius: 4
      },
      forUserTiers: ['free'],
      isActive: true
    });
  };

  const generatePreviewHTML = (config: WatermarkConfig) => {
    return `
      <div style="position: relative; width: 400px; height: 300px; background: white; border: 1px solid #ddd; padding: 20px;">
        <h3>Sample Document Content</h3>
        <p>This is a preview of how the watermark will appear on exported documents.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        ${WatermarkSystemManager.generateWatermarkHTML(config)}
      </div>
    `;
  };

  const copyWatermarkHTML = (config: WatermarkConfig) => {
    const html = WatermarkSystemManager.generateWatermarkHTML(config);
    navigator.clipboard.writeText(html);
    toast.success('Watermark HTML copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Watermark Management</h2>
          <p className="text-muted-foreground">
            Configure watermarks for documents exported by free users
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Watermark
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Watermark Configuration</DialogTitle>
              <DialogDescription>
                Configure how watermarks appear on documents exported by free users
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="style">Style & Appearance</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Configuration Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Default Free User Watermark"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, position: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-center">Bottom Center</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text">Main Text</Label>
                  <Input
                    id="text"
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Created with OttoWrite AI"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subText">Sub Text (Optional)</Label>
                  <Input
                    id="subText"
                    value={formData.subText}
                    onChange={(e) => setFormData(prev => ({ ...prev, subText: e.target.value }))}
                    placeholder="Upgrade for watermark-free exports"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Apply to User Tiers</Label>
                  <div className="flex gap-2">
                    {(['free', 'premium', 'enterprise'] as const).map(tier => (
                      <div key={tier} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={tier}
                          checked={formData.forUserTiers.includes(tier)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                forUserTiers: [...prev.forUserTiers, tier]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                forUserTiers: prev.forUserTiers.filter(t => t !== tier)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={tier} className="capitalize">{tier}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      value={formData.style.fontSize}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        style: { ...prev.style, fontSize: parseInt(e.target.value) }
                      }))}
                      min="8"
                      max="24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Text Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={formData.style.color}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        style: { ...prev.style, color: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opacity">Opacity</Label>
                    <Input
                      id="opacity"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={formData.style.opacity}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        style: { ...prev.style, opacity: parseFloat(e.target.value) }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.style.backgroundColor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        style: { ...prev.style, backgroundColor: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="borderColor">Border Color</Label>
                    <Input
                      id="borderColor"
                      type="color"
                      value={formData.style.borderColor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        style: { ...prev.style, borderColor: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="borderWidth">Border Width</Label>
                    <Input
                      id="borderWidth"
                      type="number"
                      value={formData.style.borderWidth}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        style: { ...prev.style, borderWidth: parseInt(e.target.value) }
                      }))}
                      min="0"
                      max="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="padding">Padding</Label>
                    <Input
                      id="padding"
                      type="number"
                      value={formData.style.padding}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        style: { ...prev.style, padding: parseInt(e.target.value) }
                      }))}
                      min="0"
                      max="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="borderRadius">Border Radius</Label>
                    <Input
                      id="borderRadius"
                      type="number"
                      value={formData.style.borderRadius}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        style: { ...prev.style, borderRadius: parseInt(e.target.value) }
                      }))}
                      min="0"
                      max="20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={formData.style.fontFamily}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      style: { ...prev.style, fontFamily: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {WATERMARK_TEMPLATES.map((template, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {template.text}
                              {template.subText && ` • ${template.subText}`}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{template.position}</Badge>
                              <Badge variant="secondary">
                                {template.forUserTiers.join(', ')}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadTemplate(template)}
                          >
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Live Preview</h4>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: generatePreviewHTML({
                          ...formData,
                          id: 'preview',
                          createdAt: new Date(),
                          updatedAt: new Date()
                        })
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyWatermarkHTML({
                        ...formData,
                        id: 'preview',
                        createdAt: new Date(),
                        updatedAt: new Date()
                      })}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy HTML
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createWatermark}>Create Watermark</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Watermark Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Watermark Configurations</CardTitle>
          <CardDescription>
            Manage watermark settings for different user tiers and export formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading watermark configurations...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>User Tiers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watermarks.map((watermark) => (
                  <TableRow key={watermark.id}>
                    <TableCell className="font-medium">{watermark.name}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium text-sm">{watermark.text}</div>
                        {watermark.subText && (
                          <div className="text-xs text-muted-foreground">{watermark.subText}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{watermark.position}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {watermark.forUserTiers.map(tier => (
                          <Badge key={tier} variant="secondary" className="text-xs">
                            {tier}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={watermark.isActive ? "default" : "secondary"}>
                        {watermark.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyWatermarkHTML(watermark)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateWatermark(watermark.id, { isActive: !watermark.isActive })}
                        >
                          {watermark.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};