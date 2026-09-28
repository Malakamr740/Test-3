import { supabase, isSupabaseConfigured } from './supabaseClient'
import { questionBankService, type QuestionBankItem } from './questionBankService'
import { assessmentService, type Assessment } from './assessmentService'
import { type ReportData, type QuestionReviewItem, type BreakdownRow } from '../components/Reports/Types'
import { reportTemplateService } from './reportTemplateService'

export interface StoredAttemptRecord {
  id: string
  assessment_id: string
  assessment_name: string
  student_name: string
  student_email?: string
  status: 'completed' | 'in_progress' | 'abandoned'
  started_at: string
  completed_at: string
  total_time_seconds: number
  percentage: number
  correct_count: number
  total_questions: number
  level_name: string
  registration_responses: Record<string, any>
  answers: Record<string, any>
  report_data?: ReportData
}

const ATTEMPTS_STORAGE_KEY = 'math_diag_all_attempts_v2'

export const attemptService = {
  getAllAttempts(): StoredAttemptRecord[] {
    try {
      const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.warn('Failed to parse stored attempts from localStorage:', e)
    }
    return []
  },

  getAttemptsForAssessment(assessmentId: string): StoredAttemptRecord[] {
    return this.getAllAttempts().filter((a) => a.assessment_id === assessmentId)
  },

  getAttemptById(attemptId: string): StoredAttemptRecord | null {
    const list = this.getAllAttempts()
    const found = list.find((a) => a.id === attemptId)
    if (found) return found

    // Check sessionStorage fallback
    try {
      const sessionRaw = sessionStorage.getItem(`attempt_${attemptId}`)
      const reportRaw = sessionStorage.getItem(`report_${attemptId}`)
      if (sessionRaw) {
        const parsedSession = JSON.parse(sessionRaw)
        const parsedReport = reportRaw ? JSON.parse(reportRaw) : null
        const reg = parsedSession.studentData || {}
        const studentName =
          reg.full_name || reg.fullName || reg.name || reg.student_name || reg.email || 'Student'
        
        return {
          id: attemptId,
          assessment_id: parsedSession.assessmentId || 'diagnostic-algebra-1',
          assessment_name: parsedSession.assessmentTitle || 'Diagnostic Assessment',
          student_name: studentName,
          student_email: reg.email,
          status: 'completed',
          started_at: parsedSession.startedAt || new Date().toISOString(),
          completed_at: parsedReport?.completedAt || new Date().toISOString(),
          total_time_seconds: 1200,
          percentage: parsedReport?.percentage ?? 75,
          correct_count: parsedReport?.earnedPoints ?? 3,
          total_questions: parsedReport?.totalPoints ?? 4,
          level_name: (parsedReport?.percentage ?? 75) >= 75 ? 'Mastery Tier' : 'Developing',
          registration_responses: reg,
          answers: parsedReport?.answers || {},
        }
      }
    } catch {}

    return null
  },

  saveCompletedAttempt(params: {
    attemptId: string
    assessment: Assessment
    studentData: Record<string, any>
    answers: Record<string, any>
    startedAt?: string
    totalTimeSeconds?: number
  }): StoredAttemptRecord {
    const { attemptId, assessment, studentData, answers, startedAt, totalTimeSeconds = 1200 } = params

    // 1. Calculate scores and question reviews
    let totalPoints = 0
    let earnedPoints = 0
    let correctCount = 0
    let totalQuestions = 0
    const bankQuestions = questionBankService.getStoredQuestions()

    const reviewQuestions: QuestionReviewItem[] = []
    const domainStatsMap = new Map<string, { total: number; correct: number; totalTime: number }>()

    assessment.sections.forEach((sec) => {
      sec.questions.forEach((qItem, idx) => {
        totalQuestions += 1
        const pts = qItem.pointsOverride || 1
        totalPoints += pts

        const studentAns = answers[qItem.id]
        const qDetail =
          (qItem.questionSnapshot as QuestionBankItem) ||
          bankQuestions.find((q) => q.id === qItem.questionId) || {
            id: qItem.questionId,
            prompt: `Question ${idx + 1}`,
            choices: [],
            domain: 'Algebra & Functions',
            chapter: 'Linear Equations',
            lesson: 'Linear Models',
            difficulty: 'medium',
            explanation: '',
          }

        const domainName = qDetail.domain || 'General Mathematics'
        const domainStat = domainStatsMap.get(domainName) || { total: 0, correct: 0, totalTime: 0 }
        domainStat.total += 1

        let isCorrect = false
        const choices = qDetail.choices || []
        const correctIdx = choices.findIndex((c) => c.isCorrect)

        if (studentAns !== undefined && studentAns !== null && studentAns !== '') {
          if (typeof studentAns === 'number' && studentAns === correctIdx) {
            isCorrect = true
          } else if (String(studentAns).trim().toLowerCase() === String(qDetail.numericAnswer || '').trim().toLowerCase()) {
            isCorrect = true
          }
        }

        const isUnanswered = studentAns === undefined || studentAns === null || studentAns === ''

        if (isCorrect) {
          earnedPoints += pts
          correctCount += 1
          domainStat.correct += 1
        }

        const approxTime = Math.max(20, Math.round(totalTimeSeconds / Math.max(1, totalQuestions)))
        domainStat.totalTime += approxTime
        domainStatsMap.set(domainName, domainStat)

        reviewQuestions.push({
          question_id: qItem.id,
          content_blocks: [{ type: 'text', value: qDetail.prompt || `Question ${idx + 1}` }],
          explanation_blocks: [{ type: 'text', value: qDetail.explanation || 'Solution steps verified.' }],
          difficulty: (qDetail.difficulty as any) || 'medium',
          answer_type_code: qDetail.questionType === 'grid_in' ? 'GRID_IN' : 'MCQ',
          points_possible: pts,
          points_earned: isCorrect ? pts : 0,
          is_correct: isCorrect,
          status: isCorrect ? 'correct' : isUnanswered ? 'unanswered' : 'incorrect',
          time_spent_seconds: approxTime,
          student_answer: { value: studentAns, choice_idx: studentAns },
          category_name: domainName,
          lesson_name: qDetail.lesson || qDetail.chapter || 'Foundations',
          skill_name: qDetail.chapter || domainName,
          choices: choices.map((c) => ({
            id: c.id,
            content_blocks: [{ type: 'text', value: c.text }],
            is_correct: c.isCorrect,
          })),
        })
      })
    })

    const pct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    // Resolve rubric tier based on customizable rubric config
    const template = reportTemplateService.getTemplateForAssessment(assessment.id)
    const rubricTier = reportTemplateService.resolveRubricLevel(pct, template)

    // Build breakdowns
    const breakdowns: BreakdownRow[] = []
    domainStatsMap.forEach((stat, domName) => {
      const domPct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
      breakdowns.push({
        type: 'category',
        id: `cat_${domName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
        label: domName,
        total_questions: stat.total,
        correct_count: stat.correct,
        points_earned: stat.correct,
        points_possible: stat.total,
        percentage: domPct,
        classification: domPct >= template.strongThreshold ? 'strong' : domPct < template.moderateThreshold ? 'weak' : 'average',
        avg_time_seconds: stat.total > 0 ? Math.round(stat.totalTime / stat.total) : 60,
      })
    })

    const studentName =
      studentData.full_name ||
      studentData.fullName ||
      studentData.name ||
      studentData.student_name ||
      studentData.email ||
      'Student'

    const studentEmail =
      studentData.email || studentData.student_email || studentData.parent_email || undefined

    const fullReport: ReportData = {
      student_info: {
        attempt_id: attemptId,
        assessment_name: assessment.title,
        started_at: startedAt || new Date(Date.now() - totalTimeSeconds * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        total_time_seconds: totalTimeSeconds,
        registration_responses: studentData,
      },
      overall: {
        total_questions: totalQuestions,
        correct_count: correctCount,
        incorrect_count: totalQuestions - correctCount,
        unanswered_count: reviewQuestions.filter((q) => q.status === 'unanswered').length,
        points_earned: earnedPoints,
        points_possible: totalPoints,
        percentage: pct,
        calculated_at: new Date().toISOString(),
        avg_time_per_question: Math.round(totalTimeSeconds / Math.max(1, totalQuestions)),
        avg_time_correct: Math.round((totalTimeSeconds / Math.max(1, totalQuestions)) * 0.9),
        avg_time_incorrect: Math.round((totalTimeSeconds / Math.max(1, totalQuestions)) * 1.1),
        rushed_mistakes_count: 0,
        timesink_mistakes_count: 0,
        level: {
          id: rubricTier.id,
          name: rubricTier.name,
          description: rubricTier.description,
          recommendation: rubricTier.recommendation,
        },
      },
      breakdowns,
      questions: reviewQuestions,
      courses: [
        {
          id: 'crs-standard',
          name: `${assessment.subject || 'Mathematics'} Targeted Remediation Intensive`,
          description: rubricTier.recommendation,
          image_url: null,
          registration_url: '#',
          whatsapp_url: '#',
          phone: null,
        },
      ],
      org_settings: {
        org_name: template.title || 'Math Diagnostic Platform',
        marketing_tagline: template.subtitle || null,
        contact_phone: null,
        whatsapp_url: null,
        website_url: null,
      },
    }

    const record: StoredAttemptRecord = {
      id: attemptId,
      assessment_id: assessment.id,
      assessment_name: assessment.title,
      student_name: studentName,
      student_email: studentEmail,
      status: 'completed',
      started_at: startedAt || new Date(Date.now() - totalTimeSeconds * 1000).toISOString(),
      completed_at: new Date().toISOString(),
      total_time_seconds: totalTimeSeconds,
      percentage: pct,
      correct_count: correctCount,
      total_questions: totalQuestions,
      level_name: rubricTier.name,
      registration_responses: studentData,
      answers,
      report_data: fullReport,
    }

    // Save to localStorage attempts table
    try {
      const all = this.getAllAttempts()
      const existingIdx = all.findIndex((a) => a.id === attemptId)
      if (existingIdx >= 0) {
        all[existingIdx] = record
      } else {
        all.unshift(record)
      }
      localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(all))
    } catch (e) {
      console.error('Failed to save attempt to localStorage:', e)
    }

    // Save to sessionStorage for quick access
    try {
      sessionStorage.setItem(`attempt_${attemptId}`, JSON.stringify({
        attemptId,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        studentData,
        startedAt: record.started_at,
      }))

      sessionStorage.setItem(`report_${attemptId}`, JSON.stringify({
        attemptId,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        totalPoints,
        earnedPoints,
        percentage: pct,
        completedAt: record.completed_at,
        answers,
        fullReport,
      }))
    } catch (e) {
      console.warn('Failed to save to sessionStorage:', e)
    }

    // Sync assessment and attempt to Supabase if configured
    if (isSupabaseConfigured) {
      // 1. Ensure assessment exists in public.assessments so foreign key passes
      assessmentService.syncAssessmentToDatabase(assessment).catch(() => {})

      // 2. Upsert complete attempt record to public.attempts
      try {
        supabase
          .from('attempts')
          .upsert({
            id: attemptId,
            assessment_id: assessment.id,
            student_name: studentName,
            student_email: studentEmail || null,
            status: 'completed',
            started_at: record.started_at,
            completed_at: record.completed_at,
            total_time_seconds: totalTimeSeconds,
            percentage: pct,
            correct_count: correctCount,
            total_questions: totalQuestions,
            level_name: rubricTier.name,
            registration_responses: studentData,
            answers: answers,
            report_data: fullReport,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase attempt upsert notice:', error.message)
          })
          .catch((err) => {
            console.warn('Supabase attempt upsert error:', err)
          })
      } catch (err) {
        console.warn('Failed to dispatch attempt sync to Supabase:', err)
      }
    }

    return record
  },

  /**
   * Fetch attempts from Supabase database, merge with local cache, and return
   */
  async fetchAttemptsFromDatabase(assessmentId?: string): Promise<StoredAttemptRecord[]> {
    if (!isSupabaseConfigured) {
      return assessmentId ? this.getAttemptsForAssessment(assessmentId) : this.getAllAttempts()
    }

    try {
      let query = supabase.from('attempts').select('*').order('started_at', { ascending: false })
      if (assessmentId) {
        query = query.eq('assessment_id', assessmentId)
      }

      const { data, error } = await query
      if (error) {
        console.warn('Notice querying Supabase attempts:', error.message)
        return assessmentId ? this.getAttemptsForAssessment(assessmentId) : this.getAllAttempts()
      }

      if (data && data.length > 0) {
        const localList = this.getAllAttempts()
        const localMap = new Map(localList.map((a) => [a.id, a]))

        const mapped: StoredAttemptRecord[] = data.map((row: any) => {
          const localItem = localMap.get(row.id)
          const studentName =
            row.student_name ||
            row.registration_responses?.full_name ||
            row.registration_responses?.name ||
            localItem?.student_name ||
            'Student Participant'

          return {
            id: String(row.id),
            assessment_id: String(row.assessment_id),
            assessment_name:
              localItem?.assessment_name ||
              row.report_data?.student_info?.assessment_name ||
              'Diagnostic Assessment',
            student_name: studentName,
            student_email: row.student_email || row.registration_responses?.email || localItem?.student_email || '',
            status: (row.status || 'completed') as 'completed' | 'in_progress' | 'abandoned',
            started_at: row.started_at || new Date().toISOString(),
            completed_at: row.completed_at || new Date().toISOString(),
            total_time_seconds: row.total_time_seconds || localItem?.total_time_seconds || 1200,
            percentage: Number(row.percentage) || localItem?.percentage || 0,
            correct_count: Number(row.correct_count) || localItem?.correct_count || 0,
            total_questions: Number(row.total_questions) || localItem?.total_questions || 0,
            level_name: row.level_name || localItem?.level_name || 'Assessed',
            registration_responses: row.registration_responses || localItem?.registration_responses || {},
            answers: row.answers || localItem?.answers || {},
            report_data: row.report_data || localItem?.report_data,
          }
        })

        // Merge: keep local items not in remote
        const remoteIds = new Set(mapped.map((m) => m.id))
        const remainingLocal = localList.filter((l) => !remoteIds.has(l.id))
        const combined = [...mapped, ...remainingLocal]

        try {
          localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(combined))
        } catch {}

        return assessmentId ? combined.filter((a) => a.assessment_id === assessmentId) : combined
      }

      return assessmentId ? this.getAttemptsForAssessment(assessmentId) : this.getAllAttempts()
    } catch (e) {
      console.warn('Error reading attempts from database:', e)
      return assessmentId ? this.getAttemptsForAssessment(assessmentId) : this.getAllAttempts()
    }
  },

  deleteAttempt(attemptId: string): void {
    const list = this.getAllAttempts().filter((a) => a.id !== attemptId)
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(list))
    sessionStorage.removeItem(`attempt_${attemptId}`)
    sessionStorage.removeItem(`report_${attemptId}`)

    if (isSupabaseConfigured) {
      try {
        supabase.from('attempts').delete().eq('id', attemptId).then(() => {}).catch(() => {})
      } catch {}
    }
  }
}
