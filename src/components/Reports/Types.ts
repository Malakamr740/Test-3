import type { ContentBlock } from '../ContentBlockRenderer'

export type TaxonomyType = 'module' | 'category' | 'chapter' | 'lesson' | 'skill' | 'difficulty'

export type DomainClassification = 'Strong' | 'Moderate' | 'Weak'

export interface ChoiceOption {
  id: string
  content_blocks: ContentBlock[]
  is_correct: boolean
}

export interface QuestionReviewItem {
  question_id: string
  content_blocks: ContentBlock[]
  explanation_blocks: ContentBlock[]
  difficulty: 'easy' | 'medium' | 'hard'
  answer_type_code: string
  points_possible: number
  points_earned: number
  is_correct: boolean
  status?: 'correct' | 'incorrect' | 'unanswered'
  is_answered?: boolean
  time_spent_seconds: number
  student_answer: Record<string, unknown>
  category_name: string | null
  lesson_name: string | null
  skill_name: string | null
  choices: ChoiceOption[]
  correct_answer_data?: { value: unknown; tolerance?: number }
}

export interface DomainPerformance {
  domainId: string
  domainName: string
  domainType: string
  total: number
  correct: number
  unanswered: number
  accuracyPct: number
  avgTimeSec: number
  classification: DomainClassification
  performanceFact: string
  actionableInsight: string
}

export interface CategoryTimeStats {
  category: string
  avgTimeSec: number
  deltaFromOverallPct: number
  flaggedSlow: boolean
  questionCount: number
  correctCount: number
}

export interface TimeAnalysisResult {
  overallAvgTime: number
  slowThresholdPct: number
  categories: CategoryTimeStats[]
  quickestSolved: QuestionReviewItem | null
  slowestSolved: QuestionReviewItem | null
}

export interface StudentInfo {
  attempt_id: string
  assessment_name: string
  started_at: string
  completed_at: string | null
  total_time_seconds: number
  registration_responses: Record<string, unknown>
}

export interface LevelInfo {
  id: string
  name: string
  description: string | null
  recommendation: string | null
}

export interface OverallResult {
  total_questions: number
  correct_count: number
  incorrect_count: number
  unanswered_count?: number
  points_earned: number
  points_possible: number
  percentage: number
  calculated_at: string
  avg_time_per_question: number
  avg_time_correct: number
  avg_time_incorrect: number
  rushed_mistakes_count: number
  timesink_mistakes_count: number
  level: LevelInfo | null
}

export interface BreakdownRow {
  type: TaxonomyType
  id: string | null
  label: string
  total_questions: number
  correct_count: number
  points_earned: number
  points_possible: number
  percentage: number
  classification: 'strong' | 'weak' | 'average' | null
  avg_time_seconds?: number
}

export interface CourseItem {
  id: string
  name: string
  description: string | null
  image_url: string | null
  registration_url: string | null
  whatsapp_url: string | null
  phone: string | null
}

export interface OrgSettings {
  org_name: string
  marketing_tagline: string | null
  contact_phone: string | null
  whatsapp_url: string | null
  website_url: string | null
}

export interface ReportData {
  student_info: StudentInfo
  overall: OverallResult
  diagnostic_notes?: Array<{ type: string; title: string; body: string }>
  breakdowns: BreakdownRow[]
  questions: QuestionReviewItem[]
  courses: CourseItem[]
  org_settings: OrgSettings | null
}
