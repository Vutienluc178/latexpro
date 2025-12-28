import katex from 'katex';
import { asBlob } from 'html-docx-js-typescript';
import pako from 'pako';
import { TextSegment, ExportStyle } from '../types';

/**
 * Helper to generate Kroki URL for TikZ
 */
export const getTikzImageUrl = (tikzCode: string, format: 'svg' | 'png' = 'svg'): string => {
  // Wrap in standalone if not already a document to ensure libraries are loaded
  let source = tikzCode;
  
  let preambleExtras = "";
  if (format === 'png') {
      // Scale up by 4x for high-DPI (Print quality ~300-400 DPI)
      // 'transform shape' ensures text scales with the drawing
      // ensuring transparency is handled by standalone class default behavior
      preambleExtras = "\\tikzset{every picture/.append style={scale=4, transform shape}}";
  }

  if (!source.includes('\\documentclass')) {
      source = `\\documentclass[tikz,border=2pt]{standalone}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{pgfplots}
\\pgfplotsset{compat=newest}
\\usetikzlibrary{arrows,arrows.meta,calc,patterns,positioning,shapes.geometric,decorations.markings,decorations.pathmorphing,intersections,through,backgrounds}
${preambleExtras}
\\begin{document}
${tikzCode}
\\end{document}`;
  }

  // Compress using pako (deflate)
  const data = new TextEncoder().encode(source);
  const compressed = pako.deflate(data, { level: 9 });
  
  // Convert to Base64URL safe string
  const str = String.fromCharCode.apply(null, Array.from(compressed));
  const b64 = btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  
  return `https://kroki.io/tikz/${format}/${b64}`;
};

/**
 * Preprocesses specialized Exam LaTeX commands (\choice, \choiceTF, \shortans)
 * converting them into a standard text format that the parser can handle nicely.
 */
export const preprocessLatexExam = (text: string): string => {
    let processed = text;

    // 1. Clean up Exam Environments and System Commands
    processed = processed.replace(/\\begin\s*\{ex\}%?/gi, '\n');
    processed = processed.replace(/\\end\s*\{ex\}/gi, '\n');
    processed = processed.replace(/\\(Open|Close)solutionfile.*/gi, '');
    processed = processed.replace(/\\setcounter.*/gi, '');
    processed = processed.replace(/\\noindent/gi, '');

    // 2. Remove \True command (marks correct answer) but keep content
    processed = processed.replace(/\\True\s*/g, '');

    // 3. Handle \choice{A}{B}{C}{D}
    // We use a simplified regex assuming choices are balanced enough or not heavily nested with identical braces.
    // Standard format: \choice{...}{...}{...}{...}
    const choiceRegex = /\\choice\s*\{((?:[^{}]|{[^{}]*})*)\}\s*\{((?:[^{}]|{[^{}]*})*)\}\s*\{((?:[^{}]|{[^{}]*})*)\}\s*\{((?:[^{}]|{[^{}]*})*)\}/g;
    processed = processed.replace(choiceRegex, (match, a, b, c, d) => {
        return `\nA. ${a}    B. ${b}    C. ${c}    D. ${d}\n`;
    });

    // 4. Handle \choiceTF{A}{B}{C}{D} (True/False Format)
    // Converted to list a), b), c), d)
    const choiceTFRegex = /\\choiceTF\s*\{((?:[^{}]|{[^{}]*})*)\}\s*\{((?:[^{}]|{[^{}]*})*)\}\s*\{((?:[^{}]|{[^{}]*})*)\}\s*\{((?:[^{}]|{[^{}]*})*)\}/g;
    processed = processed.replace(choiceTFRegex, (match, a, b, c, d) => {
        return `\na) ${a}\nb) ${b}\nc) ${c}\nd) ${d}\n`;
    });

    // 5. Handle \shortans{...}
    const shortAnsRegex = /\\shortans\s*\{((?:[^{}]|{[^{}]*})*)\}/g;
    processed = processed.replace(shortAnsRegex, (match, ans) => {
        return `\n\n**Đáp án ngắn:** ${ans}\n`;
    });

    // 6. Handle \loigiai (or \textit{Lời giải.})
    // Ensure it starts on a new line for cleaner formatting
    processed = processed.replace(/(\\textit\s*\{Lời giải\.\}|\\loigiai)/gi, '\n\n**Lời giải.**');

    return processed;
};

