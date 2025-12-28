import { GoogleGenAI, Chat } from "@google/genai";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      temperature: 0.7,
      systemInstruction: `You are MathDoc AI, an expert assistant for a LaTeX to Word conversion tool. 
      Your goal is to help users format their LaTeX math expressions, debug syntax errors, or generate LaTeX code for complex equations.
      You can also answer general questions about mathematics and document formatting.
      Keep your answers concise and helpful. When providing LaTeX code, wrap it in code blocks.`,
    },
  });
};

export const sendMessageToGemini = async (
  chat: Chat, 
  message: string
): Promise<AsyncIterable<string>> => {
  try {
    const responseStream = await chat.sendMessageStream({ message });
    
    // Create an async generator to yield text chunks
    async function* streamGenerator() {
      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    }
    
    return streamGenerator();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Analyzes images (single or multiple pages) using Gemini Vision to extract text and LaTeX.
 */
export const analyzeImagesToLatex = async (
    images: { mimeType: string; data: string }[]
): Promise<string> => {
    try {
        // Limit the number of pages processed in one go to avoid payload limits if necessary
        // Gemini 3 Flash has a large context window.
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: {
                parts: [
                    ...images.map(img => ({
                        inlineData: {
                            mimeType: img.mimeType,
                            data: img.data
                        }
                    })),
                    {
                        text: `
                        You are an advanced Math OCR engine. Your task is to transcribe the content of these images into a single continuous text document.
                        
                        RULES:
                        1. **Mathematics**: Detect ALL mathematical formulas, symbols, and expressions. Convert them STRICTLY into standard LaTeX format.
                           - Use $...$ for inline math.
                           - Use $$...$$ for display math (equations on their own line).
                        2. **Language**: Preserve the original language (Vietnamese/English). Fix minor OCR typos if the context is obvious.
                        3. **Formatting & Structure (IMPORTANT)**: 
                           - **Headings**: Start every new "Câu" (Question) or "Bài" (Problem) on a NEW LINE with a blank line before it to separate sections clearly.
                           - **Sub-items**: Start every sub-part (e.g., "a)", "b)", "c)", or "1.", "2.") on a NEW LINE. Do NOT write them inline.
                        4. **Output**: Return ONLY the transcribed content. Do not add "Here is the transcription" or any conversational filler.
                        5. **Accuracy**: Pay special attention to fractions, integrals, sum, limits, and matrices.
                        `
                    }
                ]
            }
        });

        let text = response.text || "";

        // --- POST-PROCESSING FOR PROFESSIONAL VIETNAMESE MATH FORMATTING ---
        
        // 1. Remove all Markdown bold markers (**) as requested to keep text clean
        text = text.replace(/\*\*/g, '');

        // 2. Ensure "Câu X" or "Bài X" starts on a new double line for visual separation.
        //    Matches: "Câu 1", "Bài 1", "Câu I", "Bài IV" not already preceded by double newline.
        text = text.replace(/([^\n])\n*(Câu|Bài|Và)\s+([\dIVX]+[.:]?)/gi, '$1\n\n$2 $3');
        
        // 3. Ensure sub-questions like a), b), c) start on a new line.
        //    Example conversion: "Câu 1. Tính: a) x+1 b) x-1" -> "... \na) x+1 \nb) x-1"
        //    Regex looks for a letter followed by ) or . preceded by whitespace, comma, or semicolon.
        text = text.replace(/([,;.]|\s)(\s*)([a-z]\))(\s)/g, '\n$3$4');
        text = text.replace(/([,;.]|\s)(\s*)([1-9]\.)(\s)/g, '\n$3$4');

        // 4. Clean up multiple blank lines to max 2
        text = text.replace(/\n{3,}/g, '\n\n');

        return text.trim();

    } catch (error) {
        console.error("Gemini Image Transcription Error:", error);
        // Throw the original error so the UI can display the specific API error message (e.g., 404, 403, 429)
        throw error;
    }
};

