import { InlineMath } from 'react-katex'
import type { ContentBlock } from './ContentBlockRenderer'

export interface Choice {
  content_blocks: ContentBlock[]
  is_correct: boolean
}

interface ChoicesEditorProps {
  choices: Choice[]
  onChange: (choices: Choice[]) => void
}

export default function ChoicesEditor({ choices, onChange }: ChoicesEditorProps) {
  function addChoice() {
    onChange([...choices, { content_blocks: [{ type: 'text', value: '' }], is_correct: false }])
  }

  function updateChoiceText(index: number, value: string) {
    const next = [...choices]
    // For simplicity, each choice is treated as a single text block for now.
    // Math-in-choices support (e.g. "√5") can reuse ContentBlockEditor later
    // if teachers need richer choice content — starting simple per your rules.
    next[index] = { ...next[index], content_blocks: [{ type: 'text', value }] }
    onChange(next)
  }

  function setCorrect(index: number) {
    // MCQ = exactly one correct choice, so selecting one clears the others.
    const next = choices.map((choice, i) => ({ ...choice, is_correct: i === index }))
    onChange(next)
  }

  function removeChoice(index: number) {
    onChange(choices.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {choices.map((choice, index) => {
        const textValue: string =
          (choice.content_blocks?.[0]?.type === 'text' ? choice.content_blocks[0].value : '') || ''

        return (
          <div key={index} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct-choice"
              checked={choice.is_correct}
              onChange={() => setCorrect(index)}
              title="Mark as correct answer"
            />
            <input
              type="text"
              value={textValue}
              onChange={(e) => updateChoiceText(index, e.target.value)}
              placeholder={`Choice ${index + 1}`}
              className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
            {textValue.includes('\\') && (
              <div className="text-sm bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <InlineMath math={textValue} />
              </div>
            )}
            <button
              type="button"
              onClick={() => removeChoice(index)}
              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
            >
              Remove
            </button>
          </div>
        )
      })}

      <button
        type="button"
        onClick={addChoice}
        className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300"
      >
        + Add Choice
      </button>

      {choices.length > 0 && !choices.some((c) => c.is_correct) && (
        <p className="text-sm text-amber-600">Select which choice is correct.</p>
      )}
    </div>
  )
}