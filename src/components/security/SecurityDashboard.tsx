import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  Globe, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Key,
  Database,
  Copyright,
  Settings
} from 'lucide-react';
import { SecuritySettings, ComplianceReport, AuditLog } from '@/types/security';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SecurityDashboardProps {
  projectId: string;
  securitySettings: SecuritySettings;
  complianceReports: ComplianceReport[];
  auditLogs: AuditLog[];
  onUpdateSettings: (settings: Partial<SecuritySettings>) => void;
  onGenerateReport: (type: ComplianceReport['reportType']) => void;
  onRequestDataDeletion: () => void;
  onEnable2FA: () => void;
}

export const SecurityDashboard = ({
  projectId,
  securitySettings,
  complianceReports,
  auditLogs,
  onUpdateSettings,
  onGenerateReport,
  onRequestDataDeletion,
  onEnable2FA
}: SecurityDashboardProps) => {
  const [activeTab, setActiveTab] = useState('security');

  const getComplianceScore = () => {
    let score = 0;
    if (securitySettings.encryptionEnabled) score += 20;
    if (securitySettings.encryptionLevel === 'AES-256-GCM') score += 10;
    if (securitySettings.auditLoggingEnabled) score += 20;
    if (securitySettings.twoFactorRequired) score += 15;
    if (securitySettings.watermarkingEnabled) score += 10;
    if (securitySettings.autoBackupEnabled) score += 10;
    if (securitySettings.storageRegion !== 'GLOBAL') score += 15;
    return score;
  };

  const complianceScore = getComplianceScore();

  const SecurityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Compliance Score
          </CardTitle>
          <CardDescription>
            Your project's security and compliance rating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{complianceScore}/100</span>
              <Badge variant={complianceScore >= 80 ? "default" : complianceScore >= 60 ? "secondary" : "destructive"}>
                {complianceScore >= 80 ? "Excellent" : complianceScore >= 60 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
            <Progress value={complianceScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Encryption Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">End-to-End Encryption</div>
              <div className="text-sm text-muted-foreground">Encrypt all content at rest and in transit</div>
            </div>
            <Switch
              checked={securitySettings.encryptionEnabled}
              onCheckedChange={(checked) => onUpdateSettings({ encryptionEnabled: checked })}
            />
          </div>
          
          {securitySettings.encryptionEnabled && (
            <div className="ml-4 space-y-2">
              <div className="text-sm font-medium">Encryption Level</div>
              <Select
                value={securitySettings.encryptionLevel}
                onValueChange={(value) => onUpdateSettings({ encryptionLevel: value as SecuritySettings['encryptionLevel'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AES-128">AES-128 (Standard)</SelectItem>
                  <SelectItem value="AES-256">AES-256 (Enhanced)</SelectItem>
                  <SelectItem value="AES-256-GCM">AES-256-GCM (Maximum Security)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Data Storage & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Storage Region</div>
            <Select
              value={securitySettings.storageRegion}
              onValueChange={(value) => onUpdateSettings({ storageRegion: value as SecuritySettings['storageRegion'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States Only</SelectItem>
                <SelectItem value="EU">European Union Only</SelectItem>
                <SelectItem value="GLOBAL">Global (Multi-Region)</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground mt-1">
              {securitySettings.storageRegion === 'EU' && "✓ GDPR Compliant"}
              {securitySettings.storageRegion === 'US' && "✓ CCPA Compliant"}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Comprehensive Audit Logging</div>
              <div className="text-sm text-muted-foreground">Track all user actions and data access</div>
            </div>
            <Switch
              checked={securitySettings.auditLoggingEnabled}
              onCheckedChange={(checked) => onUpdateSettings({ auditLoggingEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Automatic Backups</div>
              <div className="text-sm text-muted-foreground">Daily encrypted backups</div>
            </div>
            <Switch
              checked={securitySettings.autoBackupEnabled}
              onCheckedChange={(checked) => onUpdateSettings({ autoBackupEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Content Protection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Document Watermarking</div>
              <div className="text-sm text-muted-foreground">Protect against unauthorized sharing</div>
            </div>
            <Switch
              checked={securitySettings.watermarkingEnabled}
              onCheckedChange={(checked) => onUpdateSettings({ watermarkingEnabled: checked })}
            />
          </div>

          {securitySettings.watermarkingEnabled && (
            <div className="ml-4 space-y-2">
              <div className="text-sm font-medium">Watermark Type</div>
              <Select
                value={securitySettings.watermarkType}
                onValueChange={(value) => onUpdateSettings({ watermarkType: value as SecuritySettings['watermarkType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">Visible Watermark</SelectItem>
                  <SelectItem value="invisible">Invisible Watermark</SelectItem>
                  <SelectItem value="both">Both Visible & Invisible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Authentication & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Require Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">Enhanced login security for all users</div>
            </div>
            <Switch
              checked={securitySettings.twoFactorRequired}
              onCheckedChange={(checked) => onUpdateSettings({ twoFactorRequired: checked })}
            />
          </div>

          <Button onClick={onEnable2FA} className="w-full">
            Configure 2FA Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const ComplianceTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Compliance Reports
          </CardTitle>
          <CardDescription>
            Generate compliance reports for regulatory requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => onGenerateReport('gdpr')} variant="outline">
              <Globe className="h-4 w-4 mr-2" />
              GDPR Report
            </Button>
            <Button onClick={() => onGenerateReport('ccpa')} variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              CCPA Report
            </Button>
            <Button onClick={() => onGenerateReport('audit')} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Security Audit
            </Button>
            <Button onClick={() => onGenerateReport('security')} variant="outline">
              <Lock className="h-4 w-4 mr-2" />
              Security Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {complianceReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                  <div>
                    <div className="font-medium capitalize">{report.reportType} Report</div>
                    <div className="text-sm text-muted-foreground">
                      Generated {report.generatedAt.toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
              {complianceReports.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No compliance reports generated yet
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <Trash2 className="h-5 w-5 mr-2" />
            Data Deletion Rights
          </CardTitle>
          <CardDescription>
            Request permanent deletion of your data (GDPR/CCPA compliant)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <div className="font-medium text-destructive">Warning</div>
                  <div className="text-sm text-muted-foreground">
                    Data deletion is permanent and cannot be undone. This action will remove all your manuscripts, 
                    characters, settings, and associated metadata.
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={onRequestDataDeletion} variant="destructive" className="w-full">
              Request Data Deletion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AuditTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Comprehensive audit trail of all user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 bg-accent/20 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{log.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: {log.details}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      IP: {log.ipAddress}
                    </div>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs available
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Shield className="h-6 w-6 mr-2" />
          Security & Compliance
        </h2>
        <p className="text-muted-foreground">
          Protect your intellectual property with enterprise-grade security
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="security" className="mt-0">
            <SecurityTab />
          </TabsContent>
          
          <TabsContent value="compliance" className="mt-0">
            <ComplianceTab />
          </TabsContent>
          
          <TabsContent value="audit" className="mt-0">
            <AuditTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};