/**
 * Generates TikZ code from an image using Gemini Vision.
 */
export const generateTikzFromImage = async (base64Data: string, mimeType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Pro is better for coding/visual reasoning
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    },
                    {
                        text: `
                        Look at this mathematical figure/graph/diagram.
                        Write the LaTeX **TikZ** code to reproduce it as accurately as possible.
                        
                        REQUIREMENTS:
                        1. Use \\begin{tikzpicture} ... \\end{tikzpicture}.
                        2. If it's a function graph: Draw axes with arrows, label x/y, and plot the function curve smoothly.
                        3. If it's geometry: Use proper coordinate calculations (e.g., \\coordinate, \\draw).
                        4. Include labels (points A, B, C... or values) as seen in the image.
                        5. Output ONLY the TikZ code (raw text). Do not output markdown backticks or explanations.
                        `
                    }
                ]
            }
        });

        let code = response.text?.trim() || "";
        // Clean markdown code blocks if AI adds them
        code = code.replace(/^```latex\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
        
        return code;
    } catch (error) {
        console.error("Generate TikZ Error:", error);
        throw error;
    }
};

/**
 * Generates TikZ code from a text description.
 */
export const generateTikzFromDescription = async (description: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    {
                        text: `
                        You are an expert LaTeX TikZ developer.
                        Task: Create a TikZ diagram based on this description: "${description}".
                        
                        REQUIREMENTS:
                        1. Use \\begin{tikzpicture} ... \\end{tikzpicture}.
                        2. Ensure the code is valid, clean, and produces a professional-looking math diagram.
                        3. Use standard TikZ libraries (calc, patterns, arrows.meta, intersections).
                        4. Output ONLY the TikZ code (raw text). Do NOT wrap in markdown blocks like \`\`\`latex.
                        `
                    }
                ]
            }
        });

        let code = response.text?.trim() || "";
        // Clean markdown code blocks if AI adds them
        code = code.replace(/^```latex\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
        
        return code;
    } catch (error) {
        console.error("Generate TikZ Text Error:", error);
        throw error;
    }
};

/**
 * Generates a specific Math Question + TikZ Diagram based on user description.
 */
export const generateExamQuestion = async (description: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Pro model is better for complex TikZ generation
            contents: {
                parts: [
                    {
                        text: `
                        Bạn là một chuyên gia soạn đề thi Toán học Việt Nam và là chuyên gia vẽ hình bằng LaTeX TikZ.
                        
                        NHIỆM VỤ: Dựa trên yêu cầu: "${description}", hãy tạo ra nội dung LaTeX phù hợp.
                        
                        YÊU CẦU ĐẦU RA:
                        1. **Cấu trúc**:
                           Câu [Số]: [Nội dung câu hỏi]
                           [Nếu cần hình vẽ, chèn code TikZ vào đây]
                           A. [Đáp án]      B. [Đáp án]      C. [Đáp án]      D. [Đáp án]
                           
                        2. **Yêu cầu về TikZ (QUAN TRỌNG)**:
                           - Luôn dùng môi trường \\begin{tikzpicture} ... \\end{tikzpicture}.
                           - Hình vẽ phải đẹp, tỉ lệ chuẩn, các điểm, nhãn (label) phải rõ ràng, không bị chồng chéo.
                           - Với đồ thị hàm số: Vẽ hệ trục Oxy có mũi tên, chia vạch rõ ràng.
                           - Với hình học không gian: Nét đứt cho cạnh khuất, nét liền cho cạnh thấy.

                        3. **Định dạng**:
                           - KHÔNG dùng markdown block (như \`\`\`latex). Trả về văn bản thô (raw text) để copy paste trực tiếp.
                           - Công thức toán kẹp giữa $...$.

                        Ví dụ output mong muốn:
                        Câu 1: Cho hình chóp S.ABCD...
                        \\begin{tikzpicture}
                        ...
                        \\end{tikzpicture}
                        A. ... B. ...
                        `
                    }
                ]
            }
        });

        return response.text?.trim() || "";
    } catch (error) {
        console.error("Generate Exam Question Error:", error);
        throw error;
    }
}

