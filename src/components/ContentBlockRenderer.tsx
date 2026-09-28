import React, { useState } from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import { ImageIcon, Maximize2, X } from 'lucide-react'
import MathRenderer from './MathRenderer'

export interface ContentBlock {
  id?: string
  type: 'text' | 'math' | 'latex' | 'image' | 'paragraph' | 'break' | string
  content?: string
  text?: string
  value?: string
  latex?: string
  url?: string
  caption?: string
}

interface ContentBlockRendererProps {
  blocks?: ContentBlock[] | string | null
  className?: string
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({
  blocks,
  className = '',
}) => {
  const [activeZoomImage, setActiveZoomImage] = useState<{ url: string; caption?: string } | null>(null)

  if (!blocks) return null

  // If passed a simple string
  if (typeof blocks === 'string') {
    return (
      <span className={className}>
        <MathRenderer text={blocks} />
      </span>
    )
  }

  if (!Array.isArray(blocks)) {
    return (
      <span className={className}>
        <MathRenderer text={String(blocks)} />
      </span>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, idx) => {
        const textVal = block.content ?? block.text ?? block.value ?? ''

        if (block.type === 'latex' || block.type === 'math') {
          try {
            return (
              <div key={block.id || idx} className="my-1.5 overflow-x-auto py-1">
                <BlockMath math={textVal} />
              </div>
            )
          } catch (e) {
            return (
              <code key={block.id || idx} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-blue-700">
                {textVal}
              </code>
            )
          }
        }

        if (block.type === 'image' && (block.url || textVal)) {
          const imgUrl = block.url || textVal
          return (
            <div
              key={block.id || idx}
              className="my-3 w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 sm:p-4 text-center shadow-2xs overflow-hidden"
            >
              <div className="relative group flex items-center justify-center bg-white rounded-xl border border-slate-200/80 p-2 overflow-hidden">
                <img
                  src={imgUrl}
                  alt={block.caption || 'Question graphic'}
                  className="w-full max-h-[460px] sm:max-h-[500px] object-contain mx-auto rounded-lg transition-transform duration-200 group-hover:scale-[1.01]"
                />
                <button
                  type="button"
                  onClick={() => setActiveZoomImage({ url: imgUrl, caption: block.caption })}
                  className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-medium"
                  title="Click to expand diagram"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Enlarge</span>
                </button>
              </div>
              {block.caption && (
                <p className="mt-2.5 text-xs text-slate-600 font-medium italic flex items-center justify-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Figure: {block.caption}</span>
                </p>
              )}
            </div>
          )
        }

        // Inline LaTeX parsing: $...$ or standard text
        return (
          <div key={block.id || idx} className="text-xs sm:text-sm leading-relaxed text-slate-800">
            <MathRenderer text={textVal} />
          </div>
        )
      })}

      {/* Lightbox Modal for enlarged image viewing */}
      {activeZoomImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveZoomImage(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-blue-600" />
                {activeZoomImage.caption || 'Question Diagram (Full View)'}
              </span>
              <button
                type="button"
                onClick={() => setActiveZoomImage(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[78vh] overflow-auto flex items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
              <img
                src={activeZoomImage.url}
                alt={activeZoomImage.caption || 'Diagram enlarged'}
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-xs"
              />
            </div>
            {activeZoomImage.caption && (
              <p className="text-xs text-center text-slate-500 italic">
                {activeZoomImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentBlockRenderer
