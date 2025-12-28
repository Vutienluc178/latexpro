import React, { useState, useEffect, useRef } from 'react';
import { Folder, FileImage, Plus, Edit2, Trash2, ChevronRight, ChevronDown, Save, X, Image as ImageIcon, Wand2, Loader2, Copy, Check, Type, Eye } from 'lucide-react';
import { BankNode, BankFigure } from '../types';
import { getBankData, addNewNode, editNodeTitle, deleteNode, saveFigureToLesson } from '../services/bankService';
import { generateTikzFromImage, generateTikzFromDescription } from '../services/gemini';
import { getTikzImageUrl } from '../utils/converter';

interface TikzLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode: (code: string) => void;
}

export const TikzLibraryModal: React.FC<TikzLibraryModalProps> = ({ isOpen, onClose, onInsertCode }) => {
  const [bankData, setBankData] = useState<BankNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<BankNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['grade_10', 'grade_11', 'grade_12']));
  
  // Tree Manipulation State
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [addingToNodeId, setAddingToNodeId] = useState<string | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState("");

  // TikZ Generation State
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTikz, setGeneratedTikz] = useState("");
  const [figureName, setFigureName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = () => {
    setBankData(getBankData());
    // Re-select current node if it exists to update figures list
    if (selectedNode) {
        const freshData = getBankData();
        // Traverse to find the updated node
        const findNode = (nodes: BankNode[]): BankNode | null => {
            for (const n of nodes) {
                if (n.id === selectedNode.id) return n;
                if (n.children) {
                    const found = findNode(n.children);
                    if (found) return found;
                }
            }
            return null;
        }
        const updated = findNode(freshData);
        if (updated) setSelectedNode(updated);
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedNodes(newSet);
  };

  // --- Tree Actions ---

  const handleAddNode = () => {
      if (!addingToNodeId || !newNodeTitle.trim()) return;
      const type = addingToNodeId.includes('grade') ? 'chapter' : 'lesson';
      if (addNewNode(addingToNodeId, type, newNodeTitle)) {
          refreshData();
          setAddingToNodeId(null);
          setNewNodeTitle("");
          // Expand the parent
          setExpandedNodes(prev => new Set(prev).add(addingToNodeId));
      }
  };

  const handleEditNode = () => {
      if (!editingNodeId || !editTitle.trim()) return;
      if (editNodeTitle(editingNodeId, editTitle)) {
          refreshData();
          setEditingNodeId(null);
          setEditTitle("");
      }
  };

  const handleDeleteNode = (id: string) => {
      if (window.confirm("Bạn có chắc chắn muốn xóa mục này và toàn bộ nội dung bên trong?")) {
          if (deleteNode(id)) {
              if (selectedNode?.id === id) setSelectedNode(null);
              refreshData();
          }
      }
  };

  // --- TikZ Actions ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const result = ev.target?.result as string;
          setUploadedImage(result);
          setFigureName(file.name.replace(/\.[^/.]+$/, ""));
      };
      reader.readAsDataURL(file);
  };

  const handleGenerateTikz = async () => {
      setIsGenerating(true);
      try {
          let code = "";
          if (activeTab === 'image') {
            if (!uploadedImage) return;
            const base64 = uploadedImage.split(',')[1];
            const mimeType = uploadedImage.match(/data:([^;]+);/)?.[1] || 'image/png';
            code = await generateTikzFromImage(base64, mimeType);
          } else {
            if (!textPrompt.trim()) return;
            code = await generateTikzFromDescription(textPrompt);
            if (!figureName) setFigureName("Hinh_tu_mo_ta");
          }
          setGeneratedTikz(code);
      } catch (e) {
          alert("Lỗi khi tạo mã TikZ. Vui lòng thử lại.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleSaveFigure = () => {
      if (!selectedNode || selectedNode.type !== 'lesson') return;
      if (!generatedTikz.trim() || !figureName.trim()) {
          alert("Vui lòng nhập tên và mã TikZ.");
          return;
      }

      if (saveFigureToLesson(selectedNode.id, figureName, generatedTikz, activeTab === 'image' ? uploadedImage || undefined : undefined)) {
          refreshData();
          // Reset fields but keep active tab
          setUploadedImage(null);
          setGeneratedTikz("");
          setFigureName("");
          setTextPrompt("");
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
  };

  // --- Render Helpers ---

  const renderTree = (nodes: BankNode[], level = 0) => {
      return nodes.map(node => (
          <div key={node.id} className="select-none">
              <div 
                  className={`flex items-center gap-1 py-1.5 px-2 hover:bg-slate-100 rounded cursor-pointer group ${selectedNode?.id === node.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                  style={{ paddingLeft: `${level * 16 + 8}px` }}
                  onClick={() => {
                      if (editingNodeId !== node.id && addingToNodeId !== node.id) {
                         setSelectedNode(node);
                      }
                  }}
              >
                  {node.children && node.children.length > 0 ? (
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}>
                          {expandedNodes.has(node.id) ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                      </button>
                  ) : <span className="w-3.5" />}
                  
                  {/* Icon */}
                  {node.type === 'grade' && <Folder size={14} className="text-amber-500 fill-amber-100" />}
                  {node.type === 'chapter' && <Folder size={14} className="text-blue-500" />}
                  {node.type === 'lesson' && <FileImage size={14} className="text-emerald-500" />}

                  {/* Title or Edit Input */}
                  {editingNodeId === node.id ? (
                      <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                          <input 
                              autoFocus
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="text-xs px-1 py-0.5 border rounded w-full"
                              onKeyDown={e => e.key === 'Enter' && handleEditNode()}
                          />
                          <button onClick={handleEditNode} className="text-green-600"><Check size={14}/></button>
                          <button onClick={() => setEditingNodeId(null)} className="text-red-500"><X size={14}/></button>
                      </div>
                  ) : (
                      <span className="truncate flex-1 text-sm">{node.title}</span>
                  )}

                  {/* Action Buttons (Show on Hover) */}
                  <div className="hidden group-hover:flex items-center gap-1">
                      {node.type !== 'lesson' && (
                          <button title="Thêm mục con" onClick={(e) => { e.stopPropagation(); setAddingToNodeId(node.id); }} className="text-slate-400 hover:text-green-600">
                              <Plus size={12} />
                          </button>
                      )}
                      <button title="Sửa tên" onClick={(e) => { e.stopPropagation(); setEditingNodeId(node.id); setEditTitle(node.title); }} className="text-slate-400 hover:text-blue-600">
                          <Edit2 size={12} />
                      </button>
                      {node.type !== 'grade' && (
                          <button title="Xóa" onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }} className="text-slate-400 hover:text-red-600">
                              <Trash2 size={12} />
                          </button>
                      )}
                  </div>
              </div>

              {/* Add New Node Input */}
              {addingToNodeId === node.id && (
                  <div className="flex items-center gap-1 py-1 pr-2 my-1 bg-slate-50" style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}>
                      <input 
                          autoFocus
                          placeholder="Nhập tên mục mới..."
                          value={newNodeTitle}
                          onChange={e => setNewNodeTitle(e.target.value)}
                          className="text-xs px-2 py-1 border rounded w-full"
                          onKeyDown={e => e.key === 'Enter' && handleAddNode()}
                      />
                      <button onClick={handleAddNode} className="text-green-600 p-1 hover:bg-white rounded border"><Check size={12}/></button>
                      <button onClick={() => setAddingToNodeId(null)} className="text-red-500 p-1 hover:bg-white rounded border"><X size={12}/></button>
                  </div>
              )}

              {/* Recursive Children */}
              {expandedNodes.has(node.id) && node.children && (
                  <div>{renderTree(node.children, level + 1)}</div>
              )}
          </div>
      ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <FileImage size={20} />
                Thư viện Hình vẽ & TikZ
            </h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar: Tree View */}
            <div className="w-1/3 md:w-1/4 border-r border-slate-200 bg-slate-50 flex flex-col">
                <div className="p-3 border-b border-slate-200 font-semibold text-slate-700 text-sm">
                    Cấu trúc chương trình
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {renderTree(bankData)}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {selectedNode ? (
                    selectedNode.type === 'lesson' ? (
                        <div className="flex flex-col h-full">
                            
                            {/* Toolbar/Upload Area */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4 shrink-0">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{selectedNode.title}</h4>
                                    <p className="text-xs text-slate-500">Quản lý và tạo mã TikZ cho bài học này</p>
                                </div>
                                
                                {/* Mode Switcher */}
                                <div className="flex gap-4 border-b border-slate-200 mb-2">
                                    <button 
                                        onClick={() => setActiveTab('image')}
                                        className={`pb-2 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'image' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <ImageIcon size={16}/> Từ hình ảnh
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('text')}
                                        className={`pb-2 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'text' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Type size={16}/> Mô tả bằng lời
                                    </button>
                                </div>

                                <div className="flex gap-4 items-start">
                                    {/* Input Area */}
                                    <div className="flex-1">
                                        
                                        <div className="flex gap-2 mb-3">
                                            {activeTab === 'image' ? (
                                                <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
                                                    <ImageIcon size={16} className="text-violet-600"/>
                                                    {uploadedImage ? "Đổi ảnh khác" : "Tải ảnh mẫu lên"}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={handleImageUpload}
                                                        ref={fileInputRef}
                                                    />
                                                </label>
                                            ) : (
                                                <input 
                                                    type="text"
                                                    value={textPrompt}
                                                    onChange={(e) => setTextPrompt(e.target.value)}
                                                    placeholder="VD: Vẽ hình chóp S.ABCD đáy hình vuông, SA vuông góc đáy..."
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateTikz()}
                                                />
                                            )}

                                            <button 
                                                onClick={handleGenerateTikz}
                                                disabled={isGenerating || (activeTab === 'image' && !uploadedImage) || (activeTab === 'text' && !textPrompt.trim())}
                                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg shadow-sm hover:bg-violet-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                                                {isGenerating ? "Đang tạo..." : "Tạo TikZ"}
                                            </button>
                                        </div>

                                        {/* Result & Live Preview Area */}
                                        {(generatedTikz || uploadedImage) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                
                                                {/* Left: Code Editor */}
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-slate-500 font-bold uppercase">Mã LaTeX/TikZ</span>
                                                        {activeTab === 'image' && uploadedImage && (
                                                             <span className="text-xs text-violet-600 flex items-center gap-1 cursor-pointer" onClick={() => {
                                                                 const w = window.open("");
                                                                 w?.document.write(`<img src="${uploadedImage}" />`);
                                                             }}><ImageIcon size={12}/> Xem ảnh gốc</span>
                                                        )}
                                                    </div>
                                                    <textarea 
                                                        value={generatedTikz}
                                                        onChange={(e) => setGeneratedTikz(e.target.value)}
                                                        placeholder="Mã TikZ sẽ hiện ở đây..."
                                                        className="w-full h-40 text-xs font-mono border border-slate-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-violet-500 outline-none shadow-sm"
                                                    />
                                                    
                                                    {/* Save Controls */}
                                                    <div className="flex gap-2">
                                                        <input 
                                                            value={figureName}
                                                            onChange={(e) => setFigureName(e.target.value)}
                                                            placeholder="Đặt tên hình (VD: H.1)"
                                                            className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-violet-500"
                                                        />
                                                        <button 
                                                            onClick={handleSaveFigure}
                                                            disabled={!generatedTikz.trim()}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                                                        >
                                                            <Save size={16}/> Lưu
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Right: Live Preview */}
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">
                                                            <Eye size={12}/> Xem trước (Live Preview)
                                                        </span>
                                                    </div>
                                                    <div className="h-40 md:h-[11.5rem] bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                                                        {generatedTikz ? (
                                                            <img 
                                                                src={getTikzImageUrl(generatedTikz)} 
                                                                alt="Live Preview"
                                                                className="max-w-full max-h-full p-2"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                    (e.target as HTMLImageElement).parentElement!.innerHTML += '<span class="text-xs text-red-500 p-2 text-center">Lỗi hiển thị preview.<br/>Vui lòng kiểm tra cú pháp TikZ.</span>';
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-slate-400">Chưa có mã để xem trước</span>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Figures List */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-100">
                                <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <FileImage size={16}/> Hình vẽ đã lưu ({selectedNode.figures?.length || 0})
                                </h5>
                                
                                {selectedNode.figures && selectedNode.figures.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {selectedNode.figures.map((fig: BankFigure) => (
                                            <div key={fig.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-slate-800 text-sm truncate" title={fig.name}>{fig.name}</span>
                                                    <span className="text-xs text-slate-400">{new Date(fig.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                
                                                <div className="h-32 bg-slate-50 rounded border border-slate-100 flex items-center justify-center overflow-hidden mb-2 relative">
                                                     {/* Simple Preview using existing helper */}
                                                     <img 
                                                        src={getTikzImageUrl(fig.tikzCode)} 
                                                        alt="Preview" 
                                                        className="max-w-full max-h-full"
                                                        loading="lazy"
                                                     />
                                                     {/* Show original image on hover overlay if available */}
                                                     {fig.originalImage && (
                                                         <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                                                             <img src={fig.originalImage} className="max-w-full max-h-full object-contain p-2" alt="Original"/>
                                                             <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">Gốc</span>
                                                         </div>
                                                     )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => onInsertCode(fig.tikzCode)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded text-xs font-medium"
                                                    >
                                                        <Copy size={12}/> Chèn vào bài
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setGeneratedTikz(fig.tikzCode);
                                                            setFigureName(fig.name);
                                                            // Switch to image tab if original image exists to show context, otherwise text tab logic could apply but image is safer default
                                                            if (fig.originalImage) {
                                                                setUploadedImage(fig.originalImage);
                                                                setActiveTab('image');
                                                            }
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded border border-transparent hover:border-blue-200 transition-colors"
                                                        title="Sửa lại"
                                                    >
                                                        <Edit2 size={14}/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-400">
                                        Chưa có hình vẽ nào được lưu cho bài học này.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
                            <Folder size={48} className="text-slate-200" />
                            <p>Chọn một <strong>Bài học</strong> để xem và thêm hình vẽ.</p>
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
                        <ChevronDown size={48} className="text-slate-200" />
                        <p>Chọn một mục từ cây thư mục bên trái.</p>
                    </div>
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