/**
 * Transforms existing LaTeX content based on instruction (Solve, Translate, etc.)
 */
export const transformLatexContent = async (content: string, mode: 'SOLVE' | 'TRANSLATE' | 'FORMAT' | 'POLYA'): Promise<string> => {
    try {
        let prompt = "";
        let modelName = 'gemini-3-flash-preview';
        let thinkingBudget = 0;

        if (mode === 'SOLVE') {
            prompt = `
            Bạn là một giáo viên Toán giỏi. Hãy tạo **LỜI GIẢI CHI TIẾT** cho các bài toán trong nội dung LaTeX dưới đây.
            
            YÊU CẦU:
            1. Giữ nguyên nội dung đề bài gốc.
            2. Ngay dưới mỗi câu hỏi, thêm phần lời giải bắt đầu bằng "**Lời giải:**".
            3. Trình bày lời giải bằng LaTeX chuẩn, ngắn gọn, súc tích, dễ hiểu.
            4. Nếu là câu trắc nghiệm, hãy giải thích tại sao chọn đáp án đó.
            5. Không thay đổi code TikZ nếu có.
            `;
        } else if (mode === 'TRANSLATE') {
            prompt = `
            You are a professional translator for Mathematics. Translate the following LaTeX content into **ENGLISH**.
            
            RULES:
            1. Keep all LaTeX math commands ($...$, $$...$$, TikZ) intact.
            2. Translate only the text.
            3. Ensure mathematical terminology is standard (e.g., "Tiệm cận ngang" -> "Horizontal Asymptote").
            4. Output format should be ready to compile LaTeX.
            `;
        } else if (mode === 'FORMAT') {
             prompt = `
             Bạn là chuyên gia LaTeX. Hãy chuẩn hóa định dạng văn bản sau cho đẹp và chuẩn:
             1. Căn chỉnh lại khoảng trắng.
             2. Đảm bảo các công thức toán dùng $...$ hoặc $$...$$ đúng chuẩn.
             3. Thay thế các ký hiệu không chuẩn nếu có.
             4. Xóa các dòng trống thừa (chỉ để tối đa 1 dòng trống giữa các câu).
             5. Không thay đổi nội dung, chỉ làm đẹp code.
             `;
        } else if (mode === 'POLYA') {
            // Use Gemini 3 Pro with Thinking for Polya method
            modelName = 'gemini-3-pro-preview';
            thinkingBudget = 10240; // Allocate tokens for thinking process

            prompt = `
            Bạn là Giáo sư Toán học George Pólya. Nhiệm vụ của bạn là giải bài toán LaTeX dưới đây theo phương pháp 4 bước kinh điển, đồng thời bổ sung phần nhận xét và mở rộng.

            QUY TRÌNH SUY LUẬN (THINKING PROCESS - BẮT BUỘC):
            1. Phân tích đề bài.
            2. Lên kế hoạch giải.
            3. Thực hiện giải chi tiết.
            4. **KIỂM CHỨNG TỰ ĐỘNG (VERIFICATION):** Trong quá trình suy nghĩ, hãy tự kiểm tra lại kết quả (dùng logic, thay số, hoặc giả lập Python/Wolfram trong tư duy).
            5. **ĐÁNH GIÁ & MỞ RỘNG:** Suy nghĩ về phương pháp đã dùng, những điểm cần lưu ý và các bài toán tương tự.

            ĐỊNH DẠNG ĐẦU RA (FINAL OUTPUT):
            Chỉ xuất ra nội dung văn bản cuối cùng. TUYỆT ĐỐI KHÔNG xuất log kiểm chứng.
            Sử dụng Markdown **in đậm** cho các tiêu đề bước để bộ chuyển đổi sau này xử lý.

            Cấu trúc trình bày (bắt buộc):

            **Bước 1: Tìm hiểu vấn đề**
            - Tóm tắt GT/KL ngắn gọn bằng ký hiệu toán học.

            **Bước 2: Xây dựng kế hoạch**
            - Nêu tên phương pháp, định lý hoặc hướng đi chính.

            **Bước 3: Thực hiện kế hoạch**
            - Trình bày lời giải LaTeX súc tích, logic.

            **Bước 4: Nhìn lại (Kết luận)**
            - Đáp số cuối cùng.

            **Bước 5: Nhận xét & Mở rộng**
            - **Nhận xét:** Đánh giá về độ khó, sai lầm thường gặp hoặc cái hay của bài toán.
            - **Mở rộng:** Đề xuất 1 bài toán tương tự, bài toán ngược hoặc tổng quát hóa ngắn gọn.

            YÊU CẦU CHUNG:
            - Giữ nguyên đề bài gốc ở đầu.
            - Trình bày đẹp, chuẩn LaTeX ($...$).
            - Giọng văn: Sư phạm, gãy gọn.
            `;
        }

        const requestConfig: any = {
            model: modelName,
            contents: {
                parts: [
                    { text: prompt },
                    { text: `\n\nINPUT CONTENT:\n${content}` }
                ]
            }
        };

        // Add thinking config if Polya mode
        if (thinkingBudget > 0) {
            requestConfig.config = {
                thinkingConfig: { thinkingBudget: thinkingBudget }
            };
        }

        const response = await ai.models.generateContent(requestConfig);

        return response.text?.trim() || content;
    } catch (error) {
        console.error("Transform Content Error:", error);
        throw error;
    }
};

