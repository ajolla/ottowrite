import { z } from 'zod';

// Security & Compliance Types
export interface SecuritySettings {
  id: string;
  projectId: string;
  encryptionEnabled: boolean;
  encryptionLevel: 'AES-128' | 'AES-256' | 'AES-256-GCM';
  storageRegion: 'US' | 'EU' | 'GLOBAL';
  watermarkingEnabled: boolean;
  watermarkType: 'visible' | 'invisible' | 'both';
  auditLoggingEnabled: boolean;
  twoFactorRequired: boolean;
  autoBackupEnabled: boolean;
  retentionPeriod: number; // days
}

export interface IntellectualProperty {
  id: string;
  projectId: string;
  authorName: string;
  authorEmail: string;
  copyrightClaimant: string;
  workTitle: string;
  workType: 'literary' | 'dramatic' | 'audiovisual' | 'sound-recording';
  creationDate: Date;
  publicationDate?: Date;
  registrationNumber?: string;
  registrationDate?: Date;
  rightsStatement: string;
  contractUploadUrl?: string;
  digitalSignature?: string;
  witnesses: IPWitness[];
}

export interface IPWitness {
  id: string;
  name: string;
  email: string;
  role: string;
  signedAt: Date;
  signature: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  documentId?: string;
  action: AuditAction;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export type AuditAction = 
  | 'document_created'
  | 'document_edited'
  | 'document_deleted'
  | 'document_viewed'
  | 'document_shared'
  | 'project_created'
  | 'project_deleted'
  | 'user_invited'
  | 'user_removed'
  | 'settings_changed'
  | 'export_performed'
  | 'backup_created'
  | 'login_success'
  | 'login_failed'
  | 'password_changed'
  | '2fa_enabled'
  | '2fa_disabled';

export interface DataDeletionRequest {
  id: string;
  userId: string;
  requestType: 'partial' | 'complete';
  projectIds?: string[];
  reason: string;
  requestedAt: Date;
  scheduledFor: Date;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedBy?: string;
  completedAt?: Date;
}

export interface ComplianceReport {
  id: string;
  reportType: 'gdpr' | 'ccpa' | 'audit' | 'security';
  projectId?: string;
  generatedBy: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  data: Record<string, any>;
  generatedAt: Date;
  downloadUrl?: string;
}

// Validation Schemas
export const securitySettingsSchema = z.object({
  encryptionEnabled: z.boolean(),
  encryptionLevel: z.enum(['AES-128', 'AES-256', 'AES-256-GCM']),
  storageRegion: z.enum(['US', 'EU', 'GLOBAL']),
  watermarkingEnabled: z.boolean(),
  watermarkType: z.enum(['visible', 'invisible', 'both']),
  auditLoggingEnabled: z.boolean(),
  twoFactorRequired: z.boolean(),
  autoBackupEnabled: z.boolean(),
  retentionPeriod: z.number().min(1).max(2555), // 1 day to 7 years
});

export const intellectualPropertySchema = z.object({
  authorName: z.string().trim().min(1, "Author name is required").max(100, "Author name must be less than 100 characters"),
  authorEmail: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  copyrightClaimant: z.string().trim().min(1, "Copyright claimant is required").max(100, "Claimant name must be less than 100 characters"),
  workTitle: z.string().trim().min(1, "Work title is required").max(200, "Work title must be less than 200 characters"),
  workType: z.enum(['literary', 'dramatic', 'audiovisual', 'sound-recording']),
  creationDate: z.date(),
  publicationDate: z.date().optional(),
  rightsStatement: z.string().trim().min(10, "Rights statement must be at least 10 characters").max(1000, "Rights statement must be less than 1000 characters"),
});

export const dataDeletionSchema = z.object({
  requestType: z.enum(['partial', 'complete']),
  projectIds: z.array(z.string()).optional(),
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(500, "Reason must be less than 500 characters"),
  scheduledFor: z.date().min(new Date(), "Deletion date must be in the future"),
});