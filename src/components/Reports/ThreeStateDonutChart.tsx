interface ThreeStateSummaryProps {
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  total: number
}

export function ThreeStateBadge({
  status,
}: {
  status: 'correct' | 'incorrect' | 'unanswered' | string
}) {
  switch (status) {
    case 'correct':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Correct
        </span>
      )
    case 'incorrect':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
          <svg className="h-3 w-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Incorrect
        </span>
      )
    case 'unanswered':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="9" strokeWidth={2} strokeDasharray="3 3" />
          </svg>
          Unanswered
        </span>
      )
  }
}

export default function ThreeStateDonutChart({
  correctCount,
  incorrectCount,
  unansweredCount,
  total,
}: ThreeStateSummaryProps) {
  const safeTotal = total > 0 ? total : correctCount + incorrectCount + unansweredCount
  const correctPct = safeTotal > 0 ? Math.round((correctCount / safeTotal) * 100) : 0
  const incorrectPct = safeTotal > 0 ? Math.round((incorrectCount / safeTotal) * 100) : 0
  const unansweredPct = safeTotal > 0 ? Math.max(0, 100 - correctPct - incorrectPct) : 0

  // SVG Donut calculation
  const radius = 38
  const circumference = 2 * Math.PI * radius // ~238.76

  const correctStroke = (correctPct / 100) * circumference
  const incorrectStroke = (incorrectPct / 100) * circumference
  const unansweredStroke = (unansweredPct / 100) * circumference

  const correctOffset = 0
  const incorrectOffset = -correctStroke
  const unansweredOffset = -(correctStroke + incorrectStroke)

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* SVG Donut */}
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="12"
          />

          {/* Correct arc */}
          {correctPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="12"
              strokeDasharray={`${correctStroke} ${circumference}`}
              strokeDashoffset={correctOffset}
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* Incorrect arc */}
          {incorrectPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f43f5e"
              strokeWidth="12"
              strokeDasharray={`${incorrectStroke} ${circumference}`}
              strokeDashoffset={incorrectOffset}
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* Unanswered arc */}
          {unansweredPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#94a3b8"
              strokeWidth="12"
              strokeDasharray={`${unansweredStroke} ${circumference}`}
              strokeDashoffset={unansweredOffset}
              className="transition-all duration-500 ease-out"
            />
          )}
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tracking-tight text-slate-900">{correctPct}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Accuracy
          </span>
        </div>
      </div>

      {/* Legend & Breakdown stats */}
      <div className="flex-1 w-full space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {/* Correct */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Correct
            </div>
            <div className="mt-1 text-lg font-bold text-emerald-700">{correctCount}</div>
            <div className="text-xs text-emerald-600/80 font-medium">{correctPct}% of total</div>
          </div>

          {/* Incorrect */}
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-rose-800">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              Incorrect
            </div>
            <div className="mt-1 text-lg font-bold text-rose-700">{incorrectCount}</div>
            <div className="text-xs text-rose-600/80 font-medium">{incorrectPct}% of total</div>
          </div>

          {/* Unanswered */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              Unanswered
            </div>
            <div className="mt-1 text-lg font-bold text-slate-700">{unansweredCount}</div>
            <div className="text-xs text-slate-500 font-medium">{unansweredPct}% of total</div>
          </div>
        </div>

        {/* Stacked bar for linear representation */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 flex">
          <div style={{ width: `${correctPct}%` }} className="h-full bg-emerald-500" title={`Correct: ${correctPct}%`} />
          <div style={{ width: `${incorrectPct}%` }} className="h-full bg-rose-500" title={`Incorrect: ${incorrectPct}%`} />
          <div style={{ width: `${unansweredPct}%` }} className="h-full bg-slate-400" title={`Unanswered: ${unansweredPct}%`} />
        </div>
      </div>
    </div>
  )
}
