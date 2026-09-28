import React, { useState } from 'react'
import type { SurveyQuestion, ActionPlan } from '../lib/surveyService'
import { surveyService } from '../lib/surveyService'
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'

interface StudentPostAssessmentSurveyModalProps {
  attemptId: string
  scorePct?: number
  assessmentTitle?: string
  isOpen: boolean
  onComplete: (matchedPlan: ActionPlan) => void
  onSkip?: () => void
}

export const StudentPostAssessmentSurveyModal: React.FC<StudentPostAssessmentSurveyModalProps> = ({
  attemptId,
  scorePct = 50,
  assessmentTitle,
  isOpen,
  onComplete,
  onSkip,
}) => {
  const [questions] = useState<SurveyQuestion[]>(() => surveyService.getQuestions())
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<ActionPlan | null>(null)

  if (!isOpen) return null

  const currentQ = questions[currentIdx]
  const isLastQuestion = currentIdx === questions.length - 1
  const hasAnsweredCurrent = !!answers[currentQ?.id]

  const handleSelectOption = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: value,
    }))
  }

  const handleNext = () => {
    if (isLastQuestion) {
      finishSurvey()
    } else {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1)
    }
  }

  const finishSurvey = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      const plan = surveyService.saveStudentResponse(attemptId, answers, scorePct)
      setGeneratedPlan(plan)
      setIsSubmitting(false)
    }, 600)
  }

  if (generatedPlan) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
          <div className="bg-slate-900 p-6 text-white text-center relative border-b border-slate-800">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="inline-block rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-0.5 text-xs font-semibold tracking-wide uppercase">
              Personalized Plan Ready
            </span>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {generatedPlan.title}
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-md mx-auto line-clamp-2">
              {generatedPlan.tagline}
            </p>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 text-slate-700">
            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-4">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Why this plan fits you
                  </h4>
                  <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                    {generatedPlan.summary}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                Action Roadmap Preview ({generatedPlan.milestones.length} Phases)
              </h4>
              <div className="space-y-2.5">
                {generatedPlan.milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {m.title}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                          {m.timeframe}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                        {m.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {generatedPlan.prescriptive_advice?.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Key Rule of Success
                </h4>
                <p className="text-xs text-slate-700 italic">
                  "{generatedPlan.prescriptive_advice[0]}"
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Saved to your full Diagnostic Score Report
            </span>
            <button
              onClick={() => onComplete(generatedPlan)}
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="btn-primary inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              View My Diagnostic Report & Full Plan
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Quick Diagnostic Follow-Up
                </h3>
                <p className="text-[11px] text-slate-500">
                  {assessmentTitle ? `${assessmentTitle} · ` : ''}Build your customized study plan
                </p>
              </div>
            </div>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-slate-400 hover:text-slate-600 transition"
              >
                Skip
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentIdx + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
              {currentIdx + 1} of {questions.length}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-2">
              Question {currentIdx + 1}
            </span>
            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {currentQ.prompt}
            </h4>
            {currentQ.description && (
              <p className="mt-1 text-xs text-slate-500">
                {currentQ.description}
              </p>
            )}
          </div>

          <div className="space-y-2 mt-4">
            {currentQ.options?.map((opt) => {
              const isSelected = answers[currentQ.id] === opt.value
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.value)}
                  className={`w-full text-left rounded-xl p-3.5 border text-xs transition flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className="flex-1 pr-2">{opt.label}</span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={handlePrev}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            Back
          </button>

          <button
            type="button"
            disabled={currentQ.required && !hasAnsweredCurrent}
            onClick={handleNext}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="btn-primary inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-xs"
          >
            {isSubmitting ? (
              'Analyzing & Generating...'
            ) : isLastQuestion ? (
              <>
                Generate Action Plan
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentPostAssessmentSurveyModal
