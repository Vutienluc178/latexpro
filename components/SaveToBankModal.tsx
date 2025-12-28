import React, { useState, useEffect } from 'react';
import { Save, FolderPlus, Check, X, ChevronRight, Book, GraduationCap, LayoutList, Split, FileText, CheckSquare, Square, Layers } from 'lucide-react';
import { getBankData, saveToBank, smartSplitContent } from '../services/bankService';
import { BankNode } from '../types';

interface SaveToBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

type SaveMode = 'full' | 'split';

export const SaveToBankModal: React.FC<SaveToBankModalProps> = ({ isOpen, onClose, content }) => {
  const [bankData, setBankData] = useState<BankNode[]>([]);
  
  // Selection State
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  
  // Logic State
  const [saveMode, setSaveMode] = useState<SaveMode>('split'); // Default to split if possible
  const [detectedQuestions, setDetectedQuestions] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
        setBankData(getBankData());
        setIsSaved(false);
        setSaveCount(0);
        
        // Analyze content
        const questions = smartSplitContent(content);
        setDetectedQuestions(questions);
        
        // Select all by default
        const allIndices = new Set(questions.map((_, i) => i));
        setSelectedIndices(allIndices);

        // If only 1 chunk found, maybe default to full save mode (UI preference), 
        // but keeping it uniform is often better.
        if (questions.length <= 1) {
            setSaveMode('full');
        } else {
            setSaveMode('split');
        }

        // Reset selections if needed, or keep them if user wants to save multiple times
        // setSelectedGrade(''); setSelectedChapter(''); setSelectedLesson('');
    }
  }, [isOpen, content]);

  const toggleIndex = (index: number) => {
      const newSet = new Set(selectedIndices);
      if (newSet.has(index)) {
          newSet.delete(index);
      } else {
          newSet.add(index);
      }
      setSelectedIndices(newSet);
  };

  const toggleAll = () => {
      if (selectedIndices.size === detectedQuestions.length) {
          setSelectedIndices(new Set());
      } else {
          setSelectedIndices(new Set(detectedQuestions.map((_, i) => i)));
      }
  };

  const handleSave = () => {
      if (!selectedGrade || !selectedChapter || !selectedLesson) {
          alert("Vui lòng chọn đầy đủ Khối lớp, Chương và Bài học.");
          return;
      }

      let successCount = 0;

      if (saveMode === 'full') {
          if (saveToBank(selectedGrade, selectedChapter, selectedLesson, content)) {
              successCount = 1;
          }
      } else {
          // Save selected chunks
          detectedQuestions.forEach((q, idx) => {
              if (selectedIndices.has(idx)) {
                  if (saveToBank(selectedGrade, selectedChapter, selectedLesson, q)) {
                      successCount++;
                  }
              }
          });
      }

      if (successCount > 0) {
          setSaveCount(successCount);
          setIsSaved(true);
          setTimeout(() => {
              onClose();
          }, 2000);
      } else {
          alert("Lỗi khi lưu. Vui lòng thử lại.");
      }
  };

  if (!isOpen) return null;

  // Helper to get active lists based on selection
  const activeGrade = bankData.find(g => g.id === selectedGrade);
  const activeChapter = activeGrade?.children?.find(c => c.id === selectedChapter);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <FolderPlus size={20} />
                Lưu vào Ngân hàng Câu hỏi
            </h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Body Container - Flex Row for Desktop */}
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            
            {/* LEFT SIDE: Navigation Tree (30%) */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 flex flex-col h-1/2 lg:h-full">
                <div className="p-3 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 text-sm flex items-center gap-2">
                    <Layers size={16}/> Chọn vị trí lưu
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                     {/* Column 1: Grade */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                            <GraduationCap size={14} /> Khối Lớp
                        </label>
                        <div className="space-y-1">
                            {bankData.map(grade => (
                                <button
                                    key={grade.id}
                                    onClick={() => {
                                        setSelectedGrade(grade.id);
                                        setSelectedChapter('');
                                        setSelectedLesson('');
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all flex justify-between items-center ${
                                        selectedGrade === grade.id 
                                        ? 'bg-emerald-600 text-white shadow-md' 
                                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                                    }`}
                                >
                                    {grade.title}
                                    {selectedGrade === grade.id && <ChevronRight size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Chapter */}
                    {selectedGrade && (
                    <div className="space-y-1 animate-in slide-in-from-left-2 duration-300">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                            <Book size={14} /> Chương
                        </label>
                        <div className="space-y-1">
                            {activeGrade?.children?.map(chapter => (
                                <button
                                    key={chapter.id}
                                    onClick={() => {
                                        setSelectedChapter(chapter.id);
                                        setSelectedLesson('');
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all flex justify-between items-center ${
                                        selectedChapter === chapter.id 
                                        ? 'bg-teal-600 text-white shadow-md' 
                                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                                    }`}
                                >
                                    <span className="truncate">{chapter.title}</span>
                                    {selectedChapter === chapter.id && <ChevronRight size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Column 3: Lesson */}
                    {selectedChapter && (
                    <div className="space-y-1 animate-in slide-in-from-left-2 duration-300">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                            <LayoutList size={14} /> Bài học
                        </label>
                        <div className="space-y-1">
                             {activeChapter?.children?.map(lesson => (
                                <button
                                    key={lesson.id}
                                    onClick={() => setSelectedLesson(lesson.id)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all flex justify-between items-center ${
                                        selectedLesson === lesson.id 
                                        ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-200' 
                                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                                    }`}
                                >
                                    <span className="truncate">{lesson.title}</span>
                                    {selectedLesson === lesson.id && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDE: Content Preview (70%) */}
            <div className="w-full lg:w-2/3 flex flex-col h-1/2 lg:h-full bg-slate-50/50">
                
                {/* Mode Tabs */}
                <div className="flex border-b border-slate-200 bg-white">
                    <button
                        onClick={() => setSaveMode('split')}
                        className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                            saveMode === 'split' 
                            ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <Split size={16} /> Tách câu hỏi tự động ({detectedQuestions.length})
                    </button>
                    <button
                        onClick={() => setSaveMode('full')}
                        className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                            saveMode === 'full' 
                            ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <FileText size={16} /> Lưu toàn bộ văn bản
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-100">
                    
                    {saveMode === 'full' ? (
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed overflow-x-auto">
                                {content}
                            </pre>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-xs text-slate-500 font-medium">
                                    Đã chọn: <span className="text-emerald-600">{selectedIndices.size}</span> / {detectedQuestions.length} câu
                                </span>
                                <button 
                                    onClick={toggleAll}
                                    className="text-xs text-blue-600 hover:underline font-medium"
                                >
                                    {selectedIndices.size === detectedQuestions.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                </button>
                            </div>

                            {detectedQuestions.map((q, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => toggleIndex(idx)}
                                    className={`group cursor-pointer rounded-lg border transition-all duration-200 p-3 flex gap-3 ${
                                        selectedIndices.has(idx)
                                        ? 'bg-white border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                                        : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-white'
                                    }`}
                                >
                                    <div className={`mt-0.5 shrink-0 transition-colors ${selectedIndices.has(idx) ? 'text-emerald-600' : 'text-slate-300 group-hover:text-emerald-400'}`}>
                                        {selectedIndices.has(idx) ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold uppercase ${selectedIndices.has(idx) ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                Câu hỏi {idx + 1}
                                            </span>
                                            {q.includes('\\begin{tikzpicture}') && (
                                                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                                                    Có hình vẽ
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-600 font-mono line-clamp-3 bg-slate-50/50 p-1.5 rounded border border-slate-100 group-hover:bg-white">
                                            {q}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {detectedQuestions.length === 0 && (
                                <div className="text-center py-10 text-slate-400">
                                    Không phát hiện cấu trúc câu hỏi (Câu X, Bài X, {'\\begin{ex}'}).<br/>
                                    Vui lòng chuyển sang chế độ "Lưu toàn bộ".
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>

        {/* Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex justify-between items-center shrink-0 z-10">
             <div className="text-xs text-slate-500 hidden md:block">
                 {selectedLesson ? (
                     <span className="text-emerald-600 font-medium flex items-center gap-1">
                         <Check size={12}/> Sẽ lưu vào: {activeGrade?.title} {'>'} {activeChapter?.title} {'>'} <span className="underline">{activeChapter?.children?.find(l => l.id === selectedLesson)?.title}</span>
                     </span>
                 ) : "Chưa chọn bài học"}
             </div>

             <div className="flex gap-3 w-full md:w-auto justify-end">
                {isSaved ? (
                     <div className="flex items-center gap-2 text-emerald-600 font-bold animate-in fade-in slide-in-from-bottom-2 bg-emerald-50 px-4 py-2 rounded-lg">
                         <Check size={18} /> Đã lưu {saveCount} câu hỏi!
                     </div>
                 ) : (
                    <>
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        >
                            Hủy
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!selectedLesson || (saveMode === 'split' && selectedIndices.size === 0)}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save size={16} />
                            {saveMode === 'full' ? 'Lưu Toàn Bộ' : `Lưu ${selectedIndices.size} Câu`}
                        </button>
                    </>
                 )}
             </div>
        </div>

      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}</style>
    </div>
  );
};