// TrueFalseAnswerEditor.tsx
interface TrueFalseAnswerEditorProps {
  value: boolean | null
  onChange: (value: boolean) => void
}

export default function TrueFalseAnswerEditor({ value, onChange }: TrueFalseAnswerEditorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Select the correct answer
      </label>
      <div className="space-y-2">
        <label className="flex items-center gap-2 border border-slate-200 rounded-md px-4 py-2 cursor-pointer hover:bg-slate-50">
          <input
            type="radio"
            name="true_false_answer"
            checked={value === true}
            onChange={() => onChange(true)}
          />
          <span>True</span>
        </label>
        <label className="flex items-center gap-2 border border-slate-200 rounded-md px-4 py-2 cursor-pointer hover:bg-slate-50">
          <input
            type="radio"
            name="true_false_answer"
            checked={value === false}
            onChange={() => onChange(false)}
          />
          <span>False</span>
        </label>
      </div>
    </div>
  )
}