/**
 * Creates a Pedagogical Worksheet based on user inputs (Grade, Lesson, Level)
 */
export const createWorksheet = async (
    grade: string, 
    lessonName: string, 
    level: 'weak' | 'average' | 'good' | 'assessment',
    includeAnswerKey: boolean = false
): Promise<string> => {
    try {
        const differentiationPrompt = {
            'weak': `
                🔹 ĐỐI TƯỢNG: Học sinh Yếu – Trung bình
                - Câu hỏi ngắn, tường minh, chia nhỏ ý.
                - Có gợi ý (Scaffolding) từng bước.
                - Hạn chế tính toán cồng kềnh.
                - Tăng cường câu hỏi điền khuyết, trắc nghiệm nhanh.
            `,
            'average': `
                🔹 ĐỐI TƯỢNG: Học sinh Trung bình - Khá
                - Câu hỏi mức độ vận dụng cơ bản.
                - Yêu cầu giải thích ngắn gọn cách làm.
            `,
            'good': `
                🔹 ĐỐI TƯỢNG: Học sinh Khá – Giỏi
                - Cho phép nhiều cách giải.
                - Yêu cầu giải thích, phản biện, so sánh.
                - Có câu hỏi mở rộng, tổng quát hóa hoặc câu hỏi ngược.
            `,
            'assessment': `
                🔹 MỤC ĐÍCH: KIỂM TRA ĐÁNH GIÁ (Đánh giá quá trình)
                - Thiết kế các tiêu chí đánh giá năng lực đi kèm.
                - Đa dạng hoá mức độ nhận thức (Nhận biết - Thông hiểu - Vận dụng).
            `
        };

        const answerKeyInstruction = includeAnswerKey ? `
        6. **PHẦN PHỤ LỤC (BẮT BUỘC): ĐÁP ÁN & HƯỚNG DẪN CHẤM**
           - Thêm một tiêu đề lớn: "**HƯỚNG DẪN CHẤM CHI TIẾT**" (Để sau này phần mềm tự ngắt trang).
           - Cung cấp đáp án cuối cùng cho tất cả các bài.
           - Với câu hỏi tự luận/vận dụng: Nêu thang điểm chấm hoặc các bước giải quan trọng.
           - Lưu ý: Phần này phải tuyệt đối chính xác (đã qua bước Verification).
        ` : "";

        const prompt = `
        Đóng vai trò là chuyên gia giáo dục Toán học với 40 năm kinh nghiệm và chuyên gia kiểm định chất lượng đề thi.
        Hãy thiết kế một PHIẾU HỌC TẬP Toán cho học sinh lớp [${grade}], bài học: "[${lessonName}]", theo định hướng Chương trình GDPT 2018 (Phát triển năng lực).

        ${differentiationPrompt[level]}

        --------------------------
        QUY TRÌNH TƯ DUY NỘI TẠI (INTERNAL THINKING PROCESS - BẮT BUỘC):
        Trước khi viết bất kỳ bài toán nào vào phiếu, bạn phải thực hiện quy trình kiểm chứng nghiêm ngặt sau trong "Thinking Block":
        1. **Soạn thảo**: Đưa ra đề bài sơ bộ.
        2. **Giải thử (Internal Solver)**: Tự giải bài toán đó từng bước một (như một máy tính Wolfram Alpha/Python).
        3. **Kiểm chứng (Verification)**: Kiểm tra lại kết quả. Nếu số liệu lẻ hoặc sai, hãy điều chỉnh đề bài ngay lập tức.
        4. **Cam kết**: Chỉ xuất ra những bài toán đã được kiểm chứng là CHÍNH XÁC 100%.
        --------------------------

        YÊU CẦU QUAN TRỌNG VỀ ĐỊNH DẠNG:
        1. **TUYỆT ĐỐI KHÔNG** dùng markdown block (như \`\`\`latex hay \`\`\`). Trả về text thuần.
        2. Dùng **in đậm** (hai dấu sao) cho các tiêu đề phần lớn để phần mềm nhận diện (Ví dụ: **Phần A:...**).
        3. Công thức toán kẹp trong $...$ hoặc $$...$$.
        4. Trình bày thoáng, đẹp, ngôn ngữ sư phạm.

        CẤU TRÚC PHIẾU HỌC TẬP:

        Tên phiếu: **PHIẾU HỌC TẬP: ${lessonName.toUpperCase()}**
        
        **🎯 MỤC TIÊU & NĂNG LỰC:**
        (Liệt kê ngắn gọn 2-3 năng lực toán học chủ đạo)

        **PHẦN A: KHỞI ĐỘNG (Kết nối tri thức)**
        - 1 tình huống thực tế hoặc câu hỏi gợi mở để học sinh bước vào bài học.

        **PHẦN B: KHÁM PHÁ KIẾN THỨC (Hình thành kiến thức mới)**
        - 2-3 hoạt động hoặc câu hỏi dẫn dắt (Ví dụ: "Em hãy quan sát...", "Vì sao...").
        - Tránh lối dạy thuyết giảng, hãy để HS tự rút ra kết luận.

        **PHẦN C: LUYỆN TẬP (Thực hành)**
        - 2 bài tập cốt lõi nhất.
        - Với HS yếu: Thêm khung gợi ý "Hướng dẫn:".

        **PHẦN D: VẬN DỤNG & MỞ RỘNG**
        - 1 bài toán thực tế hoặc câu hỏi thách thức tư duy.

        **PHẦN E: TỰ ĐÁNH GIÁ (Phản tư)**
        - Bảng checklist nhỏ hoặc câu hỏi để HS tự nhìn lại quá trình học.

        ${answerKeyInstruction}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                thinkingConfig: { thinkingBudget: 8192 } // High budget for rigorous verification
            }
        });

        return response.text?.trim() || "";
    } catch (error) {
        console.error("Generate Worksheet Error:", error);
        throw error;
    }
};

// Legacy support wrapper
export const transcribeImageToLatex = async (base64Data: string, mimeType: string): Promise<string> => {
    return analyzeImagesToLatex([{ mimeType, data: base64Data }]);
};