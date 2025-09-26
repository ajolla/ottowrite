import { useState, useEffect } from 'react';
import { 
  Project, 
  Document, 
  Character, 
  Setting, 
  TimelineEvent, 
  SceneCard 
} from '@/types';
import { 
  User, 
  ProjectMember, 
  Comment, 
  Assignment, 
  Version 
} from '@/types/collaboration';

// Mock data generator
export const useMockData = () => {
  const [mockCurrentUser] = useState<User>({
    id: 'user-1',
    name: 'Alex Writer',
    email: 'alex@ottowrite.com',
    role: 'owner',
    isOnline: true,
    lastSeen: new Date(),
    avatar: undefined
  });

  const [mockProjects] = useState<Project[]>([
    {
      id: 'project-1',
      title: 'The Last Kingdom',
      description: 'A fantasy epic about the fall of kingdoms and the rise of heroes in a world where magic is dying.',
      genre: 'Fantasy',
      type: 'novel',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      wordCount: 45000,
      targetWordCount: 80000
    },
    {
      id: 'project-2',
      title: 'Silicon Dreams',
      description: 'A sci-fi thriller set in near-future Silicon Valley where AI consciousness emerges.',
      genre: 'Science Fiction',
      type: 'screenplay',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-01-18'),
      wordCount: 12000,
      targetWordCount: 25000
    },
    {
      id: 'project-3',
      title: 'Coffee Shop Chronicles',
      description: 'A collection of interconnected short stories set in a neighborhood coffee shop.',
      genre: 'Literary Fiction',
      type: 'short-story',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15'),
      wordCount: 8500,
      targetWordCount: 15000
    }
  ]);

  const [mockDocuments] = useState<Document[]>([
    {
      id: 'doc-1',
      projectId: 'project-1',
      title: 'Chapter 1: The Burning City',
      content: '<p>The flames rose higher than the tallest towers of Vaelthorne, painting the night sky in shades of orange and red...</p>',
      type: 'chapter',
      order: 1,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      wordCount: 3200
    },
    {
      id: 'doc-2',
      projectId: 'project-1',
      title: 'Chapter 2: The Last Survivor',
      content: '<p>Kira stumbled through the rubble, her sword heavy in her trembling hand...</p>',
      type: 'chapter',
      order: 2,
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-19'),
      wordCount: 2800
    },
    {
      id: 'doc-3',
      projectId: 'project-1',
      title: 'Kira Shadowbane - Character Sheet',
      content: '<p>Age: 24<br/>Occupation: Royal Guard<br/>Background: Last survivor of the Royal Guard...</p>',
      type: 'character-sheet',
      order: 1,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-18'),
      wordCount: 450
    }
  ]);

  const [mockCharacters] = useState<Character[]>([
    {
      id: 'char-1',
      projectId: 'project-1',
      name: 'Kira Shadowbane',
      description: 'The last surviving member of the Royal Guard',
      background: 'Born into nobility, trained from childhood to protect the royal family. Witnessed the fall of her kingdom.',
      personality: 'Fierce, loyal, haunted by guilt, determined to restore her kingdom',
      goals: 'Rebuild the kingdom, find other survivors, master her newfound magical abilities',
      conflicts: 'Internal guilt vs duty, old world vs new reality, trust issues with new allies',
      arc: 'From broken survivor to reluctant leader to confident queen',
      relationships: [
        {
          characterId: 'char-2',
          characterName: 'Marcus the Wise',
          relationship: 'Mentor',
          description: 'Old wizard who guides her on her journey'
        }
      ],
      notes: 'Consider giving her a distinctive scar from the battle'
    }
  ]);

  const [mockSettings] = useState<Setting[]>([
    {
      id: 'setting-1',
      projectId: 'project-1',
      name: 'Vaelthorne (Ruins)',
      description: 'The once-great capital city, now reduced to smoking ruins',
      atmosphere: 'Desolate, haunting, filled with memories of past glory. Smoke still rises from some buildings.',
      significance: 'The starting point of Kira\'s journey and symbol of what was lost',
      notes: 'Based on medieval Prague architecture'
    }
  ]);

  const [mockTimelineEvents] = useState<TimelineEvent[]>([
    {
      id: 'event-1',
      projectId: 'project-1',
      title: 'The Fall of Vaelthorne',
      description: 'The capital city falls to the Shadow Army, marking the end of the kingdom',
      date: '2024-01-01',
      type: 'plot-point',
      importance: 'high',
      charactersInvolved: ['Kira Shadowbane']
    }
  ]);

  const [mockSceneCards] = useState<SceneCard[]>([
    {
      id: 'scene-1',
      projectId: 'project-1',
      title: 'Opening: The Burning City',
      summary: 'Kira witnesses the fall of Vaelthorne and escapes the palace',
      purpose: 'Establish the world, introduce protagonist, create inciting incident',
      conflict: 'Kira must escape the burning palace while enemies pursue her',
      outcome: 'Kira escapes but is alone and hunted',
      charactersPresent: ['Kira Shadowbane'],
      setting: 'Vaelthorne Palace',
      order: 1,
      act: 1,
      wordCount: 3200
    }
  ]);

  const [mockProjectMembers] = useState<{ [projectId: string]: ProjectMember[] }>({
    'project-1': [
      {
        userId: 'user-1',
        user: mockCurrentUser,
        projectId: 'project-1',
        role: 'owner',
        permissions: [],
        joinedAt: new Date('2024-01-15')
      },
      {
        userId: 'user-2',
        user: {
          id: 'user-2',
          name: 'Sarah Editor',
          email: 'sarah@ottowrite.com',
          role: 'editor',
          isOnline: true,
          lastSeen: new Date(),
          avatar: undefined
        },
        projectId: 'project-1',
        role: 'editor',
        permissions: [],
        joinedAt: new Date('2024-01-16')
      },
      {
        userId: 'user-3',
        user: {
          id: 'user-3',
          name: 'Mike Beta',
          email: 'mike@ottowrite.com',
          role: 'viewer',
          isOnline: false,
          lastSeen: new Date('2024-01-19'),
          avatar: undefined
        },
        projectId: 'project-1',
        role: 'viewer',
        permissions: [],
        joinedAt: new Date('2024-01-17')
      }
    ]
  });

  const [mockComments] = useState<Comment[]>([
    {
      id: 'comment-1',
      documentId: 'doc-1',
      userId: 'user-2',
      user: {
        id: 'user-2',
        name: 'Sarah Editor',
        email: 'sarah@ottowrite.com',
        role: 'editor',
        isOnline: true,
        lastSeen: new Date(),
        avatar: undefined
      },
      content: 'This opening scene is powerful! Consider adding more sensory details about the fire.',
      position: { start: 0, end: 50 },
      thread: [],
      resolved: false,
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19')
    }
  ]);

  const [mockAssignments] = useState<Assignment[]>([
    {
      id: 'assignment-1',
      projectId: 'project-1',
      documentId: 'doc-2',
      assignedTo: 'user-1',
      assignedBy: 'user-2',
      assignee: mockCurrentUser,
      assigner: {
        id: 'user-2',
        name: 'Sarah Editor',
        email: 'sarah@ottowrite.com',
        role: 'editor',
        isOnline: true,
        lastSeen: new Date(),
        avatar: undefined
      },
      title: 'Complete Chapter 2 Draft',
      description: 'Finish the rough draft of Chapter 2, focusing on character development',
      status: 'in_progress',
      dueDate: new Date('2024-01-25'),
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-20')
    }
  ]);

  const [mockVersions] = useState<Version[]>([
    {
      id: 'version-1',
      documentId: 'doc-1',
      content: '<p>The flames rose higher...</p>',
      title: 'Chapter 1: The Burning City',
      authorId: 'user-1',
      author: mockCurrentUser,
      changeType: 'edit',
      summary: 'Added more descriptive language to opening paragraph',
      createdAt: new Date('2024-01-20')
    },
    {
      id: 'version-2',
      documentId: 'doc-1',
      content: '<p>The flames rose...</p>',
      title: 'Chapter 1: The Burning City',
      authorId: 'user-1',
      author: mockCurrentUser,
      changeType: 'create',
      summary: 'Initial draft of Chapter 1',
      createdAt: new Date('2024-01-15')
    }
  ]);

  // Security mock data
  const [mockSecuritySettings] = useState({
    id: 'security-1',
    projectId: 'project-1',
    encryptionEnabled: true,
    encryptionLevel: 'AES-256-GCM' as const,
    storageRegion: 'US' as const,
    watermarkingEnabled: true,
    watermarkType: 'invisible' as const,
    auditLoggingEnabled: true,
    twoFactorRequired: false,
    autoBackupEnabled: true,
    retentionPeriod: 365
  });

  const [mockComplianceReports] = useState([
    {
      id: 'report-1',
      reportType: 'gdpr' as const,
      generatedBy: 'user-1',
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      data: {},
      generatedAt: new Date('2024-01-20')
    }
  ]);

  const [mockAuditLogs] = useState([
    {
      id: 'audit-1',
      userId: 'user-1',
      userName: 'Alex Writer',
      projectId: 'project-1',
      documentId: 'doc-1',
      action: 'document_edited' as const,
      details: 'Updated Chapter 1 content',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      timestamp: new Date('2024-01-20T10:30:00'),
      metadata: {}
    },
    {
      id: 'audit-2',
      userId: 'user-2',
      userName: 'Sarah Editor',
      projectId: 'project-1',
      action: 'login_success' as const,
      details: 'User logged in successfully',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0...',
      timestamp: new Date('2024-01-19T14:15:00'),
      metadata: {}
    }
  ]);

  const [mockIntellectualProperties] = useState([
    {
      id: 'ip-1',
      projectId: 'project-1',
      authorName: 'Alex Writer',
      authorEmail: 'alex@ottowrite.com',
      copyrightClaimant: 'Alex Writer',
      workTitle: 'The Last Kingdom',
      workType: 'literary' as const,
      creationDate: new Date('2024-01-15'),
      rightsStatement: 'Original literary work created by Alex Writer. All rights reserved. This work is protected under international copyright law.',
      witnesses: [
        {
          id: 'witness-1',
          name: 'Sarah Editor',
          email: 'sarah@ottowrite.com',
          role: 'Editor',
          signedAt: new Date('2024-01-16'),
          signature: 'digital-signature-hash'
        }
      ],
      digitalSignature: 'author-digital-signature-hash'
    }
  ]);

  return {
    mockCurrentUser,
    mockProjects,
    mockDocuments,
    mockCharacters,
    mockSettings,
    mockTimelineEvents,
    mockSceneCards,
    mockProjectMembers,
    mockComments,
    mockAssignments,
    mockVersions,
    mockSecuritySettings,
    mockComplianceReports,
    mockAuditLogs,
    mockIntellectualProperties
  };
};