/**
 * Splits a raw string into text, LaTeX math, and TikZ segments.
 */
export const parseContent = (text: string): TextSegment[] => {
  // Preprocess Exam LaTeX commands first
  const cleanText = preprocessLatexExam(text);

  const segments: TextSegment[] = [];
  
  // Regex Priorities:
  // 1. TikZ Environments (\begin{tikzpicture}...\end{tikzpicture})
  // 2. Explicit Math Environments (\begin{equation}...\end{equation}, align, gather, etc.)
  // 3. Display Math ($$ or \[)
  // 4. Inline Math ($ or \()
  
  const regex = /(\\begin\s*\{tikzpicture\}[\s\S]*?\\end\s*\{tikzpicture\}|\\begin\s*\{(?:equation|align|gather|flalign|alignat|multline|cases)\*?\}[\s\S]*?\\end\s*\{(?:equation|align|gather|flalign|alignat|multline|cases)\*?\}|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$[^$]*?\$)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleanText)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: cleanText.slice(lastIndex, match.index),
      });
    }

    const fullMatch = match[0];
    
    // Check for TikZ
    if (/^\\begin\s*\{tikzpicture\}/.test(fullMatch)) {
        segments.push({
            type: 'tikz',
            content: fullMatch,
            displayMode: true
        });
    } else {
        // It's Math (Standard or Environment)
        let content = fullMatch;
        let displayMode = false;

        if (fullMatch.startsWith('$$')) {
            content = fullMatch.slice(2, -2);
            displayMode = true;
        } else if (fullMatch.startsWith('\\[')) {
            content = fullMatch.slice(2, -2);
            displayMode = true;
        } else if (fullMatch.startsWith('\\(')) {
            content = fullMatch.slice(2, -2);
            displayMode = false;
        } else if (fullMatch.startsWith('$')) {
            content = fullMatch.slice(1, -1);
            displayMode = false;
        } else if (/^\\begin\s*\{(?:equation|align|gather|flalign|alignat|multline)/.test(fullMatch)) {
            // Environments like \begin{align} are automatically display mode
            content = fullMatch;
            displayMode = true;
        } else if (/^\\begin\s*\{cases\}/.test(fullMatch)) {
             // Cases environment usually lives inside math, but if caught top-level, treat as display
             content = fullMatch;
             displayMode = true;
        }

        segments.push({
            type: 'math',
            content: content,
            displayMode,
        });
    }

    lastIndex = regex.lastIndex;
  }

  // Push remaining text
  if (lastIndex < cleanText.length) {
    segments.push({
      type: 'text',
      content: cleanText.slice(lastIndex),
    });
  }

  return segments;
};

/**
 * Generates a Standard .docx file.
 * tikzImagesMap: Optional map of { original_code: { base64, width, height } }
 */
export const generateWordCompatibleFile = (
    segments: TextSegment[], 
    isRichText: boolean = false, 
    style: ExportStyle = 'standard',
    tikzImagesMap: Record<string, { base64: string; width: number; height: number }> = {}
): Promise<Blob> | Blob => {
    
  let bodyContent = '';

  // Helper: Dotted lines for Worksheet
  const writingLines = `
    <div style="margin-top: 10pt; margin-bottom: 20pt; color: #999;">
        <p style="border-bottom: 1px dotted #999; line-height: 24pt;">&nbsp;</p>
        <p style="border-bottom: 1px dotted #999; line-height: 24pt;">&nbsp;</p>
        <p style="border-bottom: 1px dotted #999; line-height: 24pt;">&nbsp;</p>
    </div>
  `;

  const isFlashcard = style === 'flashcards';

  segments.forEach((segment, index) => {
    let segmentHtml = '';

    if (segment.type === 'text') {
      let htmlText = '';
      if (isRichText) {
        htmlText = segment.content;
      } else {
        let safeText = segment.content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        
        // --- 1. AESTHETIC WORKSHEET HEADERS (PHẦN A, B, C...) ---
        // Converts "**PHẦN A:**" or "PHẦN A:" into a styled header block
        safeText = safeText.replace(
            /(?:^|\n)(?:\*\*)?(PHẦN\s+[A-E])(?:\s*:|:)?(.*?)(?:\*\*)?(\n|$)/gi,
            (match, p1, p2) => {
                // p1 = "PHẦN A", p2 = "KHỞI ĐỘNG..."
                const partTitle = p1.toUpperCase();
                const partDesc = p2.trim().toUpperCase();
                return `<h3 style="color: #c0504d; border-bottom: 2px solid #c0504d; padding-bottom: 4pt; margin-top: 18pt; margin-bottom: 12pt; font-size: 14pt;">${partTitle}: <span style="color: #000000; font-weight: normal;">${partDesc}</span></h3>`;
            }
        );

        // --- 2. HƯỚNG DẪN CHẤM (Answer Key) PAGE BREAK ---
        // Automatically detect "HƯỚNG DẪN CHẤM" or "PHẦN ĐÁP ÁN" and force a page break before it
        if (/(HƯỚNG DẪN CHẤM|PHẦN PHỤ LỤC|ĐÁP ÁN)/i.test(safeText)) {
            safeText = safeText.replace(
                /(?:^|\n)(?:\*\*)?(HƯỚNG DẪN CHẤM|PHẦN PHỤ LỤC|ĐÁP ÁN)(.*?)(?:\*\*)?(\n|$)/gi,
                (match, p1, p2) => {
                    return `<div style="page-break-before: always; clear: both;"></div><h2 style="color: #1F4D78; text-align: center; border: 2px solid #1F4D78; padding: 10px; margin-top: 20px;">${p1}${p2}</h2>`;
                }
            );
        }

        // --- 3. Title Styling (Tên phiếu, Mục tiêu) ---
        // Highlight "MỤC TIÊU", "NĂNG LỰC"
        safeText = safeText.replace(
            /(^|\n)(MỤC TIÊU|NĂNG LỰC|TARGET)(:)/gi,
            '$1<span style="color: #4f81bd; font-weight: bold; text-transform: uppercase;">$2$3</span>'
        );

        // --- 4. Highlight Câu/Bài (Question Markers) ---
        safeText = safeText.replace(
            /(^|\n)(Câu|Bài)\s+([\dIVX]+[.:]?)/gi, 
            '$1<span style="color: #0284c7; font-weight: bold;">$2 $3</span>'
        );

        // --- 5. Highlight sub-questions a) b) ---
        safeText = safeText.replace(
            /(^|\n)([a-z]\))(\s)/g,
            '$1<span style="color: #0369a1; font-weight: bold;">$2</span>$3'
        );

        // --- 6. Highlight & Format Multiple Choice (A. B. C. D.) ---
        safeText = safeText.replace(/([^\n])\s+([B-D]\.)/g, '$1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$2');
        safeText = safeText.replace(
            /(^|[\s\u00A0]|&nbsp;|\n)([A-D]\.)(\s)/g,
            '$1<span style="font-weight: bold; font-family: \'Times New Roman\';">$2</span>$3'
        );
        
        // --- 7. CLEAN UP MARKDOWN BOLD & SYMBOLS ---
        // Convert **text** to actual Bold HTML and remove the asterisks
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        
        // Remove common Markdown artifacts that AI might leave
        safeText = safeText.replace(/^#{1,6}\s+/gm, ''); // Remove heading hashes
        safeText = safeText.replace(/`/g, ''); // Remove backticks

        // Highlight Specific Polya Keywords (Red/Bold) if not already handled
        safeText = safeText.replace(
            /(^|\n)(Bước \d+[:.]|Nhận xét[:.]|Mở rộng[:.]|Lời giải[:.]|Đánh giá[:.])/gi,
            '$1<span style="color: #b91c1c; font-weight: bold;">$2</span>'
        );

        // --- 8. Fix Word Spacing Issue ---
        if (safeText.length > 0) {
            if (safeText.startsWith(' ')) {
                 safeText = '&#160;' + safeText.substring(1);
            }
            if (safeText.endsWith(' ')) {
                 safeText = safeText.substring(0, safeText.length - 1) + '&#160;';
            }
        }

        htmlText = `<span class="text-run" style="font-family: 'Times New Roman';">${safeText.replace(/\n/g, "<br/>")}</span>`;
      }
      segmentHtml += htmlText;

      if (style === 'worksheet' && !isRichText) {
          // Add writing space after questions, but avoiding double lines if segment is short
          // AND ensure we don't add lines to the Answer Key section
          const isAnswerKeySection = segment.content.includes("HƯỚNG DẪN CHẤM") || segment.content.includes("ĐÁP ÁN");
          if (!isAnswerKeySection && (segment.content.includes("Câu") || segment.content.includes("Bài")) && segment.content.length > 50) {
              segmentHtml += writingLines;
          }
      }

    } else if (segment.type === 'tikz') {
        // Embed TikZ Image
        const imgData = tikzImagesMap[segment.content];
        if (imgData) {
            // High DPI Image Embedding
            const displayWidth = Math.round(imgData.width / 4);
            const displayHeight = Math.round(imgData.height / 4);
            
            const finalWidth = displayWidth > 0 ? displayWidth : 200;
            const finalHeight = displayHeight > 0 ? displayHeight : Math.round(200 * (imgData.height/imgData.width));

            segmentHtml += `<p style="text-align: center; margin: 12pt 0;"><img src="${imgData.base64}" width="${finalWidth}" height="${finalHeight}" /></p>`;
        } else {
            segmentHtml += `<p style="color: red; font-weight: bold;">[TikZ Image Error - Check Internet or Syntax]</p>`;
        }

    } else {
        // Math
        try {
            const mathML = katex.renderToString(segment.content, {
            throwOnError: false,
            output: 'mathml',
            displayMode: segment.displayMode,
            });

            const mathMatch = mathML.match(/<math[\s\S]*?<\/math>/);
            if (mathMatch) {
                let cleanMath = mathMatch[0];
                cleanMath = cleanMath.replace(/<annotation encoding="application\/x-tex">[\s\S]*?<\/annotation>/, '');
                
                if (segment.displayMode) {
                    segmentHtml += `<p class="equation" style="text-align: center; margin: 12pt 0;">${cleanMath}</p>`;
                    if (style === 'worksheet') {
                        segmentHtml += '<p style="margin-bottom: 30pt;">&nbsp;</p>';
                    }
                } else {
                    // --- INTELLIGENT SPACING FIX FOR INLINE MATH ---
                    // Prevent math from sticking to text in Word
                    // This logic complements the text segment fix above.
                    
                    let prefix = "";
                    let suffix = "";

                    // Check Previous Segment
                    const prev = segments[index - 1];
                    // If prev is text and DOES NOT end with space/newline/bracket in raw content -> Add space
                    if (prev && prev.type === 'text') {
                        if (!/[\s\u00A0\(\[\{]$/.test(prev.content)) {
                            prefix = "&#160;"; 
                        }
                    }

                    // Check Next Segment
                    const next = segments[index + 1];
                    // If next is text and DOES NOT start with space/punctuation in raw content -> Add space
                    if (next && next.type === 'text') {
                        if (!/^[\s\u00A0.,;!?:)\]\}]/.test(next.content)) {
                            suffix = "&#160;";
                        }
                    }

                    segmentHtml += `${prefix}${cleanMath}${suffix}`;
                }
            } else {
                segmentHtml += `[Equation Error]`;
            }
        } catch (e) {
            segmentHtml += `[LaTeX Error]`;
        }
    }

    // Accumulate
    if (isFlashcard && (segment.type === 'text' && segmentHtml.trim().length > 0 || segment.displayMode)) {
        bodyContent += `<div class="flashcard">${segmentHtml}</div>`;
    } else {
        bodyContent += segmentHtml;
    }
  });

  // --- Dynamic CSS ---
  let pageMargin = '1in';
  let orientation = 'portrait';
  let fontSize = '13pt'; // Standard for Vietnam Documents (usually 13 or 14)
  let fontFamily = "'Times New Roman', serif";
  let lineHeight = '1.3'; // Standard academic spacing
  let extraCss = '';

  switch (style) {
      case 'notes': pageMargin = '1in 1in 1in 2.5in'; break;
      case 'minimal': pageMargin = '0.5in'; lineHeight = '1.2'; break;
      case 'two-column': 
          pageMargin = '0.5in';
          extraCss = `.Section1 { column-count: 2; column-gap: 36pt; }`;
          break;
      case 'landscape': orientation = 'landscape'; break;
      case 'large-print': fontSize = '16pt'; fontFamily = "Arial, sans-serif"; lineHeight = '1.6'; break;
      case 'draft': lineHeight = '2.0'; pageMargin = '1.5in'; break;
      case 'flashcards':
          extraCss = `.flashcard { border: 2px solid #000; padding: 15pt; margin: 15pt 0; page-break-inside: avoid; background-color: #ffffff; }`;
          break;
  }

  const headingColor1 = (style === 'minimal' || style === 'draft') ? '#000000' : '#2E74B5';
  const headingColor2 = (style === 'minimal' || style === 'draft') ? '#000000' : '#1F4D78';
  const tableHeaderBg = (style === 'minimal' || style === 'draft') ? '#ffffff' : '#f2f2f2';

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Export</title>
        <style>
            @page { margin: ${pageMargin}; size: ${orientation}; }
            body { 
                font-family: ${fontFamily}; 
                font-size: ${fontSize}; 
                line-height: ${lineHeight}; 
                color: #000000; 
            }
            /* Explicitly force Times New Roman on all blocks to override defaults */
            body, p, div, span, h1, h2, h3, h4, h5, h6, table, td, th, li {
                font-family: ${style === 'large-print' ? 'Arial, sans-serif' : "'Times New Roman', serif"} !important;
            }
            h1 { font-size: 1.4em; color: ${headingColor1}; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; }
            h2 { font-size: 1.2em; color: ${headingColor1}; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
            h3 { font-size: 1.1em; color: ${headingColor2}; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
            .text-run { white-space: pre-wrap; }
            p.equation { margin: 12pt 0; text-align: center; }
            table { border-collapse: collapse; width: 100%; margin: 12pt 0; border: 1px solid black; }
            td, th { border: 1px solid black; padding: 6px 8px; vertical-align: top; }
            th { background-color: ${tableHeaderBg}; font-weight: bold; }
            ${extraCss}
        </style>
    </head>
    <body>
        <div class="Section1">
            ${bodyContent}
            <br/><hr/>
            <p style="text-align: center; color: #2E74B5; font-size: 10pt; font-weight: bold; margin-top: 20pt;">
                Biên soạn bởi MathDoc AI
            </p>
        </div>
    </body>
    </html>
  `;

  return asBlob(fullHtml, {
      orientation: orientation as 'portrait' | 'landscape',
      margins: { top: 720, bottom: 720, left: 720, right: 720 }
  }) as Promise<Blob>;
};