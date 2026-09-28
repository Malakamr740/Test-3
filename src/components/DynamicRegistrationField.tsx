interface RegistrationField {
  id: string
  label: string
  field_key: string
  field_type: 'text' | 'email' | 'phone' | 'number' | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'textarea'
  is_required: boolean
  options: string[] | null
}

interface DynamicRegistrationFieldProps {
  field: RegistrationField
  value: string
  onChange: (value: string) => void
  error?: string
}

export default function DynamicRegistrationField({
  field,
  value,
  onChange,
  error,
}: DynamicRegistrationFieldProps) {
  const baseInputClass =
    'w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {field.label}
        {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {(field.field_type === 'text' ||
        field.field_type === 'email' ||
        field.field_type === 'phone' ||
        field.field_type === 'number' ||
        field.field_type === 'date') && (
        <input
          type={
            field.field_type === 'phone'
              ? 'tel'
              : field.field_type === 'number'
                ? 'number'
                : field.field_type
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      )}

      {field.field_type === 'textarea' && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={baseInputClass}
        />
      )}

      {field.field_type === 'dropdown' && (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={baseInputClass}>
          <option value="">— Select —</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.field_type === 'radio' && (
        <div className="flex flex-wrap gap-4 mt-1">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input
                type="radio"
                name={field.field_key}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {field.field_type === 'checkbox' && (
        <div className="flex flex-wrap gap-4 mt-1">
          {(field.options ?? []).map((opt) => {
            const selected = value.split(',').filter(Boolean)
            const isChecked = selected.includes(opt)
            return (
              <label key={opt} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const next = isChecked
                      ? selected.filter((s) => s !== opt)
                      : [...selected, opt]
                    onChange(next.join(','))
                  }}
                />
                {opt}
              </label>
            )
          })}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}