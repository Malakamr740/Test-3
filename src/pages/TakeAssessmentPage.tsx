import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StudentPostAssessmentSurveyModal from '../components/StudentPostAssessmentSurveyModal'
import MathRenderer from '../components/MathRenderer'
import {
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Maximize2,
  X,
  Clock,
  Calculator as CalcIcon,
  Layers,
  Coffee,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import {
  assessmentService,
  type Assessment,
  type AssessmentSection,
  type SectionQuestionItem,
} from '../lib/assessmentService'
import { questionBankService, type QuestionBankItem } from '../lib/questionBankService'
import { attemptService } from '../lib/attemptService'

export const TakeAssessmentPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | string>>({})
  const [isSurveyOpen, setIsSurveyOpen] = useState(false)
  const [previewZoomImage, setPreviewZoomImage] = useState<{ url: string; caption?: string } | null>(null)

  // Break / Intermission State
  const [isOnBreak, setIsOnBreak] = useState(false)
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0)

  // Section Timer State
  const [sectionSecondsLeft, setSectionSecondsLeft] = useState(1800)
  const [isTimeExpired, setIsTimeExpired] = useState(false)

  // On-screen calculator modal toggle
  const [showCalculator, setShowCalculator] = useState(false)
  const [calcInput, setCalcInput] = useState('')

  // Load Attempt & Assessment
  useEffect(() => {
    async function loadTargetAssessment() {
      let targetAssessment: Assessment | null = null

      if (attemptId) {
        const storedMeta = sessionStorage.getItem(`attempt_${attemptId}`)
        if (!storedMeta) {
          setLoadError('This assessment link is invalid or expired. Please open the shared assessment link again.')
          return
        }
        try {
          const parsed = JSON.parse(storedMeta)
          if (parsed.assessmentId) {
            targetAssessment = assessmentService.getAssessmentById(parsed.assessmentId)
            if (!targetAssessment) {
              const dbList = await assessmentService.fetchAssessmentsFromDatabase()
              targetAssessment = dbList.find((a) => a.id === parsed.assessmentId) || null
            }
          }
        } catch {
          setLoadError('This assessment link is invalid or expired. Please open the shared assessment link again.')
          return
        }
      }

      if (!targetAssessment) {
        setLoadError('The assessment for this link is unavailable. Please request a new shared link.')
        return
      }

      if (targetAssessment) {
        setAssessment(targetAssessment)
        const firstSec = targetAssessment.sections[0]
        if (firstSec && firstSec.settings.timingEnabled) {
          setSectionSecondsLeft(firstSec.settings.timeLimitMinutes * 60)
        }
      }
    }

    loadTargetAssessment()
  }, [attemptId])

  // Active Section Timer
  useEffect(() => {
    if (!assessment || isOnBreak) return
    const activeSec = assessment.sections[currentSectionIdx]
    if (!activeSec || !activeSec.settings.timingEnabled) return

    const timer = setInterval(() => {
      setSectionSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [assessment, currentSectionIdx, isOnBreak])

  // Break Timer
  useEffect(() => {
    if (!isOnBreak || breakSecondsLeft <= 0) return

    const timer = setInterval(() => {
      setBreakSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOnBreak, breakSecondsLeft])

  const handleTimeExpired = () => {
    setIsTimeExpired(true)
    // Advance to next section or submit
    setTimeout(() => {
      setIsTimeExpired(false)
      handleSectionComplete()
    }, 2000)
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-700">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!assessment || assessment.sections.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-xs font-medium text-slate-500">Preparing assessment session...</div>
      </div>
    )
  }

  const currentSection = assessment.sections[currentSectionIdx] || assessment.sections[0]
  const sectionQuestions = currentSection.questions || []
  const currentQuestionItem = sectionQuestions[currentQuestionIdx] || sectionQuestions[0]

  // Retrieve question details from snapshot or questionBankService
  const bankQuestions = questionBankService.getStoredQuestions()
  const resolvedQuestion =
    (currentQuestionItem?.questionSnapshot as QuestionBankItem) ||
    bankQuestions.find((q) => q.id === currentQuestionItem?.questionId) || {
      id: currentQuestionItem?.questionId || 'q1',
      prompt: 'If 2x - 2 = 3x, what is the value of x + 2?',
      choices: [
        { id: 'A', text: '-4', isCorrect: false },
        { id: 'B', text: '-2', isCorrect: false },
        { id: 'C', text: '0', isCorrect: true },
        { id: 'D', text: '2', isCorrect: false },
      ],
      questionType: 'multiple_choice',
      difficulty: 'easy',
    }

  const currentAnswer = answers[currentQuestionItem?.id]

  const handleSelectAnswer = (idx: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionItem.id]: idx }))
  }

  const handleNext = () => {
    // Check if require answer policy is enforced
    if (currentSection.settings.requireAnswer && currentAnswer === undefined) {
      alert('An answer is required before advancing to the next question.')
      return
    }

    if (currentQuestionIdx < sectionQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1)
    } else {
      // Last question in this section
      handleSectionComplete()
    }
  }

  const handlePrev = () => {
    if (currentQuestionIdx > 0 && currentSection.settings.allowBack) {
      setCurrentQuestionIdx(currentQuestionIdx - 1)
    }
  }

  const handleSectionComplete = () => {
    if (currentSectionIdx < assessment.sections.length - 1) {
      // Move to next section
      if (currentSection.settings.hasBreakAfter) {
        // Start intermission break
        setIsOnBreak(true)
        setBreakSecondsLeft((currentSection.settings.breakDurationMinutes || 5) * 60)
      } else {
        advanceToNextSection()
      }
    } else {
      // Completed all sections!
      finishAssessment()
    }
  }

  const advanceToNextSection = () => {
    setIsOnBreak(false)
    const nextIdx = currentSectionIdx + 1
    setCurrentSectionIdx(nextIdx)
    setCurrentQuestionIdx(0)
    const nextSec = assessment.sections[nextIdx]
    if (nextSec && nextSec.settings.timingEnabled) {
      setSectionSecondsLeft(nextSec.settings.timeLimitMinutes * 60)
    }
  }

  const finishAssessment = () => {
    // Compute total score and store results for ReportPage
    let totalPoints = 0
    let earnedPoints = 0

    assessment.sections.forEach((sec) => {
      sec.questions.forEach((qItem) => {
        const pts = qItem.pointsOverride || 1
        totalPoints += pts

        const studentAns = answers[qItem.id]
        const qDetail =
          (qItem.questionSnapshot as QuestionBankItem) ||
          bankQuestions.find((q) => q.id === qItem.questionId)

        const correctIdx = qDetail?.choices?.findIndex((c) => c.isCorrect)
        if (studentAns !== undefined && studentAns === correctIdx) {
          earnedPoints += pts
        }
      })
    })

    const pct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    // Retrieve student metadata from session
    let studentData: Record<string, any> = {}
    let startedAt = new Date().toISOString()
    try {
      const storedMeta = sessionStorage.getItem(`attempt_${attemptId || 'sample-attempt'}`)
      if (storedMeta) {
        const parsed = JSON.parse(storedMeta)
        if (parsed.studentData) studentData = parsed.studentData
        if (parsed.startedAt) startedAt = parsed.startedAt
      }
    } catch {}

    // Save permanently to attemptService so student name and full results appear in analytics and reports
    try {
      attemptService.saveCompletedAttempt({
        attemptId: attemptId || 'sample-attempt',
        assessment,
        studentData,
        answers,
        startedAt,
        totalTimeSeconds: 1200,
      })
    } catch (e) {
      console.warn('Failed to record completed attempt via attemptService:', e)
    }

    // Store completed report data in session
    const reportData = {
      attemptId: attemptId || 'sample-attempt',
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      totalPoints,
      earnedPoints,
      percentage: pct,
      completedAt: new Date().toISOString(),
      sections: assessment.sections.map((s) => ({
        id: s.id,
        title: s.title,
        questionsCount: s.questions.length,
      })),
      answers,
    }

    sessionStorage.setItem(`report_${attemptId || 'sample-attempt'}`, JSON.stringify(reportData))
    setIsSurveyOpen(true)
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculator button handling
  const handleCalcPress = (val: string) => {
    if (val === 'C') setCalcInput('')
    else if (val === '=') {
      try {
        // Safe basic arithmetic evaluator
        const sanitized = calcInput.replace(/[^0-9+\-*/().]/g, '')
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)()
        setCalcInput(String(res))
      } catch {
        setCalcInput('Error')
      }
    } else {
      setCalcInput((prev) => prev + val)
    }
  }

  // Intermission Break Screen
  if (isOnBreak) {
    const nextSection = assessment.sections[currentSectionIdx + 1]

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto text-purple-600">
            <Coffee className="h-8 w-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Scheduled Intermission
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Section {currentSectionIdx + 1} Completed!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {currentSection.settings.breakInstructions || 'Take a moment to relax and stretch before the next section begins.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col items-center justify-center">
            <span className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Break Timer</span>
            <span className="text-4xl font-black font-mono text-purple-900 mt-1">
              {formatTimer(breakSecondsLeft)}
            </span>
          </div>

          {nextSection && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
              <span className="font-bold text-slate-700">Up Next: Section {currentSectionIdx + 2}</span>
              <p className="text-slate-500">{nextSection.title}</p>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600 font-medium">
                <span>{nextSection.questions.length} questions</span>
                <span>•</span>
                <span>{nextSection.settings.timingEnabled ? `${nextSection.settings.timeLimitMinutes} mins` : 'Untimed'}</span>
                <span>•</span>
                <span>{nextSection.settings.calculatorAllowed ? 'Calculator Allowed' : 'No Calculator'}</span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={advanceToNextSection}
              style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <span>Resume & Begin Section {currentSectionIdx + 2}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        {/* Top Header: Section Info, Question Count, Countdown Timer & Calculator */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
              {currentSection.title}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Question {currentQuestionIdx + 1} of {sectionQuestions.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Calculator Button (only if calculator is allowed in this section) */}
            {currentSection.settings.calculatorAllowed ? (
              <button
                type="button"
                onClick={() => setShowCalculator((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 transition"
                title="Open on-screen calculator"
              >
                <CalcIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden xs:inline">Calculator</span>
              </button>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-xl cursor-not-allowed"
                title="Calculator is not allowed in this section"
              >
                <CalcIcon className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden xs:inline">No Calc</span>
              </span>
            )}

            {/* Section Timer */}
            {currentSection.settings.timingEnabled && (
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                  sectionSecondsLeft < 300
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTimer(sectionSecondsLeft)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Section Policy Notice Banner */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <Layers className="h-3 w-3 text-indigo-500" />
            Section {currentSectionIdx + 1} of {assessment.sections.length}
          </span>
          <span>
            {currentSection.settings.calculatorAllowed ? 'Calculator Allowed' : 'No Calculator Permitted'}
          </span>
        </div>

        {/* Question Prompt */}
        <div className="space-y-2">
          <div className="text-base font-semibold text-slate-900 leading-relaxed">
            <MathRenderer text={resolvedQuestion.prompt} />
          </div>
        </div>

        {/* Question Diagram */}
        {resolvedQuestion.imageUrl && (
          <div className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 sm:p-4 text-center space-y-2 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1.5 border-b border-slate-200/70">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                Problem Diagram
              </span>
              <span className="text-[11px] text-slate-400">Figure</span>
            </div>
            <div className="relative group bg-white rounded-xl border border-slate-200/80 p-2 sm:p-3 overflow-hidden flex items-center justify-center">
              <img
                src={resolvedQuestion.imageUrl}
                alt={resolvedQuestion.imageCaption || 'Problem diagram'}
                className="w-full max-h-[350px] object-contain mx-auto rounded-lg"
              />
              <button
                type="button"
                onClick={() =>
                  setPreviewZoomImage({
                    url: resolvedQuestion.imageUrl!,
                    caption: resolvedQuestion.imageCaption,
                  })
                }
                className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-medium"
              >
                <Maximize2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Enlarge</span>
              </button>
            </div>
            {resolvedQuestion.imageCaption && (
              <p className="text-xs text-slate-600 font-medium italic pt-1">
                Figure: <MathRenderer text={resolvedQuestion.imageCaption} />
              </p>
            )}
          </div>
        )}

        {/* Multiple Choice Options */}
        {resolvedQuestion.choices && resolvedQuestion.choices.length > 0 && (
          <div className="space-y-2.5">
            {resolvedQuestion.choices.map((opt, i) => {
              const isSelected = currentAnswer === i

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectAnswer(i)}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs font-medium transition cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">
                    <MathRenderer text={opt.text} />
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Navigation Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={currentQuestionIdx === 0 || !currentSection.settings.allowBack}
            onClick={handlePrev}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
          >
            <span>
              {currentQuestionIdx < sectionQuestions.length - 1
                ? 'Next Question'
                : currentSectionIdx < assessment.sections.length - 1
                ? 'Complete Section →'
                : 'Submit Assessment'}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Floating On-Screen Calculator (if calculator allowed) */}
      {showCalculator && currentSection.settings.calculatorAllowed && (
        <div className="fixed bottom-6 right-6 z-40 bg-white rounded-3xl p-4 border border-slate-300 shadow-2xl w-64 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <CalcIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>Standard Calculator</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCalculator(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-2.5 text-right font-mono font-bold text-sm text-slate-900 border border-slate-200 min-h-[40px] flex items-center justify-end overflow-x-auto">
            {calcInput || '0'}
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
            {['7', '8', '9', '/'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcPress(btn)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 transition"
              >
                {btn}
              </button>
            ))}
            {['4', '5', '6', '*'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcPress(btn)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 transition"
              >
                {btn}
              </button>
            ))}
            {['1', '2', '3', '-'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcPress(btn)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 transition"
              >
                {btn}
              </button>
            ))}
            {['0', '.', 'C', '+'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcPress(btn)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 transition"
              >
                {btn}
              </button>
            ))}
            <button
              onClick={() => handleCalcPress('=')}
              className="col-span-4 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
            >
              =
            </button>
          </div>
        </div>
      )}

      {/* Post-Assessment Survey Modal */}
      <StudentPostAssessmentSurveyModal
        attemptId={attemptId || 'sample-attempt'}
        isOpen={isSurveyOpen}
        onComplete={() => navigate(`/report/${attemptId || 'sample-attempt'}`)}
        onSkip={() => navigate(`/report/${attemptId || 'sample-attempt'}`)}
      />

      {/* Lightbox Zoom Modal */}
      {previewZoomImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl relative space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Diagram View</span>
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={previewZoomImage.url}
              alt={previewZoomImage.caption || 'Zoomed diagram'}
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
            {previewZoomImage.caption && (
              <p className="text-xs text-slate-600 italic text-center font-medium">
                {previewZoomImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TakeAssessmentPage
