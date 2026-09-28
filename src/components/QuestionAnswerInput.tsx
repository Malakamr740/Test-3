import ContentBlockRenderer, { type ContentBlock } from './ContentBlockRenderer'

interface ChoiceOption {
  id: string
  content_blocks: ContentBlock[]
}

interface QuestionAnswerInputProps {
  answerTypeCode: string
  choices: ChoiceOption[]
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

export default function QuestionAnswerInput({
  answerTypeCode,
  choices,
  value,
  onChange,
}: QuestionAnswerInputProps) {
  if (answerTypeCode === 'MCQ') {
    return (
      <div className="space-y-2">
        {choices.map((choice) => (
          <label
            key={choice.id}
            className={`flex items-start gap-3 border rounded-md px-4 py-3 cursor-pointer transition ${
              value.choice_id === choice.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="mcq-choice"
              checked={value.choice_id === choice.id}
              onChange={() => onChange({ choice_id: choice.id })}
              className="mt-1"
            />
            <span className="text-slate-900">
              <ContentBlockRenderer blocks={choice.content_blocks} />
            </span>
          </label>
        ))}
      </div>
    )
  }

  if (answerTypeCode === 'TRUE_FALSE') {
    return (
      <div className="flex gap-3">
        {[true, false].map((option) => (
          <label
            key={String(option)}
            className={`flex-1 text-center border rounded-md px-4 py-3 cursor-pointer transition ${
              value.value === option
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="true-false"
              checked={value.value === option}
              onChange={() => onChange({ value: option })}
              className="sr-only"
            />
            {option ? 'True' : 'False'}
          </label>
        ))}
      </div>
    )
  }

  if (answerTypeCode === 'GRID_IN') {
    return (
      <input
        type="text"
        inputMode="decimal"
        value={(value.value as string) ?? ''}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder="Enter your answer"
        className="w-full max-w-xs rounded-md border border-slate-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )
  }

  return <p className="text-red-600 text-sm">Unsupported answer type: {answerTypeCode}</p>
}