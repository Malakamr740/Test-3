import { useRef, useState, useEffect } from 'react'
import ContentBlockRenderer from './ContentBlockRenderer'
import ImageUploadButton from './ImageUploadButton'
import TableBlockEditor from './TableBlockEditor'
import {
  type ContentBlock,
  type EditorItem,
  type TextEditorItem,
  blocksToEditorItems,
  editorItemsToBlocks,
} from '../lib/contentBlocks'

interface ContentTextEditorProps {
  initialBlocks?: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  placeholder?: string
}

export default function ContentTextEditor({
  initialBlocks,
  onChange,
  placeholder,
}: ContentTextEditorProps) {
  const [items, setItems] = useState<EditorItem[]>(() => blocksToEditorItems(initialBlocks ?? []))
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  useEffect(() => {
    onChange(editorItemsToBlocks(items))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  function addTextItem() {
    setItems([...items, { id: crypto.randomUUID(), kind: 'text', text: '' }])
  }

  function addImageItem(url: string) {
    setItems([...items, { id: crypto.randomUUID(), kind: 'image', url }])
  }

  function addTableItem() {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        kind: 'table',
        rows: [
          ['', ''],
          ['', ''],
        ],
      },
    ])
  }

  function updateItem(id: string, updated: EditorItem) {
    setItems(items.map((item) => (item.id === id ? updated : item)))
  }

  function removeItem(id: string) {
    setItems(items.filter((item) => item.id !== id))
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= items.length) return
    const next = [...items]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    setItems(next)
  }

  function insertMathMarkers(item: TextEditorItem) {
    const el = textareaRefs.current[item.id]
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const before = item.text.slice(0, start)
    const after = item.text.slice(end)
    updateItem(item.id, { ...item, text: `${before}$$${after}` })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + 1, start + 1)
    })
  }

  const previewBlocks = editorItemsToBlocks(items)

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-md p-3"
        >
          <div className="flex flex-col gap-1 pt-1">
            <button
              type="button"
              onClick={() => moveItem(index, -1)}
              disabled={index === 0}
              className="text-xs px-1.5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveItem(index, 1)}
              disabled={index === items.length - 1}
              className="text-xs px-1.5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30"
            >
              ↓
            </button>
          </div>

          <div className="flex-1">
            <p className="text-xs font-medium text-slate-400 uppercase mb-1">{item.kind}</p>

            {item.kind === 'text' && (
              <div className="flex gap-2">
                <textarea
                  ref={(el) => {
                    textareaRefs.current[item.id] = el
                  }}
                  value={item.text}
                  onChange={(e) => updateItem(item.id, { ...item, text: e.target.value })}
                  placeholder={placeholder ?? 'Type text. Wrap math in $ $, e.g. If $x=3$...'}
                  rows={3}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-900 font-mono text-sm resize-y"
                />
                <button
                  type="button"
                  onClick={() => insertMathMarkers(item)}
                  title="Insert math markers at cursor"
                  className="text-sm bg-purple-100 text-purple-700 px-3 py-2 rounded-md hover:bg-purple-200 whitespace-nowrap h-fit"
                >
                  √ Insert Math
                </button>
              </div>
            )}

            {item.kind === 'image' && (
              <div className="space-y-2.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="w-full bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center">
                  <img src={item.url} alt="" className="w-full max-h-72 object-contain rounded-md mx-auto" />
                </div>
                <input
                  type="text"
                  value={item.caption ?? ''}
                  onChange={(e) => updateItem(item.id, { ...item, caption: e.target.value })}
                  placeholder="Caption (optional — blank for a plain image, filled in for a labeled figure)"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
                />
              </div>
            )}

            {item.kind === 'table' && (
              <TableBlockEditor
                rows={item.rows}
                onChange={(rows) => updateItem(item.id, { ...item, rows })}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 mt-1"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-1 items-center">
        <button
          type="button"
          onClick={addTextItem}
          className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300"
        >
          + Add Text
        </button>
        <ImageUploadButton onUploaded={addImageItem} />
        <button
          type="button"
          onClick={addTableItem}
          className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300"
        >
          + Add Table
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Wrap math in <code className="bg-slate-100 px-1 rounded">$...$</code> within any text
        block. New items are added at the bottom — use ↑/↓ to arrange them in any order.
      </p>

      {items.length > 0 && (
        <div className="mt-2 pt-3 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase mb-2">Preview (final order)</p>
          <div className="bg-slate-50 rounded-md p-4 text-lg text-slate-900">
            <ContentBlockRenderer blocks={previewBlocks} />
          </div>
        </div>
      )}
    </div>
  )
}