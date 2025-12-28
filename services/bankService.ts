
import { BankNode, BankQuestion, BankFigure } from '../types';

const STORAGE_KEY = 'mathdoc_question_bank';

// Default Vietnam Math Curriculum Structure (Simplified)
const DEFAULT_STRUCTURE: BankNode[] = [
  {
    id: 'grade_10',
    title: 'Toán Lớp 10',
    type: 'grade',
    children: [
      {
        id: 'g10_c1',
        title: 'Chương I: Mệnh đề và Tập hợp',
        type: 'chapter',
        children: [
          { id: 'g10_c1_l1', title: 'Bài 1: Mệnh đề', type: 'lesson', questions: [], figures: [] },
          { id: 'g10_c1_l2', title: 'Bài 2: Tập hợp', type: 'lesson', questions: [], figures: [] },
        ]
      },
      {
        id: 'g10_c2',
        title: 'Chương II: Bất phương trình bậc nhất hai ẩn',
        type: 'chapter',
        children: [
            { id: 'g10_c2_l1', title: 'Bài 1: Bất phương trình bậc nhất hai ẩn', type: 'lesson', questions: [], figures: [] },
            { id: 'g10_c2_l2', title: 'Bài 2: Hệ bất phương trình bậc nhất hai ẩn', type: 'lesson', questions: [], figures: [] }
        ]
      },
      {
        id: 'g10_c3',
        title: 'Chương III: Hàm số bậc hai và Đồ thị',
        type: 'chapter',
        children: [
             { id: 'g10_c3_l1', title: 'Bài 1: Hàm số và đồ thị', type: 'lesson', questions: [], figures: [] },
             { id: 'g10_c3_l2', title: 'Bài 2: Hàm số bậc hai', type: 'lesson', questions: [], figures: [] }
        ]
      }
    ]
  },
  {
    id: 'grade_11',
    title: 'Toán Lớp 11',
    type: 'grade',
    children: [
      {
        id: 'g11_c1',
        title: 'Chương I: Hàm số lượng giác và PT lượng giác',
        type: 'chapter',
        children: [
          { id: 'g11_c1_l1', title: 'Bài 1: Góc lượng giác', type: 'lesson', questions: [], figures: [] },
          { id: 'g11_c1_l2', title: 'Bài 2: Giá trị lượng giác', type: 'lesson', questions: [], figures: [] },
          { id: 'g11_c1_l3', title: 'Bài 3: Các công thức lượng giác', type: 'lesson', questions: [], figures: [] }
        ]
      },
      {
          id: 'g11_c2',
          title: 'Chương II: Dãy số. Cấp số cộng và Cấp số nhân',
          type: 'chapter',
          children: [
              { id: 'g11_c2_l1', title: 'Bài 1: Dãy số', type: 'lesson', questions: [], figures: [] },
              { id: 'g11_c2_l2', title: 'Bài 2: Cấp số cộng', type: 'lesson', questions: [], figures: [] }
          ]
      }
    ]
  },
  {
    id: 'grade_12',
    title: 'Toán Lớp 12',
    type: 'grade',
    children: [
      {
        id: 'g12_c1',
        title: 'Chương I: Ứng dụng đạo hàm khảo sát hàm số',
        type: 'chapter',
        children: [
          { id: 'g12_c1_l1', title: 'Bài 1: Tính đơn điệu của hàm số', type: 'lesson', questions: [], figures: [] },
          { id: 'g12_c1_l2', title: 'Bài 2: Cực trị của hàm số', type: 'lesson', questions: [], figures: [] },
          { id: 'g12_c1_l3', title: 'Bài 3: GTLN và GTNN của hàm số', type: 'lesson', questions: [], figures: [] },
          { id: 'g12_c1_l4', title: 'Bài 4: Đường tiệm cận', type: 'lesson', questions: [], figures: [] },
          { id: 'g12_c1_l5', title: 'Bài 5: Khảo sát sự biến thiên và vẽ đồ thị', type: 'lesson', questions: [], figures: [] }
        ]
      },
      {
          id: 'g12_c2',
          title: 'Chương II: Mũ và Logarit',
          type: 'chapter',
          children: [
              { id: 'g12_c2_l1', title: 'Bài 1: Lũy thừa', type: 'lesson', questions: [], figures: [] },
              { id: 'g12_c2_l2', title: 'Bài 2: Logarit', type: 'lesson', questions: [], figures: [] }
          ]
      },
      {
          id: 'g12_c3',
          title: 'Chương III: Nguyên hàm - Tích phân',
          type: 'chapter',
          children: [
               { id: 'g12_c3_l1', title: 'Bài 1: Nguyên hàm', type: 'lesson', questions: [], figures: [] },
               { id: 'g12_c3_l2', title: 'Bài 2: Tích phân', type: 'lesson', questions: [], figures: [] }
          ]
      }
    ]
  }
];

export const getBankData = (): BankNode[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STRUCTURE));
    return DEFAULT_STRUCTURE;
  }
  try {
      return JSON.parse(stored);
  } catch(e) {
      console.error("Error parsing bank data, resetting", e);
      return DEFAULT_STRUCTURE;
  }
};

