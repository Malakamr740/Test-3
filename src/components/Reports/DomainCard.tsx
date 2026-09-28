import type { DomainPerformance } from './Types'

interface DomainCardProps {
  domain: DomainPerformance
  type: 'strong' | 'weak'
}

export default function DomainCard({ domain, type }: DomainCardProps) {
  const isStrong = type === 'strong'

  return (
    <div
      className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${
        isStrong
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30'
          : 'border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isStrong ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isStrong ? 'Strong Domain' : 'Focus Area'}
            </span>
            <span className="text-xs text-slate-500 capitalize">{domain.domainType}</span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-slate-900">{domain.domainName}</h3>
        </div>

        <div className="text-right">
          <div
            className={`text-2xl font-bold tracking-tight ${
              isStrong ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {domain.accuracyPct}%
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {domain.correct} / {domain.total} correct
          </div>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${
            isStrong ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, domain.accuracyPct))}%` }}
        />
      </div>

      {/* Verbosity-Level-2 Explanation: 2 Sentences */}
      <div className="mt-4 space-y-1.5 rounded-xl bg-white/80 p-3.5 border border-slate-100 text-xs sm:text-sm">
        <p className="font-medium text-slate-800 leading-relaxed">
          {domain.performanceFact}
        </p>
        <p className="text-slate-600 leading-relaxed">
          {domain.actionableInsight}
        </p>
      </div>

      {/* Footer Metrics */}
      <div className="mt-3.5 flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
          Avg Pace: <strong className="text-slate-700">{domain.avgTimeSec}s</strong> / question
        </span>
        {domain.unanswered > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            {domain.unanswered} unanswered
          </span>
        )}
      </div>
    </div>
  )
}
