import { useState, useEffect } from 'react'
import ContentBlockRenderer from './ContentBlockRenderer'
import { parseChoicesText, choicesToText, type ContentBlock } from '../lib/contentBlocks'

export interface Choice {
  content_blocks: ContentBlock[]
  is_correct: boolean
}

interface ChoicesTextEditorProps {
  initialChoices?: Choice[]
  onChange: (choices: Choice[]) => void
}

export default function ChoicesTextEditor({ initialChoices, onChange }: ChoicesTextEditorProps) {
  const [text, setText] = useState(() =>
    choicesToText((initialChoices ?? []).map((c) => c.content_blocks))
  )
  const [correctIndex, setCorrectIndex] = useState<number | null>(() => {
    const index = (initialChoices ?? []).findIndex((c) => c.is_correct)
    return index >= 0 ? index : null
  })

  const parsedChoiceBlocks = parseChoicesText(text)

  useEffect(() => {
    const choices: Choice[] = parsedChoiceBlocks.map((blocks, index) => ({
      content_blocks: blocks,
      is_correct: index === correctIndex,
    }))
    onChange(choices)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, correctIndex])

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Type one choice per line. Wrap math in $ $, e.g.\nx = 3\n$\\sqrt{5}$\nx = 8'}
        rows={4}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 font-mono text-sm resize-y"
      />
      <p className="text-xs text-slate-400">
        One choice per line. Wrap math in <code className="bg-slate-100 px-1 rounded">$...$</code>.
      </p>

      {parsedChoiceBlocks.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase">Select the correct answer</p>
          {parsedChoiceBlocks.map((blocks, index) => (
            <label
              key={index}
              className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 cursor-pointer"
            >
              <input
                type="radio"
                name="correct-choice"
                checked={correctIndex === index}
                onChange={() => setCorrectIndex(index)}
                className="mt-1"
              />
              <span className="text-slate-900 break-words [overflow-wrap:anywhere] min-w-0">
                <ContentBlockRenderer blocks={blocks} />
              </span>
            </label>
          ))}
          {correctIndex === null && (
            <p className="text-sm text-amber-600">Select which choice is correct.</p>
          )}
        </div>
      )}
    </div>
  )
}