export const saveBankData = (data: BankNode[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const saveToBank = (gradeId: string, chapterId: string, lessonId: string, content: string): boolean => {
    const data = getBankData();
    
    const grade = data.find(g => g.id === gradeId);
    if (!grade || !grade.children) return false;

    const chapter = grade.children.find(c => c.id === chapterId);
    if (!chapter || !chapter.children) return false;

    const lesson = chapter.children.find(l => l.id === lessonId);
    if (!lesson) return false;

    if (!lesson.questions) lesson.questions = [];

    const newQuestion: BankQuestion = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        content: content,
        timestamp: Date.now()
    };

    lesson.questions.push(newQuestion);
    saveBankData(data);
    return true;
};

// --- Tree Manipulation Functions ---

export const addNewNode = (parentId: string, type: 'chapter' | 'lesson', title: string): boolean => {
    const data = getBankData();
    let parentFound = false;

    const traverse = (nodes: BankNode[]) => {
        for (const node of nodes) {
            if (node.id === parentId) {
                if (!node.children) node.children = [];
                const newNode: BankNode = {
                    id: `${node.id}_${Date.now().toString(36)}`,
                    title: title,
                    type: type,
                    children: [],
                    questions: [],
                    figures: []
                };
                node.children.push(newNode);
                parentFound = true;
                return;
            }
            if (node.children) {
                traverse(node.children);
                if (parentFound) return;
            }
        }
    };

    traverse(data);
    if (parentFound) saveBankData(data);
    return parentFound;
};

export const editNodeTitle = (nodeId: string, newTitle: string): boolean => {
    const data = getBankData();
    let nodeFound = false;

    const traverse = (nodes: BankNode[]) => {
        for (const node of nodes) {
            if (node.id === nodeId) {
                node.title = newTitle;
                nodeFound = true;
                return;
            }
            if (node.children) {
                traverse(node.children);
                if (nodeFound) return;
            }
        }
    };
    
    traverse(data);
    if (nodeFound) saveBankData(data);
    return nodeFound;
};

export const deleteNode = (nodeId: string): boolean => {
    const data = getBankData();
    let deleted = false;

    // Helper to find parent array and splice
    const traverse = (nodes: BankNode[]): boolean => {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === nodeId) {
                nodes.splice(i, 1);
                deleted = true;
                return true;
            }
            if (nodes[i].children) {
                if (traverse(nodes[i].children!)) return true;
            }
        }
        return false;
    };

    traverse(data);
    if (deleted) saveBankData(data);
    return deleted;
}

// --- TikZ Figure Functions ---

export const saveFigureToLesson = (lessonId: string, name: string, tikzCode: string, imageBase64?: string): boolean => {
    const data = getBankData();
    let saved = false;

    const traverse = (nodes: BankNode[]) => {
        for (const node of nodes) {
            if (node.id === lessonId && node.type === 'lesson') {
                if (!node.figures) node.figures = [];
                const newFigure: BankFigure = {
                    id: Date.now().toString(),
                    name,
                    tikzCode,
                    originalImage: imageBase64,
                    timestamp: Date.now()
                };
                node.figures.push(newFigure);
                saved = true;
                return;
            }
            if (node.children) {
                traverse(node.children);
                if (saved) return;
            }
        }
    };

    traverse(data);
    if (saved) saveBankData(data);
    return saved;
};

/**
 * Smartly splits a large LaTeX content into individual questions.
 * Supports:
 * 1. \begin{ex} ... \end{ex} (often used in LaTeX exam packages)
 * 2. Câu 1... Câu 2...
 * 3. Bài 1... Bài 2...
 */
export const smartSplitContent = (text: string): string[] => {
    const questions: string[] = [];
    const normalized = text.replace(/\r\n/g, '\n');

    // Strategy: Identify start indices of questions, then slice the text.
    // We prioritize \begin{ex} environment if present as it's more structured.
    
    // Regex for finding start of questions
    // Matches:
    // 1. \begin{ex}
    // 2. Start of line (or file) followed by "Câu" + Number + punctuation
    // 3. Start of line (or file) followed by "Bài" + Number + punctuation
    const regex = /(\\begin\s*\{ex\}|(?:\n|^)(?:Câu|Bài)\s+[\dIVX]+[.:])/gi;
    
    let match;
    const indices: number[] = [];
    
    while ((match = regex.exec(normalized)) !== null) {
        // If it's "Câu/Bài", we want the index to be the start of that word (ignoring the preceding newline if matched)
        let idx = match.index;
        if (normalized[idx] === '\n') idx++; 
        indices.push(idx);
    }

    if (indices.length === 0) {
        return [text]; // No structure found, return whole text
    }

    for (let i = 0; i < indices.length; i++) {
        const start = indices[i];
        const end = indices[i + 1] ? indices[i + 1] : normalized.length;
        
        let qContent = normalized.substring(start, end).trim();
        
        // Clean up: If a question block starts with \begin{ex}, ensure we try to capture associated solution if it's outside
        // But the simple slice method above captures everything UNTIL the next question, 
        // which usually includes the solution text (Lời giải...) if it's placed between questions.
        
        if (qContent.length > 0) {
            questions.push(qContent);
        }
    }

    return questions;
};