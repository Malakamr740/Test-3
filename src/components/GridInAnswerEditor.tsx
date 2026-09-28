// GridInAnswerEditor.tsx
interface GridInAnswerEditorProps {
  value: { value: string; tolerance: string }
  onChange: (value: { value: string; tolerance: string }) => void
}

export default function GridInAnswerEditor({ value, onChange }: GridInAnswerEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correct numeric answer
        </label>
        <input
          type="number"
          step="any"
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className="w-full border border-slate-300 rounded-md px-3 py-2"
          placeholder="e.g. 42.5"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tolerance (optional)
        </label>
        <input
          type="number"
          step="any"
          min="0"
          value={value.tolerance}
          onChange={(e) => onChange({ ...value, tolerance: e.target.value })}
          className="w-full border border-slate-300 rounded-md px-3 py-2"
          placeholder="0 = exact match required"
        />
        <p className="text-xs text-slate-500 mt-1">
          Student answers within this range of the correct value will be marked correct.
        </p>
      </div>
    </div>
  )
}