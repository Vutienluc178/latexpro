import React, { useState } from 'react';
import { FileSpreadsheet, X, Loader2, Sparkles, GraduationCap, BookOpen, Target, Settings2, CheckCircle2 } from 'lucide-react';
import { createWorksheet } from '../services/gemini';

interface WorksheetGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertContent: (content: string) => void;
}

export const WorksheetGeneratorModal: React.FC<WorksheetGeneratorModalProps> = ({ isOpen, onClose, onInsertContent }) => {
  const [grade, setGrade] = useState("10");
  const [lesson, setLesson] = useState("");
  const [level, setLevel] = useState<'weak' | 'average' | 'good' | 'assessment'>('average');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!lesson.trim()) {
        alert("Vui lòng nhập tên bài học.");
        return;
    }
    
    setIsGenerating(true);
    try {
        const result = await createWorksheet(grade, lesson, level, includeAnswerKey);
        onInsertContent(result);
        onClose();
    } catch (e) {
        alert("Có lỗi xảy ra khi tạo phiếu. Vui lòng thử lại.");
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileSpreadsheet size={20} />
            Thiết kế Phiếu Học Tập (GDPT 2018)
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
            
            {/* Grade Selection */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap size={16} className="text-orange-500"/> Khối Lớp
                </label>
                <select 
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none text-sm"
                >
                    <option value="6">Lớp 6 (THCS)</option>
                    <option value="7">Lớp 7 (THCS)</option>
                    <option value="8">Lớp 8 (THCS)</option>
                    <option value="9">Lớp 9 (THCS)</option>
                    <option value="10">Lớp 10 (THPT)</option>
                    <option value="11">Lớp 11 (THPT)</option>
                    <option value="12">Lớp 12 (THPT)</option>
                </select>
            </div>

            {/* Lesson Name */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <BookOpen size={16} className="text-orange-500"/> Tên Bài Học
                </label>
                <input 
                    type="text"
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    placeholder="VD: Phương trình bậc hai một ẩn, Hàm số lượng giác..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none text-sm"
                    autoFocus
                />
            </div>

            {/* Level / Purpose */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Target size={16} className="text-orange-500"/> Đối tượng / Mục tiêu
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                        onClick={() => setLevel('weak')}
                        className={`p-3 rounded-lg border text-left text-sm transition-all ${level === 'weak' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                    >
                        <div className="font-bold mb-1">Học sinh Yếu - TB</div>
                        <div className="text-xs opacity-80">Có gợi ý, câu hỏi ngắn, chia nhỏ vấn đề.</div>
                    </button>
                    <button 
                        onClick={() => setLevel('average')}
                        className={`p-3 rounded-lg border text-left text-sm transition-all ${level === 'average' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                    >
                        <div className="font-bold mb-1">Trung bình - Khá</div>
                        <div className="text-xs opacity-80">Cơ bản, trọng tâm, giải thích cách làm.</div>
                    </button>
                    <button 
                        onClick={() => setLevel('good')}
                        className={`p-3 rounded-lg border text-left text-sm transition-all ${level === 'good' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                    >
                        <div className="font-bold mb-1">Khá - Giỏi</div>
                        <div className="text-xs opacity-80">Mở rộng, phản biện, tư duy sâu.</div>
                    </button>
                    <button 
                        onClick={() => setLevel('assessment')}
                        className={`p-3 rounded-lg border text-left text-sm transition-all ${level === 'assessment' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                    >
                        <div className="font-bold mb-1">Kiểm tra Đánh giá</div>
                        <div className="text-xs opacity-80">Kèm tiêu chí đánh giá năng lực.</div>
                    </button>
                </div>
            </div>

            {/* Answer Key Toggle */}
             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <button 
                    onClick={() => setIncludeAnswerKey(!includeAnswerKey)}
                    className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${includeAnswerKey ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}
                >
                    {includeAnswerKey && <CheckCircle2 size={14} />}
                </button>
                <div className="text-sm cursor-pointer" onClick={() => setIncludeAnswerKey(!includeAnswerKey)}>
                    <span className="font-semibold text-slate-700">Kèm Hướng Dẫn Chấm & Kiểm Chứng</span>
                    <p className="text-xs text-slate-500">AI sẽ tự giải và kiểm tra lại đáp án (Giả lập Wolfram/Python) để đảm bảo độ chính xác.</p>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
            >
                Hủy bỏ
            </button>
            <button 
                onClick={handleGenerate}
                disabled={isGenerating || !lesson.trim()}
                className="px-5 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                {isGenerating ? "Đang tư duy & Thiết kế..." : "Tạo Phiếu Ngay"}
            </button>
        </div>
      </div>
    </div>
  );
};