import type { TimeAnalysisResult } from './Types'

interface TimeAnalysisSectionProps {
  timeAnalysis: TimeAnalysisResult
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
  const rem = s % 60
  return m > 0 ? `${m}m ${rem}s` : `${s}s`
}

export default function TimeAnalysisSection({ timeAnalysis }: TimeAnalysisSectionProps) {
  const { overallAvgTime, categories, quickestSolved, slowestSolved, slowThresholdPct } = timeAnalysis

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Pacing & Time Analysis</h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Evaluating category pacing against the overall test benchmark of{' '}
            <strong className="text-slate-700">{formatSeconds(overallAvgTime)}</strong> per question.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Threshold: &gt;+{slowThresholdPct}% slower than average
        </span>
      </div>

      {/* Category Pacing Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Avg Pace</th>
              <th className="px-4 py-3">Benchmark Variance</th>
              <th className="px-4 py-3 text-right">Pacing Assessment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No pacing telemetry available for this attempt.
                </td>
              </tr>
            ) : (
              categories.map((c) => {
                const isSlow = c.flaggedSlow
                const isFaster = c.deltaFromOverallPct < -10

                return (
                  <tr key={c.category} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.category}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.questionCount} {c.questionCount === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {formatSeconds(c.avgTimeSec)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          c.deltaFromOverallPct > 0
                            ? isSlow
                              ? 'text-rose-600'
                              : 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {c.deltaFromOverallPct > 0 ? `+${c.deltaFromOverallPct}%` : `${c.deltaFromOverallPct}%`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSlow ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Took longer than expected
                        </span>
                      ) : isFaster ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Brisk pace
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          On target
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Highlighted Extremes: Quickest vs Slowest Question Solved */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {/* Quickest Question Solved */}
        <div className="flex items-start gap-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Quickest Question Solved
            </div>
            {quickestSolved ? (
              <div className="mt-1">
                <div className="text-sm font-semibold text-slate-900">
                  {quickestSolved.category_name || 'General Question'}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-bold text-emerald-700">
                    {formatSeconds(quickestSolved.time_spent_seconds)}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5 text-emerald-700 font-medium">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Correct
                  </span>
                  <span>·</span>
                  <span className="capitalize">{quickestSolved.difficulty}</span>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">No correctly answered question with recorded time.</p>
            )}
          </div>
        </div>

        {/* Slowest Question Solved */}
        <div className="flex items-start gap-3.5 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Slowest Question Solved
            </div>
            {slowestSolved ? (
              <div className="mt-1">
                <div className="text-sm font-semibold text-slate-900">
                  {slowestSolved.category_name || 'General Question'}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-bold text-amber-800">
                    {formatSeconds(slowestSolved.time_spent_seconds)}
                  </span>
                  <span>·</span>
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium ${
                      slowestSolved.is_correct || slowestSolved.status === 'correct'
                        ? 'text-emerald-700'
                        : slowestSolved.status === 'unanswered'
                        ? 'text-slate-600'
                        : 'text-rose-700'
                    }`}
                  >
                    {slowestSolved.is_correct || slowestSolved.status === 'correct' ? (
                      <>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Correct
                      </>
                    ) : slowestSolved.status === 'unanswered' ? (
                      'Unanswered'
                    ) : (
                      <>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Incorrect
                      </>
                    )}
                  </span>
                  <span>·</span>
                  <span className="capitalize">{slowestSolved.difficulty}</span>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">No time recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
