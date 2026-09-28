import { useState } from 'react'
import type { ReactNode } from 'react'
import ContentBlockRenderer from '../ContentBlockRenderer'
import type { ChoiceOption, QuestionReviewItem } from './Types'
import { classifyQuestionState } from '../../lib/diagnosticAnalytics'
import { ThreeStateBadge } from './ThreeStateDonutChart'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
      <span className="font-semibold text-slate-500">{label}:</span> {value}
    </span>
  )
}

function ChoiceText({ id, choices }: { id: string; choices: ChoiceOption[] }) {
  const c = choices.find((ch) => ch.id === id)
  if (!c) return <>{id}</>
  return <ContentBlockRenderer blocks={c.content_blocks} />
}

function formatAnswer(ans: Record<string, unknown>, choices: ChoiceOption[], status: string): ReactNode {
  if (status === 'unanswered' || !ans || Object.keys(ans).length === 0 || ans.unanswered === true) {
    return (
      <span className="inline-flex items-center gap-1 text-xs italic text-slate-500 font-medium">
        Unanswered — no response was recorded before submission
      </span>
    )
  }

  const raw = ans.choice_ids ?? ans.choice_id ?? ans.selected_choice_ids
  if (raw !== undefined) {
    const ids = Array.isArray(raw) ? raw : [raw]
    return (
      <div className="space-y-1">
        {ids.map((id: string, i: number) => (
          <div key={i}>
            <ChoiceText id={String(id)} choices={choices} />
          </div>
        ))}
      </div>
    )
  }
  if (ans.value !== undefined) return <>{String(ans.value)}</>
  if (ans.text !== undefined) return <>{String(ans.text)}</>
  if (ans.numerical !== undefined) return <>{String(ans.numerical)}</>
  return <>{JSON.stringify(ans)}</>
}

function formatCorrect(q: QuestionReviewItem): ReactNode {
  if (q.choices?.length) {
    const correct = q.choices.filter((c) => c.is_correct)
    if (correct.length)
      return (
        <div className="space-y-1">
          {correct.map((c) => (
            <div key={c.id}>
              <ContentBlockRenderer blocks={c.content_blocks} />
            </div>
          ))}
        </div>
      )
  }
  if (q.correct_answer_data?.value !== undefined)
    return (
      <>
        {String(q.correct_answer_data.value)}
        {q.correct_answer_data.tolerance ? ` ±${q.correct_answer_data.tolerance}` : ''}
      </>
    )
  return <span className="italic text-slate-400">Not available</span>
}

interface Props {
  question: QuestionReviewItem
  index: number
  avgTime?: number
  highlight?: boolean
}

export default function QuestionReviewCard({ question, index, avgTime, highlight }: Props) {
  const [open, setOpen] = useState(false)
  const questionStatus = classifyQuestionState(question)
  const timeRatio = avgTime && avgTime > 0 ? Math.min(question.time_spent_seconds / avgTime, 2) : 0
  const paceTone =
    timeRatio > 1.3 ? 'bg-amber-500' : timeRatio < 0.6 ? 'bg-sky-500' : 'bg-slate-400'

  return (
    <div
      id={`q-${question.question_id}`}
      className={`rounded-2xl border bg-white shadow-sm transition ${
        highlight ? 'border-primary-400 ring-2 ring-primary-100' : 'border-slate-200'
      }`}
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-4 p-5 text-left">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Question {index + 1}</span>
            <ThreeStateBadge status={questionStatus} />
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
              {question.difficulty}
            </span>
          </div>
          <div className="mt-2 max-w-none text-slate-800">
            <ContentBlockRenderer blocks={question.content_blocks} />
          </div>
        </div>
        <span className="mt-1 shrink-0 text-xs font-semibold text-slate-400">
          {open ? 'Hide details ▲' : 'Show details ▼'}
        </span>
      </button>

      <div className={`space-y-4 border-t border-slate-100 p-5 ${open ? 'block' : 'hidden'} print:block`}>
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Time spent:{' '}
              <strong className="text-slate-700">{formatTime(question.time_spent_seconds)}</strong>
            </span>
            {avgTime ? <span>Test Average: {formatTime(avgTime)}</span> : null}
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${paceTone}`} style={{ width: `${Math.min(timeRatio * 50, 100)}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {question.category_name && <Tag label="Category" value={question.category_name} />}
          {question.lesson_name && <Tag label="Lesson" value={question.lesson_name} />}
          {question.skill_name && <Tag label="Skill" value={question.skill_name} />}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={`rounded-xl border p-3.5 ${
            questionStatus === 'unanswered'
              ? 'border-slate-200 bg-slate-50/70'
              : questionStatus === 'correct'
              ? 'border-emerald-200 bg-emerald-50/40'
              : 'border-rose-200 bg-rose-50/40'
          }`}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Student Response
            </div>
            <div className="mt-1.5 text-sm text-slate-800">
              {formatAnswer(question.student_answer, question.choices, questionStatus)}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Expected Solution
            </div>
            <div className="mt-1.5 text-sm text-slate-800">{formatCorrect(question)}</div>
          </div>
        </div>

        {question.explanation_blocks?.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Step-by-Step Diagnostic Explanation
            </div>
            <div className="mt-2 max-w-none text-slate-800">
              <ContentBlockRenderer blocks={question.explanation_blocks} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
