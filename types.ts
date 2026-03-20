export enum DiagramType {
  MINDMAP = 'mindmap',
  FLOWCHART = 'flowchart',
  SEQUENCE = 'sequence',
  TIMELINE = 'timeline',
  ORGCHART = 'orgchart',
  GANTT = 'gantt'
}

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SummaryData {
  oneLiner: string;
  paragraph: string;
  keyPoints: string;
}

export interface GeneratedContent {
  diagramCode: string;
  summary: SummaryData;
  diagramType: DiagramType;
  flashcards: Flashcard[];
  quiz?: QuizQuestion[];
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 string
}