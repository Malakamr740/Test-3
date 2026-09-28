export interface ReportSectionConfig {
  id: string
  title: string
  subtitle?: string
  enabled: boolean
  order: number
  description?: string
}

export interface RubricTier {
  id: string
  name: string
  minScore: number
  maxScore: number
  badgeColor: string
  description: string
  recommendation: string
}

export interface ReportTemplateConfig {
  id: string
  assessmentId?: string // undefined or 'global' means default for all assessments
  title: string
  subtitle?: string
  headerBannerText?: string
  showHeroMetrics: boolean
  showThreeStateDonut: boolean
  showStrongDomains: boolean
  showWeakDomains: boolean
  showTimeAnalysis: boolean
  showTaxonomyTree: boolean
  showErrorPatterns: boolean
  showQuestionSolutions: boolean
  showActionPlan: boolean
  showCourseRecommendations: boolean
  
  // Custom threshold overrides
  strongThreshold: number
  moderateThreshold: number
  slowTimeThresholdPct: number

  // Rubric Tiers
  rubricTiers: RubricTier[]

  // Custom diagnostic notes or instructions
  customNotesTitle?: string
  customNotesBody?: string
  footerDisclaimer?: string

  updatedAt: string
}

const STORAGE_KEY_PREFIX = 'math_diag_report_config_'
const DEFAULT_GLOBAL_KEY = 'math_diag_report_config_global'

export const DEFAULT_REPORT_RUBRIC_TIERS: RubricTier[] = [
  {
    id: 'tier-mastery',
    name: 'Mastery Tier (Advanced)',
    minScore: 80,
    maxScore: 100,
    badgeColor: 'emerald',
    description: 'Demonstrated superior conceptual command and consistent procedural execution across assessed mathematical domains.',
    recommendation: 'Target advanced challenge modules, full-length timed pacing drills, and elite scoring strategies.',
  },
  {
    id: 'tier-proficient',
    name: 'Proficient Tier (Intermediate)',
    minScore: 65,
    maxScore: 79,
    badgeColor: 'blue',
    description: 'Demonstrated solid baseline mathematical intuition and standard problem-solving with isolated sub-topic slips.',
    recommendation: 'Target intermediate practice sets and eliminate careless misreads on multi-step questions.',
  },
  {
    id: 'tier-developing',
    name: 'Developing Foundations (Core)',
    minScore: 50,
    maxScore: 64,
    badgeColor: 'amber',
    description: 'Core concepts require targeted reinforcement, with several gaps in algebraic manipulation or geometric formulas.',
    recommendation: 'Target foundational drills and formula retention before progressing to timed pressure sets.',
  },
  {
    id: 'tier-foundational',
    name: 'Critical Foundation Rebuild',
    minScore: 0,
    maxScore: 49,
    badgeColor: 'rose',
    description: 'Significant foundational gaps identified that require comprehensive step-by-step topic review and teacher guidance.',
    recommendation: 'Enroll in structured concept remediation and practice untimed foundational problem sets.',
  },
]

export const DEFAULT_GLOBAL_REPORT_TEMPLATE: ReportTemplateConfig = {
  id: 'global-template',
  title: 'Diagnostic Performance Assessment',
  subtitle: 'Comprehensive Mathematics Diagnostic Evaluation',
  headerBannerText: 'Student Diagnostic Evaluation',
  showHeroMetrics: true,
  showThreeStateDonut: true,
  showStrongDomains: true,
  showWeakDomains: true,
  showTimeAnalysis: true,
  showTaxonomyTree: true,
  showErrorPatterns: true,
  showQuestionSolutions: true,
  showActionPlan: true,
  showCourseRecommendations: true,
  strongThreshold: 75,
  moderateThreshold: 50,
  slowTimeThresholdPct: 25,
  rubricTiers: DEFAULT_REPORT_RUBRIC_TIERS,
  customNotesTitle: 'Diagnostic Overview & Educator Guidance',
  customNotesBody: 'This report reflects individual diagnostic performance. Mastery indicators and time pacing are benchmarked against official examination standards.',
  footerDisclaimer: 'Report automatically compiled by Scholar Academy Math Assessment System.',
  updatedAt: new Date().toISOString(),
}

export const reportTemplateService = {
  getTemplateForAssessment(assessmentId?: string): ReportTemplateConfig {
    try {
      if (assessmentId) {
        const custom = localStorage.getItem(`${STORAGE_KEY_PREFIX}${assessmentId}`)
        if (custom) {
          return { ...DEFAULT_GLOBAL_REPORT_TEMPLATE, ...JSON.parse(custom) }
        }
      }

      const globalRaw = localStorage.getItem(DEFAULT_GLOBAL_KEY)
      if (globalRaw) {
        return { ...DEFAULT_GLOBAL_REPORT_TEMPLATE, ...JSON.parse(globalRaw) }
      }
    } catch (e) {
      console.warn('Failed to load report template:', e)
    }

    return { ...DEFAULT_GLOBAL_REPORT_TEMPLATE }
  },

  saveTemplateForAssessment(assessmentId: string | undefined, template: ReportTemplateConfig): void {
    try {
      const key = assessmentId ? `${STORAGE_KEY_PREFIX}${assessmentId}` : DEFAULT_GLOBAL_KEY
      const payload = {
        ...template,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify(payload))
    } catch (e) {
      console.error('Failed to save report template:', e)
      throw e
    }
  },

  resetTemplate(assessmentId?: string): ReportTemplateConfig {
    try {
      if (assessmentId) {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${assessmentId}`)
      } else {
        localStorage.removeItem(DEFAULT_GLOBAL_KEY)
      }
    } catch (e) {
      console.error('Failed to reset report template:', e)
    }
    return { ...DEFAULT_GLOBAL_REPORT_TEMPLATE }
  },

  resolveRubricLevel(scorePercentage: number, template?: ReportTemplateConfig): RubricTier {
    const config = template || this.getTemplateForAssessment()
    const tiers = config.rubricTiers && config.rubricTiers.length > 0 ? config.rubricTiers : DEFAULT_REPORT_RUBRIC_TIERS

    // Find match where score is between minScore and maxScore
    const matched = tiers.find((t) => scorePercentage >= t.minScore && scorePercentage <= t.maxScore)
    if (matched) return matched

    // Fallback if not matched
    if (scorePercentage >= 80) return tiers[0]
    if (scorePercentage >= 65) return tiers[1] || tiers[0]
    if (scorePercentage >= 50) return tiers[2] || tiers[0]
    return tiers[tiers.length - 1]
  }
}
