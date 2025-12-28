
export enum MessageRole {
  User = 'user',
  Model = 'model',
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  isError?: boolean;
}

export interface EditorState {
  content: string;
  isProcessing: boolean;
}

export type MathMode = 'inline' | 'display';

export interface TextSegment {
  type: 'text' | 'math' | 'tikz';
  content: string;
  displayMode?: boolean; // true if $$...$$ or \[...\]
}

export type ExportStyle = 
  | 'standard' 
  | 'minimal' 
  | 'worksheet' 
  | 'notes'
  | 'two-column'   // New: Đề thi 2 cột
  | 'landscape'    // New: Khổ ngang
  | 'large-print'  // New: Cỡ chữ lớn
  | 'draft'        // New: Bản nháp
  | 'flashcards';  // New: Thẻ học tập

// --- Question Bank & TikZ Library Types ---

export interface BankFigure {
  id: string;
  name: string;
  tikzCode: string;
  originalImage?: string; // Base64 of the uploaded image (optional)
  timestamp: number;
}

export interface BankQuestion {
  id: string;
  content: string; // LaTeX & TikZ content
  timestamp: number;
  tags?: string[];
}

export interface BankNode {
  id: string;
  title: string;
  type: 'grade' | 'chapter' | 'lesson';
  children?: BankNode[];
  questions?: BankQuestion[]; // Only 'lesson' nodes usually hold questions
  figures?: BankFigure[];     // New: Store TikZ figures in lessons
}

export interface BankStructure {
  nodes: BankNode[];
}