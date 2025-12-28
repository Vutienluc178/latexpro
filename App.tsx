import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Download, FileText, Settings, Sparkles, RefreshCcw, FileCode, Type, Image as ImageIcon, FileWarning, Loader2, ChevronDown, Printer, FileInput, BookOpen, Check, Columns, Monitor, ZoomIn, PenTool, Grid, ScanLine, CircleHelp, X, Phone, User, GraduationCap, RotateCcw, Wand2, Plus, Calculator, Languages, Brain, Eraser, Save, Replace, FolderTree, FileSpreadsheet } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { parseContent, generateWordCompatibleFile, getTikzImageUrl, preprocessLatexExam } from './utils/converter';
import { MathPreview } from './components/MathPreview';
import { GeminiChat } from './components/GeminiChat';
import { analyzeImagesToLatex, generateExamQuestion, transformLatexContent } from './services/gemini';
import { ExportStyle } from './types';
import { SaveToBankModal } from './components/SaveToBankModal';
import { TikzLibraryModal } from './components/TikzLibraryModal';
import { WorksheetGeneratorModal } from './components/WorksheetGeneratorModal';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

export default function App() {
  const [rawText, setRawText] = useState<string>(
`BỘ GIÁO DỤC VÀ ĐÀO TẠO          KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG
ĐỀ CHÍNH THỨC                   LẦN 2 NĂM 2021
(Đề gồm 05 trang)               Bài thi: TOÁN
                                Thời gian làm bài: 90 phút | Mã đề thi: 101

Câu 1: Tiệm cận ngang của đồ thị hàm số $y = \\frac{4x-1}{x+1}$ là đường thẳng có phương trình
A. $y = -4$.      B. $y = 1$.      C. $y = 4$.      D. $y = -1$.

Câu 2: Cho hàm số $y = ax^4 + bx^2 + c$ $(a,b,c \\in \\mathbb{R})$ có đồ thị là đường cong trong hình bên. Điểm cực đại của hàm số đã cho là
\\begin{tikzpicture}
\\draw[-stealth] (-2.5,0) -- (2.5,0) node[below] {$x$};
\\draw[-stealth] (0,-2.5) -- (0,1.5) node[left] {$y$};
\\draw[fill=white] (0,0) circle (1pt) node[below left] {$O$};
\\draw[dashed] (-1,0) node[above] {$-1$} -- (-1,-2);
\\draw[dashed] (1,0) node[above] {$1$} -- (1,-2) -- (0,-2) node[left] {$-2$};
\\draw[smooth, samples=100, domain=-1.6:1.6, thick] plot(\\x, {(\\x)^4 - 2*(\\x)^2 - 1});
\\node[left] at (0,-1) {$-1$};
\\end{tikzpicture}
A. $x = 1$.      B. $x = -1$.      C. $x = -2$.      D. $x = 0$.

Câu 3: Với mọi số thực $a$ dương, $\\log_4(4a)$ bằng
A. $1 + \\log_4 a$.      B. $1 - \\log_4 a$.      C. $\\log_4 a$.      D. $4\\log_4 a$.

Câu 4: Bảng biến thiên (Mới cập nhật):
\\begin{tikzpicture}
    % Cài đặt chung
    \\tikzset{
        hlabel/.style={yshift=0.2cm}, % Chỉnh vị trí nhãn dòng
        arrow_style/.style={->, >=stealth, smooth}
    }
    
    % Khai báo kích thước
    \\def\\width{10}
    \\def\\height{4}
    \\def\\colOne{1.5} % Độ rộng cột tiêu đề
    
    % Vẽ khung bảng
    \\draw[semithick] (0,0) rectangle (\\width,-\\height);
    
    % Vẽ các đường kẻ ngang
    \\draw[semithick] (0,-1) -- (\\width,-1); % Dòng phân cách x và y'
    \\draw[semithick] (0,-2) -- (\\width,-2); % Dòng phân cách y' và y
    
    % Vẽ đường kẻ dọc (cột tiêu đề)
    \\draw[semithick] (\\colOne,0) -- (\\colOne,-\\height);
    
    % Nhãn tiêu đề
    \\node at (\\colOne/2, -0.5) {$x$};
    \\node at (\\colOne/2, -1.5) {$y'$};
    \\node at (\\colOne/2, -3.0) {$y$};
    
    % --- DÒNG X ---
    % Tọa độ các điểm trên trục x
    \\coordinate (X_min) at (\\colOne+1, -0.5);
    \\coordinate (X_mid) at (\\colOne + (\\width-\\colOne)/2, -0.5);
    \\coordinate (X_max) at (\\width-1, -0.5);
    
    % Điền giá trị x
    \\node at (X_min) {$-\\infty$};
    \\node at (X_mid) {$\\dfrac{1}{2}$};
    \\node at (X_max) {$+\\infty$};
    
    % --- Kẻ đường tiệm cận đứng (x = 1/2) ---
    % Đường đôi (double line)
    \\draw[double distance=2pt, semithick] (\\colOne + (\\width-\\colOne)/2, -1) -- (\\colOne + (\\width-\\colOne)/2, -\\height);
    
    % --- DÒNG Y' ---
    % Dấu của đạo hàm (Luôn dương do y' > 0 với mọi x thuộc D)
    \\node at (\\colOne + (\\width-\\colOne)/4, -1.5) {$+$};
    \\node at (\\colOne + 3*(\\width-\\colOne)/4, -1.5) {$+$};
    
    % --- DÒNG Y (Vẽ mũi tên biến thiên) ---
    % Tính toán tọa độ cho mũi tên
    % Bên trái tiệm cận: Đồng biến từ -vc lên +vc
    \\coordinate (Y_left_start) at (\\colOne+0.8, -3.5); % Tại -vc
    \\coordinate (Y_left_end) at (\\colOne + (\\width-\\colOne)/2 - 0.3, -2.4); % Tại 1/2-
    
    % Bên phải tiệm cận: Đồng biến từ -vc lên +vc
    \\coordinate (Y_right_start) at (\\colOne + (\\width-\\colOne)/2 + 0.3, -3.5); % Tại 1/2+
    \\coordinate (Y_right_end) at (\\width-0.8, -2.4); % Tại +vc
    
    % Vẽ mũi tên
    \\draw[arrow_style] (Y_left_start) -- (Y_left_end);
    \\draw[arrow_style] (Y_right_start) -- (Y_right_end);
    
    % Điền giá trị giới hạn tại các đầu mút mũi tên
    \\node[anchor=south] at (Y_left_end) {$+\\infty$};
    \\node[anchor=north] at (Y_left_start) {$-\\infty$};
    
    \\node[anchor=south] at (Y_right_end) {$+\\infty$};
    \\node[anchor=north] at (Y_right_start) {$-\\infty$};

\\end{tikzpicture}`
  );
  const [fileName, setFileName] = useState("De_Thi_Toan_101");
  const [isImporting, setIsImporting] = useState(false);
  const [isRichText, setIsRichText] = useState(false);
  const [importStatus, setImportStatus] = useState<string>("");
  const [useSmartOCR, setUseSmartOCR] = useState(true); 
  const [isExporting, setIsExporting] = useState(false);
  
  // UI States
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false); // Modal Generator State
  const [isAdvancedMenuOpen, setIsAdvancedMenuOpen] = useState(false); // New Advanced Menu
  const [isSaveBankModalOpen, setIsSaveBankModalOpen] = useState(false); // New Save Bank Modal State
  const [isTikzLibraryOpen, setIsTikzLibraryOpen] = useState(false); // New TikZ Library State
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false); // New Worksheet Modal
  const [menuActionStatus, setMenuActionStatus] = useState<string | null>(null); // Status text for menu actions
  
  const [generatorPrompt, setGeneratorPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const advancedMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setIsExportMenuOpen(false);
        }
        if (advancedMenuRef.current && !advancedMenuRef.current.contains(event.target as Node)) {
            setIsAdvancedMenuOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Computed state for parsed content
  const segments = parseContent(rawText);

  // Helper to read file as Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data url prefix (e.g. "data:image/png;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  // Helper to convert PDF pages to Base64 Images for AI Analysis
  const convertPdfToImages = async (arrayBuffer: ArrayBuffer, maxPages = 5): Promise<{ mimeType: string, data: string }[]> => {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: { mimeType: string, data: string }[] = [];
      const numPages = Math.min(pdf.numPages, maxPages);

      for (let i = 1; i <= numPages; i++) {
          setImportStatus(`Rendering PDF Page ${i}/${numPages}...`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 }); // 1.5 scale is good balance for OCR
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
              await page.render({ canvasContext: context, viewport: viewport } as any).promise;
              const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
              images.push({ mimeType: 'image/jpeg', data: base64Data });
          }
      }
      return images;
  };

  // Legacy Text Extraction (Fast but poor math support)
  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `## Page ${i}\n\n${pageText}\n\n`;
    }
    return fullText;
  };

  // Handle File Upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus("Reading file...");
    setFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension

    try {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'docx') {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setRawText(result.value);
            setIsRichText(true);
            setImportStatus("");
        } 
        else if (extension === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            
            if (useSmartOCR) {
                // Advanced AI Path
                setImportStatus("Preparing Smart OCR...");
                const images = await convertPdfToImages(arrayBuffer);
                
                setImportStatus("Gemini AI is analyzing math formulas...");
                const transcribedText = await analyzeImagesToLatex(images);
                
                setRawText(transcribedText);
                setIsRichText(false); // AI returns Markdown/Latex
            } else {
                // Legacy Path
                setImportStatus("Extracting raw text...");
                const text = await extractTextFromPDF(arrayBuffer);
                setRawText(text);
                setIsRichText(false);
            }
            setImportStatus("");
        }
        else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
            setImportStatus("Analyzing image with Gemini AI...");
            const base64 = await readFileAsBase64(file);
            const mimeType = file.type;
            const transcribedText = await analyzeImagesToLatex([{ mimeType, data: base64 }]);
            setRawText(transcribedText);
            setIsRichText(false); // AI returns Markdown/Latex text
            setImportStatus("");
        }
        else if (extension === 'doc') {
             setImportStatus("Processing .doc file...");
             try {
                // Attempt 1: Try treating as docx
                const arrayBuffer = await file.arrayBuffer();
                try {
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    if (result.value) {
                        setRawText(result.value);
                        setIsRichText(true);
                        setImportStatus("");
                        return;
                    }
                } catch (e) {
                    // Not a docx/zip structure
                }

                // Attempt 2: Text read for XML/Text-based .doc
                const text = await file.text();
                if (text.charCodeAt(0) === 65533 || text.includes('\0')) {
                    throw new Error("Binary");
                }
                setRawText(text);
                setIsRichText(false);
                setImportStatus("");
             } catch (e) {
                 alert("File .doc này là định dạng cũ (Word 97-2003) chưa được hỗ trợ trên trình duyệt. \n\nVui lòng mở file bằng Word -> Chọn 'Save As' -> Chọn '.docx' và thử lại.");
                 setImportStatus("Error: Binary .doc");
             }
        }
        else if (extension === 'tex') {
            setImportStatus("Reading LaTeX file...");
            const text = await file.text();
            setRawText(text);
            setIsRichText(false);
            setImportStatus("");
        }
        else {
            alert("Unsupported file format.");
        }
    } catch (error) {
        console.error("Error reading file", error);
        alert(`Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`);
        setImportStatus("Error");
    } finally {
        setIsImporting(false);
        // Reset file input so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  }, [useSmartOCR]);

  // Handle Reset / Start Over
  const handleReset = useCallback(() => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ nội dung và làm mới không?")) {
        setRawText("");
        setFileName("document");
        setIsRichText(false);
        setImportStatus("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  }, []);

  // Handle AI Question Generation
  const handleGenerateQuestion = async () => {
    if (!generatorPrompt.trim()) return;
    setIsGenerating(true);
    try {
        const generatedContent = await generateExamQuestion(generatorPrompt);
        
        // Append to current text with double newlines
        setRawText(prev => prev + (prev.trim() ? "\n\n" : "") + generatedContent);
        
        setIsGeneratorOpen(false);
        setGeneratorPrompt("");
        
        // Scroll to bottom of textarea
        if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }

    } catch (e) {
        alert("Lỗi khi tạo câu hỏi. Vui lòng thử lại.");
    } finally {
        setIsGenerating(false);
    }
  };

  // Handle Advanced AI Transforms (Solve, Translate, Format, Polya)
  const handleAiTransform = async (mode: 'SOLVE' | 'TRANSLATE' | 'FORMAT' | 'POLYA') => {
      if (!rawText.trim()) return;
      setIsImporting(true); // Re-use importing state for loading overlay
      let actionText = "";
      if (mode === 'SOLVE') actionText = "Đang tạo lời giải...";
      if (mode === 'TRANSLATE') actionText = "Đang dịch thuật...";
      if (mode === 'FORMAT') actionText = "Đang chuẩn hóa...";
      if (mode === 'POLYA') actionText = "Đang tư duy theo G.Pólya...";
      
      setMenuActionStatus(actionText);
      setImportStatus(actionText); // Keep full overlay for long AI tasks
      setIsAdvancedMenuOpen(false);

      try {
          const newText = await transformLatexContent(rawText, mode);
          setRawText(newText);
      } catch (e) {
          alert("Gặp lỗi khi xử lý AI. Vui lòng thử lại.");
      } finally {
          setIsImporting(false);
          setImportStatus("");
          setMenuActionStatus(null);
      }
  };

  // Handle Local Tex To Word Conversion
  const handleTexToWord = () => {
      if (!rawText.trim()) {
          alert("Không có nội dung để chuyển đổi.");
          return;
      }
      
      setMenuActionStatus("Đang chuyển đổi...");
      setIsAdvancedMenuOpen(false);

      // Simulate a small delay for UX so user sees the indicator
      setTimeout(() => {
          try {
              const newText = preprocessLatexExam(rawText);
              setRawText(newText);
          } catch(e) {
              console.error(e);
              alert("Lỗi khi chuyển đổi.");
          } finally {
              setMenuActionStatus(null);
          }
      }, 600);
  };

  // Handle Export (Text/HTML + MathML + TikZ -> Word)
  const handleExport = useCallback(async (style: ExportStyle) => {
    setIsExporting(true);
    try {
        // 1. Pre-process TikZ segments: Fetch images and convert to Base64
        // Store meta-data: base64, width, height
        const tikzImagesMap: Record<string, { base64: string; width: number; height: number }> = {};
        const tikzSegments = segments.filter(s => s.type === 'tikz');

        if (tikzSegments.length > 0) {
            // Notify user
            // We can't use alert directly if we want a smooth UX, but proceed anyway.
        }

        await Promise.all(tikzSegments.map(async (segment) => {
            try {
                const imgUrl = getTikzImageUrl(segment.content, 'png'); // Request PNG for better Word compatibility
                const response = await fetch(imgUrl);
                const blob = await response.blob();
                
                // Get Base64 with prefix (DataURL)
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                
                // Calculate dimensions for correct aspect ratio preservation
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = base64;
                });

                if (img.naturalWidth > 0) {
                     tikzImagesMap[segment.content] = { 
                        base64, 
                        width: img.naturalWidth, 
                        height: img.naturalHeight 
                    };
                }
            } catch (e) {
                console.error("Failed to fetch TikZ image", e);
            }
        }));

        // 2. Generate Blob
        const blobResult = generateWordCompatibleFile(segments, isRichText, style, tikzImagesMap);
        const blob = blobResult instanceof Promise ? await blobResult : blobResult;
        
        // 3. Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Suffix based on style
        let suffix = "";
        if (style === 'minimal') suffix = "_print";
        if (style === 'worksheet') suffix = "_worksheet";
        if (style === 'notes') suffix = "_notes";
        if (style === 'two-column') suffix = "_exam";
        if (style === 'landscape') suffix = "_wide";
        if (style === 'large-print') suffix = "_access";
        if (style === 'draft') suffix = "_draft";
        if (style === 'flashcards') suffix = "_cards";

        // Set extension to .docx
        link.download = `${fileName}${suffix}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExportMenuOpen(false);
    } catch (e) {
        alert("Có lỗi xảy ra khi xuất file.");
        console.error(e);
    } finally {
        setIsExporting(false);
    }
  }, [segments, fileName, isRichText]);

  const ExportButton = ({ style, icon: Icon, title, sub, colorClass }: any) => (
      <button onClick={() => handleExport(style)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-left group">
        <div className={`p-2 rounded-md transition-colors ${colorClass}`}>
            <Icon size={16} />
        </div>
        <div>
            <div className="text-sm font-medium text-slate-800">{title}</div>
            <div className="text-xs text-slate-500">{sub}</div>
        </div>
      </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              MathDoc <span className="text-brand-600 font-light">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* New Save Bank Button */}
             <button
                onClick={() => setIsSaveBankModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full text-sm font-medium transition-colors border border-emerald-200"
                title="Lưu vào ngân hàng câu hỏi"
            >
                <Save size={16} />
                <span className="hidden sm:inline">Lưu câu hỏi</span>
            </button>

            {/* NEW: TikZ Library Button */}
             <button
                onClick={() => setIsTikzLibraryOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-full text-sm font-medium transition-colors border border-violet-200"
                title="Thư viện Hình vẽ & Cây thư mục"
            >
                <FolderTree size={16} />
                <span className="hidden sm:inline">Thư viện Hình</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Gemini 3 Pro Active
            </div>
            
            <button 
                onClick={() => setIsHelpOpen(true)}
                className="text-slate-500 hover:text-brand-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
                title="Hướng dẫn sử dụng"
            >
                <CircleHelp size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-6.5rem)]">
        
        {/* Left Column: Editor */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
            <div className="flex justify-between items-center">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <FileText size={18} />
                    Nguồn nhập liệu
                </h2>
                
                <div className="flex gap-2 relative items-center" ref={advancedMenuRef}>
                    {/* Activity Indicator Next to Menu */}
                    {menuActionStatus && (
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold animate-in fade-in slide-in-from-right-4">
                            <Loader2 size={12} className="animate-spin" />
                            {menuActionStatus}
                        </div>
                    )}

                    {/* NEW: ADVANCED AI MENU DROPDOWN */}
                    <button
                        onClick={() => setIsAdvancedMenuOpen(!isAdvancedMenuOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                        title="Bộ công cụ AI nâng cao"
                    >
                        <Sparkles size={14} />
                        Menu Cao Cấp
                        <ChevronDown size={14} className={`transition-transform ${isAdvancedMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAdvancedMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-1">
                                <button onClick={() => { setIsGeneratorOpen(true); setIsAdvancedMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-left group transition-colors">
                                    <div className="p-2 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                                        <PenTool size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">Tạo Đề & Vẽ Hình</div>
                                        <div className="text-xs text-slate-500">Sinh câu hỏi & mã TikZ</div>
                                    </div>
                                </button>
                                
                                {/* NEW: CREATE WORKSHEET BUTTON */}
                                <button onClick={() => { setIsWorksheetModalOpen(true); setIsAdvancedMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-left group transition-colors">
                                    <div className="p-2 rounded-md bg-orange-50 text-orange-600 group-hover:bg-orange-100">
                                        <FileSpreadsheet size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">Tạo Phiếu Học Tập</div>
                                        <div className="text-xs text-slate-500">Chuẩn GDPT 2018 (4 bước)</div>
                                    </div>
                                </button>

                                {/* POLYA BUTTON */}
                                <button onClick={() => handleAiTransform('POLYA')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-left group transition-colors">
                                    <div className="p-2 rounded-md bg-pink-50 text-pink-600 group-hover:bg-pink-100">
                                        <Brain size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">Giải tư duy G.Pólya</div>
                                        <div className="text-xs text-slate-500">4 bước & Kiểm chứng Python</div>
                                    </div>
                                </button>

                                <button onClick={() => handleAiTransform('SOLVE')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-left group transition-colors">
                                    <div className="p-2 rounded-md bg-green-50 text-green-600 group-hover:bg-green-100">
                                        <Calculator size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">Giải Chi Tiết</div>
                                        <div className="text-xs text-slate-500">Tự động giải đề bài</div>
                                    </div>
                                </button>
                                
                                <button onClick={() => handleAiTransform('TRANSLATE')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-left group transition-colors">
                                    <div className="p-2 rounded-md bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                                        <Languages size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">Dịch Anh - Việt</div>
                                        <div className="text-xs text-slate-500">Chuyển ngữ tài liệu</div>
                                    </div>
                                </button>
                                
                                <button onClick={() => handleAiTransform('FORMAT')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-left group transition-colors">
                                    <div className="p-2 rounded-md bg-orange-50 text-orange-600 group-hover:bg-orange-100">
                                        <Eraser size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">Chuẩn hóa LaTeX</div>
                                        <div className="text-xs text-slate-500">Làm đẹp code nguồn</div>
                                    </div>
                                </button>

                                {/* NEW BUTTON: TeX to Word Conversion (Local Logic) */}
                                <div className="my-1 border-t border-slate-100"></div>
                                <button onClick={handleTexToWord} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-left group transition-colors">
                                    <div className="p-2 rounded-md bg-teal-50 text-teal-600 group-hover:bg-teal-100">
                                        <Replace size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">Chuyển đổi TeX sang Word</div>
                                        <div className="text-xs text-slate-500">Biến đổi lệnh ex, choice thành text</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        title="Xóa toàn bộ nội dung để nhập mới"
                    >
                        <RotateCcw size={14} />
                    </button>
                    
                    <button 
                        onClick={() => setIsRichText(!isRichText)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            isRichText 
                            ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" 
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Chuyển đổi giữa chế độ Văn bản thuần và HTML"
                    >
                        {isRichText ? <FileCode size={12}/> : <Type size={12}/>}
                        {isRichText ? "HTML" : "Text"}
                    </button>
                </div>
            </div>

            <div className="flex gap-2">
              <label className="w-full cursor-pointer group relative flex items-center justify-center gap-2 px-3 py-3 bg-white border border-dashed border-slate-300 rounded-lg hover:border-brand-400 hover:bg-brand-50/10 transition-all text-sm font-medium text-slate-600">
                <Upload size={16} className="text-brand-600" />
                <span>Tải lên PDF, Word, hoặc Ảnh</span>
                <input 
                  type="file" 
                  accept=".docx,.doc,.pdf,.jpg,.jpeg,.png,.webp,.tex" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isImporting}
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>
          <div className="flex-1 relative group">
            <textarea
                ref={textareaRef}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className={`absolute inset-0 w-full h-full p-4 resize-none focus:outline-none focus:bg-slate-50/30 transition-colors font-mono text-sm leading-relaxed ${isRichText ? 'text-purple-800 bg-purple-50/10' : ''}`}
                placeholder="Nhập nội dung LaTeX hoặc văn bản vào đây..."
                spellCheck={false}
            />
            
            {/* Loading Overlay */}
            {isImporting && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 p-6 text-center">
                    <Loader2 className="animate-spin text-brand-600 mb-3" size={40} />
                    <p className="text-lg font-semibold text-slate-800 mb-1">Đang xử lý tập tin</p>
                    <p className="text-sm text-slate-500 max-w-xs">{importStatus}</p>
                </div>
            )}
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
             <span>Đang dùng {useSmartOCR ? 'Gemini Vision AI' : 'Bộ trích xuất thường'}</span>
             <span className="flex items-center gap-2">
                {isRichText && <span className="text-purple-600 font-medium">Giữ định dạng gốc</span>}
                <span>{rawText.length} ký tự</span>
             </span>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            
          {/* Exporting Overlay */}
          {isExporting && (
             <div className="absolute inset-0 bg-white/80 z-30 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                    <Loader2 className="animate-spin text-brand-600 mx-auto mb-2" size={32} />
                    <p className="font-medium text-slate-700">Đang tải ảnh TikZ và tạo file Word...</p>
                </div>
             </div>
          )}

          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <RefreshCcw size={18} className="text-slate-400" />
              Xem trước
            </h2>
            
            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
                <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-2 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm shadow-brand-200 transition-all text-sm font-medium hover:scale-105 active:scale-95"
                >
                <Download size={14} />
                Xuất file Word
                <ChevronDown size={14} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isExportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
                        <div className="p-2 space-y-1">
                            
                            <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cơ bản</div>
                            <ExportButton 
                                style="standard" 
                                icon={FileText} 
                                title="Xuất thông minh" 
                                sub="Giữ nguyên định dạng chuẩn"
                                colorClass="bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                            />
                            <ExportButton 
                                style="minimal" 
                                icon={Printer} 
                                title="Tối giản in ấn" 
                                sub="Đen trắng, tiết kiệm giấy"
                                colorClass="bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            />

                            <div className="px-3 py-1 mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Học tập</div>
                            <ExportButton 
                                style="two-column" 
                                icon={Columns} 
                                title="Đề thi 2 cột" 
                                sub="Form đề thi tiêu chuẩn"
                                colorClass="bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                            />
                            <ExportButton 
                                style="worksheet" 
                                icon={FileInput} 
                                title="Phiếu bài tập" 
                                sub="Thêm dòng kẻ trả lời"
                                colorClass="bg-green-50 text-green-600 group-hover:bg-green-100"
                            />
                            <ExportButton 
                                style="notes" 
                                icon={BookOpen} 
                                title="Ghi chép Cornell" 
                                sub="Lề trái rộng để ghi chú"
                                colorClass="bg-amber-50 text-amber-600 group-hover:bg-amber-100"
                            />
                            <ExportButton 
                                style="flashcards" 
                                icon={Grid} 
                                title="Thẻ học tập" 
                                sub="Khung thẻ để cắt rời"
                                colorClass="bg-pink-50 text-pink-600 group-hover:bg-pink-100"
                            />

                            <div className="px-3 py-1 mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiện ích</div>
                            <ExportButton 
                                style="landscape" 
                                icon={Monitor} 
                                title="Khổ ngang" 
                                sub="Cho trình chiếu, bảng rộng"
                                colorClass="bg-teal-50 text-teal-600 group-hover:bg-teal-100"
                            />
                             <ExportButton 
                                style="large-print" 
                                icon={ZoomIn} 
                                title="Cỡ chữ lớn" 
                                sub="Dễ đọc (16pt Arial)"
                                colorClass="bg-orange-50 text-orange-600 group-hover:bg-orange-100"
                            />
                            <ExportButton 
                                style="draft" 
                                icon={PenTool} 
                                title="Bản nháp" 
                                sub="Giãn dòng rộng để sửa"
                                colorClass="bg-red-50 text-red-600 group-hover:bg-red-100"
                            />
                        </div>
                    </div>
                )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            {/* The previewer */}
            <MathPreview segments={segments} isRichText={isRichText} />
          </div>
        </div>
      </main>

      {/* Author Footer */}
      <footer className="bg-white border-t border-slate-200 py-2.5 text-center text-sm text-slate-500 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-center gap-6">
            <span className="font-semibold text-brand-700 flex items-center gap-2">
                <User size={16}/> Tác giả: Vũ Tiến Lực
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <a href="tel:0969068849" className="flex items-center gap-2 hover:text-brand-600 transition-colors font-medium">
                <Phone size={16}/> 0969068849
            </a>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="flex items-center gap-2 text-slate-500">
                <GraduationCap size={16}/> GV Trường THPT Nguyễn Hữu Cảnh
            </span>
        </div>
      </footer>
      
      {/* Floating Chatbot */}
      <GeminiChat />

      {/* Save To Bank Modal */}
      <SaveToBankModal 
        isOpen={isSaveBankModalOpen} 
        onClose={() => setIsSaveBankModalOpen(false)}
        content={rawText}
      />

      {/* New TikZ Library Modal */}
      <TikzLibraryModal
        isOpen={isTikzLibraryOpen}
        onClose={() => setIsTikzLibraryOpen(false)}
        onInsertCode={(code) => {
            setRawText(prev => prev + "\n\n" + code);
            setIsTikzLibraryOpen(false);
        }}
      />
      
      {/* New Worksheet Generator Modal */}
      <WorksheetGeneratorModal
        isOpen={isWorksheetModalOpen}
        onClose={() => setIsWorksheetModalOpen(false)}
        onInsertContent={(content) => {
             setRawText(prev => prev + (prev.trim() ? "\n\n" : "") + content);
             if (textareaRef.current) {
                setTimeout(() => {
                   textareaRef.current?.scrollTo({ top: textareaRef.current.scrollHeight, behavior: 'smooth' });
                }, 100);
             }
        }}
      />

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-brand-50">
                    <h3 className="text-xl font-bold text-brand-800 flex items-center gap-2">
                        <CircleHelp className="text-brand-600" />
                        Hướng dẫn sử dụng
                    </h3>
                    <button onClick={() => setIsHelpOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Step 1 */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">1</div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg mb-1">Nhập nội dung</h4>
                            <p className="text-slate-600 leading-relaxed">
                                Bạn có thể <strong>gõ trực tiếp</strong> mã LaTeX vào khung bên trái, hoặc bấm nút <strong>Upload</strong> để tải lên file:
                                <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                                    <li><b>Ảnh (JPG, PNG):</b> AI sẽ tự động nhận diện công thức toán.</li>
                                    <li><b>PDF:</b> AI sẽ quét từng trang và chuyển đổi sang LaTeX.</li>
                                    <li><b>Word (Docx):</b> Tự động trích xuất nội dung và giữ nguyên định dạng.</li>
                                    <li><b>LaTeX (.tex):</b> Tự động biên dịch các gói đề thi (ex_test) sang định dạng Word.</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg shrink-0">2</div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg mb-1">Chỉnh sửa & Xem trước</h4>
                            <p className="text-slate-600 leading-relaxed">
                                Nội dung sau khi nhập sẽ hiện ở khung bên trái. Bạn có thể sửa lỗi chính tả hoặc công thức.
                                <br/>Khung bên phải sẽ <strong>hiển thị trực tiếp</strong> kết quả (Live Preview) giống như khi in ra.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg shrink-0">3</div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg mb-1">Xuất file Word</h4>
                            <p className="text-slate-600 leading-relaxed">
                                Bấm nút <strong>Xuất file Word</strong> ở góc phải. Chọn mẫu phù hợp:
                                <ul className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                    <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Xuất thông minh (Chuẩn)</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Đề thi 2 cột</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Phiếu bài tập</li>
                                    <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Ghi chép Cornell</li>
                                </ul>
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <Sparkles size={16} className="text-brand-500"/>
                            Mẹo hay
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-2">
                            <li>• <b>AI Generator:</b> Dùng tính năng này để AI tự vẽ hình (ví dụ: "Vẽ đồ thị hàm số y=x^3-3x").</li>
                            <li>• Bật chế độ <b>"AI Smart OCR"</b> để nhận diện công thức toán phức tạp (Ma trận, tích phân...) chính xác hơn.</li>
                            <li>• Ứng dụng hỗ trợ mã <b>TikZ</b>. Hãy nhập <code>\begin{'{tikzpicture}'} ... \end{'{tikzpicture}'}</code>, ứng dụng sẽ tự động vẽ hình và nhúng vào Word.</li>
                        </ul>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-sm text-slate-500">
                    Ứng dụng được phát triển bởi <b>Vũ Tiến Lực</b> © 2025
                </div>
            </div>
        </div>
      )}

      {/* AI Generator Modal */}
      {isGeneratorOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2">
                          <Wand2 size={20} />
                          AI Tạo Đề & Vẽ Hình Tự Động
                      </h3>
                      <button onClick={() => setIsGeneratorOpen(false)} className="text-white/80 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6">
                      <p className="text-sm text-slate-600 mb-3">
                          Mô tả câu hỏi toán học hoặc hình vẽ bạn muốn tạo. AI sẽ tự động sinh mã LaTeX và hình vẽ TikZ cho bạn.
                      </p>
                      
                      <div className="space-y-3">
                          <textarea
                              value={generatorPrompt}
                              onChange={(e) => setGeneratorPrompt(e.target.value)}
                              placeholder="Ví dụ: Tạo câu hỏi trắc nghiệm tìm cực trị của hàm số y = x^4 - 2x^2 + 1 và vẽ đồ thị hàm số đó."
                              className="w-full h-32 p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-sm"
                          />
                          
                          <div className="flex gap-2 text-xs text-slate-500">
                             <span className="font-semibold">Gợi ý:</span>
                             <button onClick={() => setGeneratorPrompt("Vẽ hình chóp S.ABCD có đáy ABCD là hình vuông, SA vuông góc với đáy.")} className="hover:text-indigo-600 hover:underline">Hình chóp</button> • 
                             <button onClick={() => setGeneratorPrompt("Vẽ đồ thị hàm số y = (2x-1)/(x+1) có tiệm cận đứng và ngang.")} className="hover:text-indigo-600 hover:underline">Hàm phân thức</button> • 
                             <button onClick={() => setGeneratorPrompt("Tạo bài toán tính tích phân từ 0 đến pi/2 của sin(x).")} className="hover:text-indigo-600 hover:underline">Tích phân</button>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                      <button 
                          onClick={() => setIsGeneratorOpen(false)}
                          className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                      >
                          Hủy bỏ
                      </button>
                      <button 
                          onClick={handleGenerateQuestion}
                          disabled={!generatorPrompt.trim() || isGenerating}
                          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                          {isGenerating ? "Đang suy nghĩ..." : "Tạo ngay"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}