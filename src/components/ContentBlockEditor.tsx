import { useRef } from 'react'
import { InlineMath } from 'react-katex'
import type { ContentBlock } from './ContentBlockRenderer'

interface ContentBlockEditorProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}

export default function ContentBlockEditor({ blocks, onChange }: ContentBlockEditorProps) {
  // Tracks the actual <input> DOM elements so we can read cursor position
  // (selectionStart) when the teacher clicks "Insert Math Here".
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  function addTextBlock() {
    onChange([...blocks, { type: 'text', value: '' }])
  }

  function addNewLine() {
    onChange([...blocks, { type: 'break' }])
  }

  function updateTextBlock(index: number, value: string) {
    const next = [...blocks]
    next[index] = { type: 'text', value }
    onChange(next)
  }

  function updateMathBlock(index: number, latex: string) {
    const next = [...blocks]
    next[index] = { type: 'math', latex }
    onChange(next)
  }

  // The core new feature: splits a text block into
  // [text-before-cursor, empty-math-block, text-after-cursor]
  function insertMathAtCursor(index: number) {
    const block = blocks[index]
    if (block.type !== 'text') return

    const inputEl = inputRefs.current[index]
    const blockVal = block.value ?? block.content ?? block.text ?? ''
    const cursorPos = inputEl?.selectionStart ?? blockVal.length

    const before = blockVal.slice(0, cursorPos)
    const after = blockVal.slice(cursorPos)

    const next = [...blocks]
    next.splice(
      index,
      1,
      { type: 'text', value: before },
      { type: 'math', latex: '' },
      { type: 'text', value: after }
    )
    onChange(next)
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index))
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex flex-col gap-1 pt-1">
            <button
              type="button"
              onClick={() => moveBlock(index, -1)}
              disabled={index === 0}
              className="text-xs px-1.5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveBlock(index, 1)}
              disabled={index === blocks.length - 1}
              className="text-xs px-1.5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30"
            >
              ↓
            </button>
          </div>

          <div className="flex-1">
            {block.type === 'text' && (
              <div className="flex gap-2">
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  value={block.value}
                  onChange={(e) => updateTextBlock(index, e.target.value)}
                  placeholder="Type text..."
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => insertMathAtCursor(index)}
                  title="Insert math at cursor position"
                  className="text-sm bg-purple-100 text-purple-700 px-3 py-2 rounded-md hover:bg-purple-200 whitespace-nowrap"
                >
                  √ Insert Math
                </button>
              </div>
            )}

            {block.type === 'math' && (
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-md p-2">
                <input
                  type="text"
                  value={block.latex || ''}
                  onChange={(e) => updateMathBlock(index, e.target.value)}
                  placeholder="LaTeX, e.g. \sqrt{x+3}"
                  className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-mono"
                  autoFocus={block.latex === ''}
                />
                {block.latex && (
                  <div className="bg-white border border-slate-200 rounded-md px-3 py-1.5 min-w-[3rem]">
                    <InlineMath math={block.latex} />
                  </div>
                )}
              </div>
            )}

            {block.type === 'break' && (
              <div className="text-xs text-slate-400 italic border-t border-dashed border-slate-300 pt-1">
                ↵ New line
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => removeBlock(index)}
            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 mt-1"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={addTextBlock}
          className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300"
        >
          + Add Text
        </button>
        <button
          type="button"
          onClick={addNewLine}
          className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300"
        >
          ↵ New Line
        </button>
      </div>

      {/* Live preview of the full question as it will appear to students */}
      {blocks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase mb-2">Preview</p>
          <div className="bg-slate-50 rounded-md p-4 text-lg text-slate-900 leading-relaxed">
            {blocks.map((block, index) => {
              if (block.type === 'text') return <span key={index}>{block.value}</span>
              if (block.type === 'math')
                return (
                  <span key={index} className="mx-1 inline-block align-middle">
                    <InlineMath math={block.latex || ''} />
                  </span>
                )
              if (block.type === 'break') return <br key={index} />
              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}