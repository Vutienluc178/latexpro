import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { TextSegment } from '../types';
import { getTikzImageUrl } from '../utils/converter';

interface MathPreviewProps {
  segments: TextSegment[];
  isRichText: boolean;
}

export const MathPreview: React.FC<MathPreviewProps> = ({ segments, isRichText }) => {
  if (isRichText) {
    const htmlContent = segments.map(segment => {
      if (segment.type === 'text') {
        return segment.content;
      } else if (segment.type === 'tikz') {
        // For Rich Text mode preview, we try to embed the image too
        const imgUrl = getTikzImageUrl(segment.content);
        return `<div class="my-4 text-center"><img src="${imgUrl}" alt="TikZ Diagram" class="max-w-full mx-auto" /></div>`;
      } else {
        try {
          return katex.renderToString(segment.content, {
            throwOnError: false,
            displayMode: segment.displayMode,
            output: 'html',
            trust: true,
          });
        } catch (e) {
          return `<span class="text-red-500 bg-red-50 px-1 border border-red-200 rounded text-xs font-mono" title="${e}">[LaTeX Error]</span>`;
        }
      }
    }).join('');

    return (
      <div 
        className="prose max-w-none p-8 bg-white min-h-full leading-relaxed shadow-sm
          [&_p]:my-3 [&_h1]:text-[#2E74B5] [&_h1]:font-bold [&_h1]:text-2xl [&_h1]:mt-6 [&_h1]:mb-3
          [&_h2]:text-[#2E74B5] [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-5 [&_h2]:mb-2
          [&_h3]:text-[#1F4D78] [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2
          [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6
          [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
          [&_td]:border [&_td]:border-black [&_td]:p-2 [&_td]:align-top
          [&_th]:border [&_th]:border-black [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:font-bold"
        style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // Original Text Mode rendering
  return (
    <div 
      className="prose max-w-none p-8 bg-white min-h-full leading-relaxed shadow-sm"
      style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt' }}
    >
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
             <HighlightedText key={index} content={segment.content} />
          );
        } else if (segment.type === 'tikz') {
            return (
                <div key={index} className="my-6 text-center group relative">
                    <img 
                        src={getTikzImageUrl(segment.content)} 
                        alt="TikZ Diagram" 
                        className="mx-auto max-w-full"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <div className="hidden text-red-500 text-sm font-mono bg-red-50 p-2 border border-red-200 rounded mt-2 text-left">
                        Error rendering TikZ. Please check syntax.<br/>
                        <pre className="text-xs mt-1 overflow-x-auto">{segment.content}</pre>
                    </div>
                </div>
            )
        } else {
          return (
            <LatexSegment 
                key={index} 
                content={segment.content} 
                displayMode={segment.displayMode} 
            />
          );
        }
      })}
    </div>
  );
};

// Component to handle highlighting of "Câu/Bài" in Preview
const HighlightedText: React.FC<{ content: string }> = ({ content }) => {
    const regex = /((?:^|\n)(?:Câu|Bài)\s+[\dIVX]+[.:]?)|((?:^|\n)[a-z]\)\s)/gi;
    const parts = content.split(regex);

    return (
        <span className="whitespace-pre-wrap">
            {parts.map((part, i) => {
                if (!part) return null;
                if (/^(?:\n)?(Câu|Bài)\s+[\dIVX]+[.:]?/i.test(part)) {
                    return <span key={i} className="font-bold text-brand-600">{part}</span>;
                }
                if (/^(?:\n)?[a-z]\)\s/i.test(part)) {
                     return <span key={i} className="font-bold text-brand-700">{part}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

const LatexSegment: React.FC<{ content: string; displayMode?: boolean }> = ({ content, displayMode }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(content, containerRef.current, {
          throwOnError: false, // Don't crash
          displayMode: displayMode,
          output: 'html',
          trust: true,
          strict: false // Less complaining in console
        });
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown LaTeX Error');
      }
    }
  }, [content, displayMode]);

  if (error) {
      return (
          <span className="inline-block px-1 py-0.5 bg-red-50 border border-red-200 text-red-600 text-xs font-mono rounded" title={error}>
              {content}
          </span>
      );
  }

  return <span ref={containerRef} className={displayMode ? "block my-4 text-center overflow-x-auto" : "inline-block"} />;
};