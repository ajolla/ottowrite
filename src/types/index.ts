export interface Project {
  id: string;
  title: string;
  description: string;
  genre: string;
  type: 'novel' | 'screenplay' | 'stage-play' | 'short-story';
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  targetWordCount?: number;
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: 'chapter' | 'scene' | 'character-sheet' | 'setting' | 'outline' | 'notes';
  order: number;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  description: string;
  background: string;
  personality: string;
  goals: string;
  conflicts: string;
  arc: string;
  relationships: Relationship[];
  imageUrl?: string;
  notes: string;
}

export interface Relationship {
  characterId: string;
  characterName: string;
  relationship: string;
  description: string;
}

export interface Setting {
  id: string;
  projectId: string;
  name: string;
  description: string;
  atmosphere: string;
  significance: string;
  imageUrl?: string;
  notes: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  title: string;
  description: string;
  date: string;
  type: 'plot-point' | 'character-development' | 'world-event';
  importance: 'low' | 'medium' | 'high';
  charactersInvolved: string[];
}

export interface SceneCard {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  purpose: string;
  conflict: string;
  outcome: string;
  charactersPresent: string[];
  setting: string;
  order: number;
  act?: number;
  wordCount: number;
}

export interface StoryStructure {
  id: string;
  projectId: string;
  type: 'three-act' | 'heros-journey' | 'save-the-cat' | 'custom';
  beats: StructureBeat[];
}

export interface StructureBeat {
  id: string;
  name: string;
  description: string;
  targetPage?: number;
  actualPage?: number;
  completed: boolean;
  notes: string;
}

export interface WritingGoal {
  id: string;
  projectId: string;
  type: 'daily' | 'weekly' | 'project';
  targetWords: number;
  currentWords: number;
  deadline?: Date;
  completed: boolean;
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  category: 'brainstorming' | 'rewriting' | 'dialogue' | 'description' | 'structure';
  icon: string;
  prompt: string;
}