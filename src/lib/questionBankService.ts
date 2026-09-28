import { supabase, isSupabaseConfigured } from './supabaseClient'

export interface QuestionChoice {
  id: string
  text: string
  isCorrect: boolean
  rationale?: string
}

export interface QuestionBankItem {
  id: string
  collection?: string
  domain: string
  chapter: string
  lesson: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionType: 'multiple_choice' | 'multi_select' | 'grid_in'
  calculatorAllowed: boolean
  estimatedSeconds: number
  targetExam?: string
  prompt: string
  imageUrl?: string
  imageCaption?: string
  choices: QuestionChoice[]
  numericAnswer?: string
  numericTolerance?: string
  explanation: string
  commonMisconception?: string
  createdAt?: string
  updatedAt?: string
}

export interface QuestionCollection {
  id?: string
  name: string
  description?: string
  targetExam?: string
  colorTag?: string
  questionCount: number
  createdAt?: string
  updatedAt?: string
}

// Taxonomy Schema: Domain (Unit) -> Chapter -> Lesson
export interface TaxonomyLesson {
  name: string
  code?: string
  description?: string
}

export interface TaxonomyChapter {
  name: string
  code?: string
  lessons: (string | TaxonomyLesson)[]
}

export interface TaxonomyDomain {
  name: string
  unitLabel?: string // e.g. "Unit 1", "Unit 2"
  code?: string
  chapters: TaxonomyChapter[]
}

export type TaxonomyRegistry = Record<string, {
  unitLabel?: string
  code?: string
  chapters: {
    name: string
    code?: string
    lessons: string[]
  }[]
}>

const TAXONOMY_STORAGE_KEY = 'math_diag_custom_taxonomy'
const TAXONOMY_INITIALIZED_FLAG = 'math_diag_taxonomy_initialized_v2'

// 3-Level Categorization Map: Domain(Unit) -> Chapter -> Lesson
export const CURRICULUM_TAXONOMY: TaxonomyRegistry = {
  'Algebra & Functions': {
    unitLabel: 'Unit 1: Foundations of Functions & Algebra',
    code: 'ALG',
    chapters: [
      {
        name: 'Linear Equations & Systems',
        code: 'ALG.1',
        lessons: [
          'Single-Variable Linear Equations',
          'Systems of Linear Equations (2x2 & 3x3)',
          'Linear Inequalities & Shaded Coordinate Regions',
          'Interpreting Slope and Intercepts in Applied Models',
        ],
      },
      {
        name: 'Quadratic & Polynomial Equations',
        code: 'ALG.2',
        lessons: [
          'Factoring Techniques & Root Finding',
          'Quadratic Formula & Discriminant Analysis',
          'Vertex Form & Parabola Optimization',
          'Polynomial Long Division & Remainder Theorem',
          'Higher Degree Roots & Multiplicity',
        ],
      },
      {
        name: 'Exponential & Logarithmic Functions',
        code: 'ALG.3',
        lessons: [
          'Laws of Exponents & Radical Simplification',
          'Logarithmic Properties & Change of Base',
          'Solving Exponential Equations',
          'Exponential Growth & Decay Word Problems',
        ],
      },
      {
        name: 'Rational & Radical Equations',
        code: 'ALG.4',
        lessons: [
          'Operations with Rational Expressions',
          'Extraneous Solutions in Radical Equations',
          'Partial Fractions & Domain Restrictions',
        ],
      },
    ],
  },
  'Geometry & Measurement': {
    unitLabel: 'Unit 2: Spatial, Synthetic & Analytic Geometry',
    code: 'GEO',
    chapters: [
      {
        name: 'Congruence, Similarity & Geometric Proofs',
        code: 'GEO.1',
        lessons: [
          'Triangle Congruence & Similarity Criteria (SSS, SAS, AA)',
          'Parallel Lines & Transversal Angle Theorems',
          'Properties of Polygons & Quadrilaterals',
        ],
      },
      {
        name: 'Circles & Coordinate Geometry',
        code: 'GEO.2',
        lessons: [
          'Arc Length & Sector Area Calculations',
          'Inscribed & Central Angles in Circles',
          'Standard Circle Equations in the Cartesian Plane',
          'Distance, Midpoint & Perpendicular Slope Formulas',
        ],
      },
      {
        name: 'Area, Surface Area & 3D Volume',
        code: 'GEO.3',
        lessons: [
          'Prisms, Pyramids, Cylinders & Cones',
          'Spheres & Composite Geometric Solids',
          'Cross-Sections & Solids of Revolution',
        ],
      },
    ],
  },
  'Trigonometry': {
    unitLabel: 'Unit 3: Trigonometric Formulations & Periodic Functions',
    code: 'TRIG',
    chapters: [
      {
        name: 'Right Triangle Trigonometry',
        code: 'TRIG.1',
        lessons: [
          'Trigonometric Definitions (Sine, Cosine, Tangent)',
          'Special Right Triangles (30-60-90, 45-45-90)',
          'Angles of Elevation and Depression',
        ],
      },
      {
        name: 'Unit Circle & Analytic Identities',
        code: 'TRIG.2',
        lessons: [
          'Radian Measure & Arc Length on the Unit Circle',
          'Pythagorean Trigonometric Identities',
          'Double-Angle and Half-Angle Formulas',
          'Solving Trigonometric Equations on Intervals',
        ],
      },
      {
        name: 'Laws of Sines and Cosines',
        code: 'TRIG.3',
        lessons: [
          'Law of Sines & Ambiguous Case (SSA)',
          'Law of Cosines in Oblique Triangles',
          'Heron\'s Formula & Area of Non-Right Triangles',
        ],
      },
    ],
  },
  'Calculus & Analysis': {
    unitLabel: 'Unit 4: Limits, Differentiation & Integration',
    code: 'CALC',
    chapters: [
      {
        name: 'Limits & Continuity',
        code: 'CALC.1',
        lessons: [
          'Algebraic Limit Evaluation Techniques',
          'Limits at Infinity & Vertical/Horizontal Asymptotes',
          'Continuity and Intermediate Value Theorem',
          'L\'Hôpital\'s Rule for Indeterminate Forms',
        ],
      },
      {
        name: 'Differential Calculus',
        code: 'CALC.2',
        lessons: [
          'Power, Product, & Quotient Differentiation Rules',
          'Chain Rule & Implicit Differentiation',
          'Tangents, Normals, & Rates of Change',
          'Extreme Value Theorem & Optimization',
        ],
      },
      {
        name: 'Integral Calculus & Accumulation',
        code: 'CALC.3',
        lessons: [
          'Riemann Sums & Definite Integrals',
          'Fundamental Theorem of Calculus',
          'Integration by U-Substitution',
          'Area Between Curves & Net Change',
        ],
      },
    ],
  },
  'Statistics & Probability': {
    unitLabel: 'Unit 5: Empirical Data & Probabilistic Models',
    code: 'STAT',
    chapters: [
      {
        name: 'Descriptive Statistics & Data Distributions',
        code: 'STAT.1',
        lessons: [
          'Measures of Center (Mean, Median, Mode)',
          'Standard Deviation & Spread',
          'Box Plots, IQR, & Outlier Detection',
          'Normal Distribution, Z-Scores & Empirical Rule',
        ],
      },
      {
        name: 'Probability Rules & Combinatorics',
        code: 'STAT.2',
        lessons: [
          'Basic Probability & Complement Rule',
          'Independent & Mutually Exclusive Events',
          'Conditional Probability & Two-Way Contingency Tables',
          'Permutations & Combinations in Sampling',
        ],
      },
    ],
  },
}

const STORAGE_KEY = 'math_diag_question_bank'
const COLLECTIONS_STORAGE_KEY = 'math_diag_custom_collections'
const QB_INITIALIZED_FLAG = 'math_diag_qb_initialized_v2'
const COLLECTIONS_INITIALIZED_FLAG = 'math_diag_cols_initialized_v2'

export const INITIAL_COLLECTIONS: QuestionCollection[] = [
  {
    id: 'col-seed-01',
    name: 'EST 1 Math Diagnostic 2025',
    description: 'Core specimen diagnostic collection for EST 1 Math with quadratic, linear, and geometric questions',
    targetExam: 'EST 1 / SAT Math',
    colorTag: 'blue',
    questionCount: 3,
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'col-seed-02',
    name: 'Algebra Mastery Sprint',
    description: 'Targeted algebraic functions, systems, and exponential sprint collection',
    targetExam: 'EST 1 / SAT Math',
    colorTag: 'emerald',
    questionCount: 1,
    createdAt: '2025-01-18T14:00:00.000Z',
  },
  {
    id: 'col-seed-03',
    name: 'Trigonometry & Calculus Pack',
    description: 'Advanced analytic identities, derivatives, and rates of change',
    targetExam: 'EST 2 / SAT Subject',
    colorTag: 'purple',
    questionCount: 2,
    createdAt: '2025-01-19T16:00:00.000Z',
  },
  {
    id: 'col-seed-04',
    name: 'General Question Bank',
    description: 'Default uncategorized question pool',
    targetExam: 'General',
    colorTag: 'slate',
    questionCount: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
]

// Initial Seed Questions (organized into collections)
export const SAMPLE_SECTOR_DIAGRAM_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 360" width="100%" height="100%" style="background-color:%23f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <defs>
    <linearGradient id="sectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%233b82f6" stop-opacity="0.28" />
      <stop offset="100%" stop-color="%2360a5fa" stop-opacity="0.12" />
    </linearGradient>
  </defs>
  <!-- Full circle dashed outline -->
  <circle cx="230" cy="190" r="140" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-dasharray="5,5" />
  <!-- Shaded 60 degree sector OAB -->
  <path d="M 230 190 L 370 190 A 140 140 0 0 0 300 68.8 Z" fill="url(%23sectorGrad)" stroke="%232563eb" stroke-width="3" stroke-linejoin="round" />
  <!-- Radii segments -->
  <line x1="230" y1="190" x2="370" y2="190" stroke="%232563eb" stroke-width="2.5" />
  <line x1="230" y1="190" x2="300" y2="68.8" stroke="%232563eb" stroke-width="2.5" />
  <!-- Angle arc indicator at center -->
  <path d="M 270 190 A 40 40 0 0 0 250 155.3" fill="none" stroke="%23d97706" stroke-width="2.5" />
  <text x="272" y="166" font-size="14" font-weight="bold" fill="%23b45309">60°</text>
  <!-- Center point O -->
  <circle cx="230" cy="190" r="4.5" fill="%231e293b" />
  <text x="208" y="202" font-size="16" font-weight="bold" fill="%230f172a">O</text>
  <!-- Vertex A -->
  <circle cx="370" cy="190" r="4" fill="%232563eb" />
  <text x="382" y="195" font-size="16" font-weight="bold" fill="%231d4ed8">A</text>
  <!-- Vertex B -->
  <circle cx="300" cy="68.8" r="4" fill="%232563eb" />
  <text x="306" y="58" font-size="16" font-weight="bold" fill="%231d4ed8">B</text>
  <!-- Radius label r = 6 cm on OA -->
  <rect x="275" y="200" width="76" height="24" rx="6" fill="%23ffffff" stroke="%23e2e8f0" />
  <text x="313" y="216" font-size="13" font-weight="600" fill="%23334155" text-anchor="middle">r = 6 cm</text>
  <!-- Radius label on OB -->
  <rect x="228" y="105" width="76" height="24" rx="6" fill="%23ffffff" stroke="%23e2e8f0" />
  <text x="266" y="121" font-size="13" font-weight="600" fill="%23334155" text-anchor="middle">r = 6 cm</text>
  <!-- Arc AB note -->
  <text x="360" y="125" font-size="13" font-style="italic" fill="%2364748b">Arc AB</text>
</svg>`

export const INITIAL_SEED_QUESTIONS: QuestionBankItem[] = [
  {
    id: 'qb-seed-01',
    collection: 'EST 1 Math Diagnostic 2025',
    domain: 'Algebra & Functions',
    chapter: 'Quadratic & Polynomial Equations',
    lesson: 'Quadratic Formula & Discriminant Analysis',
    difficulty: 'medium',
    questionType: 'multiple_choice',
    calculatorAllowed: false,
    estimatedSeconds: 90,
    targetExam: 'EST 1 / SAT Math',
    prompt:
      'For the quadratic equation $2x^2 - 4x + k = 0$, what value of $k$ will yield exactly one real distinct root?',
    choices: [
      {
        id: 'c1',
        text: '$k = 2$',
        isCorrect: true,
        rationale: 'Discriminant $\\Delta = (-4)^2 - 4(2)(k) = 16 - 8k = 0 \\implies k = 2$.',
      },
      {
        id: 'c2',
        text: '$k = 4$',
        isCorrect: false,
        rationale: 'If $k = 4$, $\\Delta = 16 - 32 = -16 < 0$ which produces complex roots.',
      },
      {
        id: 'c3',
        text: '$k = -2$',
        isCorrect: false,
        rationale: 'Common sign error in applying $-4ac$.',
      },
      {
        id: 'c4',
        text: '$k = 0$',
        isCorrect: false,
        rationale: 'If $k = 0$, the equation $2x(x - 2) = 0$ yields two distinct roots: $0$ and $2$.',
      },
    ],
    explanation:
      'For any quadratic equation $ax^2 + bx + c = 0$ to possess exactly one repeated real solution, the discriminant must be zero:\n\n$$\\Delta = b^2 - 4ac = 0$$\n\nHere $a = 2$, $b = -4$, and $c = k$. Substituting these parameters:\n\n$$(-4)^2 - 4(2)(k) = 0$$\n$$16 - 8k = 0 \\implies 8k = 16 \\implies k = 2$$',
    commonMisconception:
      'Students frequently confuse the condition for two distinct real roots ($\\Delta > 0$) with the condition for exactly one root ($\\Delta = 0$), or miscalculate $(-4)^2$ as $-16$.',
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'qb-seed-02',
    collection: 'EST 1 Math Diagnostic 2025',
    domain: 'Algebra & Functions',
    chapter: 'Linear Equations & Systems',
    lesson: 'Systems of Linear Equations (2x2 & 3x3)',
    difficulty: 'hard',
    questionType: 'multiple_choice',
    calculatorAllowed: false,
    estimatedSeconds: 105,
    targetExam: 'EST 1 / SAT Math',
    prompt:
      'In the system of equations below, $p$ is a constant. If the system has no solution, what is the value of $p$?\n\n$$\\begin{cases} 3x - 5y = 12 \\\\ px + 10y = 7 \\end{cases}$$',
    choices: [
      {
        id: 'c1',
        text: '$p = -6$',
        isCorrect: true,
        rationale: 'Parallel lines require matching slope ratios: $3/p = -5/10 = -1/2 \\implies p = -6$.',
      },
      {
        id: 'c2',
        text: '$p = 6$',
        isCorrect: false,
        rationale: 'Sign error when comparing negative y-coefficient to positive.',
      },
      {
        id: 'c3',
        text: '$p = -15$',
        isCorrect: false,
        rationale: 'Incorrect cross multiplication.',
      },
      {
        id: 'c4',
        text: '$p = 10$',
        isCorrect: false,
        rationale: 'Confusing y-coefficient with target x-coefficient.',
      },
    ],
    explanation:
      'A linear system of two equations has no solution if and only if the lines are strictly parallel (identical slopes with differing y-intercepts).\n\nThe slope of the first line is $m_1 = -\\frac{3}{-5} = \\frac{3}{5}$.\nThe slope of the second line is $m_2 = -\\frac{p}{10}$.\n\nSetting slopes equal:\n$$\\frac{3}{5} = -\\frac{p}{10} \\implies 5p = -30 \\implies p = -6$$\n\nBecause the constant terms are not proportional ($12/7 \\neq -5/10$), the lines do not coincide and there is no solution.',
    commonMisconception:
      'Students often invert the slope formula or miss the negative sign in the ratio $a_1/a_2 = b_1/b_2 \\neq c_1/c_2$.',
    createdAt: '2025-01-16T11:00:00.000Z',
  },
  {
    id: 'qb-seed-03',
    collection: 'EST 1 Math Diagnostic 2025',
    domain: 'Geometry & Measurement',
    chapter: 'Circles & Coordinate Geometry',
    lesson: 'Arc Length & Sector Area Calculations',
    difficulty: 'medium',
    questionType: 'multiple_choice',
    calculatorAllowed: true,
    estimatedSeconds: 75,
    targetExam: 'EST 1 / SAT Math',
    prompt:
      'A circle with center $O$ has radius $r = 6\\text{ cm}$. A central angle $\\theta = 60^\\circ$ intercepts an arc $AB$. What is the area of sector $OAB$ in terms of $\\pi$?',
    imageUrl: SAMPLE_SECTOR_DIAGRAM_SVG,
    imageCaption: 'Circular sector OAB with central angle θ = 60° and radius r = 6 cm',
    choices: [
      {
        id: 'c1',
        text: '$6\\pi\\text{ cm}^2$',
        isCorrect: true,
        rationale: 'Area = $(\\theta / 360) \\pi r^2 = (60/360) \\pi (36) = \\frac{1}{6} \\cdot 36\\pi = 6\\pi$.',
      },
      {
        id: 'c2',
        text: '$12\\pi\\text{ cm}^2$',
        isCorrect: false,
        rationale: 'Multiplied by diameter instead of squaring radius.',
      },
      {
        id: 'c3',
        text: '$2\\pi\\text{ cm}^2$',
        isCorrect: false,
        rationale: 'Calculated arc length instead of sector area.',
      },
      {
        id: 'c4',
        text: '$36\\pi\\text{ cm}^2$',
        isCorrect: false,
        rationale: 'Calculated full circle area without fractioning the central angle.',
      },
    ],
    explanation:
      'The area of a circular sector is the fraction of the total circular area swept out by its central angle:\n\n$$\\text{Sector Area} = \\frac{\\theta}{360^\\circ} \\cdot \\pi r^2$$\n\nSubstitute $\\theta = 60^\\circ$ and $r = 6$:\n\n$$\\text{Sector Area} = \\frac{60^\\circ}{360^\\circ} \\cdot \\pi (6^2) = \\frac{1}{6} \\cdot 36\\pi = 6\\pi\\text{ cm}^2$$',
    commonMisconception:
      'Confusing the arc length formula ($s = \\frac{\\theta}{360} 2\\pi r$) with the sector area formula.',
    createdAt: '2025-01-17T09:30:00.000Z',
  },
  {
    id: 'qb-seed-04',
    collection: 'Algebra Mastery Sprint',
    domain: 'Algebra & Functions',
    chapter: 'Exponential & Logarithmic Functions',
    lesson: 'Solving Exponential Equations',
    difficulty: 'easy',
    questionType: 'grid_in',
    calculatorAllowed: false,
    estimatedSeconds: 60,
    targetExam: 'EST 1 / SAT Math',
    prompt:
      'If $4^{2x + 1} = 64$, what is the value of $x$?',
    choices: [],
    numericAnswer: '1',
    numericTolerance: '0',
    explanation:
      'Express both sides with the same base:\n\n$$4^{2x + 1} = 4^3$$\n\nEquating exponents:\n$$2x + 1 = 3 \\implies 2x = 2 \\implies x = 1$$',
    commonMisconception:
      'Incorrectly converting $64$ to base $4$ as $4^4$ instead of $4^3$.',
    createdAt: '2025-01-18T14:00:00.000Z',
  },
  {
    id: 'qb-seed-05',
    collection: 'Trigonometry & Calculus Pack',
    domain: 'Trigonometry',
    chapter: 'Unit Circle & Analytic Identities',
    lesson: 'Pythagorean Trigonometric Identities',
    difficulty: 'medium',
    questionType: 'multiple_choice',
    calculatorAllowed: false,
    estimatedSeconds: 80,
    targetExam: 'EST 2 / SAT Subject',
    prompt:
      'Given that $\\sin(\\theta) = \\frac{3}{5}$ and $\\frac{\\pi}{2} < \\theta < \\pi$, what is the exact value of $\\cos(\\theta)$?',
    choices: [
      {
        id: 'c1',
        text: '$-\\frac{4}{5}$',
        isCorrect: true,
        rationale: 'In Quadrant II, cosine is negative: $-\\sqrt{1 - (3/5)^2} = -4/5$.',
      },
      {
        id: 'c2',
        text: '$\\frac{4}{5}$',
        isCorrect: false,
        rationale: 'Forgot that cosine is negative in Quadrant II.',
      },
      {
        id: 'c3',
        text: '$-\\frac{3}{4}$',
        isCorrect: false,
        rationale: 'Calculated tangent rather than cosine.',
      },
      {
        id: 'c4',
        text: '$\\frac{5}{3}$',
        isCorrect: false,
        rationale: 'Inverted ratio to cosecant.',
      },
    ],
    explanation:
      'Using the fundamental Pythagorean trigonometric identity:\n\n$$\\sin^2(\\theta) + \\cos^2(\\theta) = 1$$\n$$\\left(\\frac{3}{5}\\right)^2 + \\cos^2(\\theta) = 1 \\implies \\frac{9}{25} + \\cos^2(\\theta) = 1$$\n$$\\cos^2(\\theta) = 1 - \\frac{9}{25} = \\frac{16}{25} \\implies \\cos(\\theta) = \\pm \\frac{4}{5}$$\n\nSince $\\frac{\\pi}{2} < \\theta < \\pi$ places the angle in **Quadrant II**, the x-coordinate (cosine) is negative. Therefore:\n\n$$\\cos(\\theta) = -\\frac{4}{5}$$',
    commonMisconception:
      'Failing to verify the quadrant constraint and selecting $+4/5$.',
    createdAt: '2025-01-19T16:00:00.000Z',
  },
  {
    id: 'qb-seed-06',
    collection: 'Trigonometry & Calculus Pack',
    domain: 'Calculus & Analysis',
    chapter: 'Differential Calculus',
    lesson: 'Tangents, Normals, & Rates of Change',
    difficulty: 'hard',
    questionType: 'multiple_choice',
    calculatorAllowed: false,
    estimatedSeconds: 120,
    targetExam: 'AP Calculus AB/BC',
    prompt:
      'Find the equation of the line tangent to the curve $f(x) = x^3 - 3x^2 + 2$ at the point where $x = 2$.',
    choices: [
      {
        id: 'c1',
        text: '$y = -2$',
        isCorrect: true,
        rationale: 'Slope $f\'(2) = 3(4) - 6(2) = 0$. Since $f(2) = -2$, tangent is horizontal: $y = -2$.',
      },
      {
        id: 'c2',
        text: '$y = 3x - 8$',
        isCorrect: false,
        rationale: 'Derivative power rule calculation error.',
      },
      {
        id: 'c3',
        text: '$y = -3x + 4$',
        isCorrect: false,
        rationale: 'Incorrect evaluation of slope.',
      },
      {
        id: 'c4',
        text: '$y = 0$',
        isCorrect: false,
        rationale: 'Confusing root of derivative with y-value on curve.',
      },
    ],
    explanation:
      'First compute the derivative function $f\'(x)$:\n\n$$f\'(x) = 3x^2 - 6x$$\n\nEvaluate at $x = 2$ to find the slope $m$ of the tangent line:\n\n$$m = f\'(2) = 3(2)^2 - 6(2) = 12 - 12 = 0$$\n\nNext evaluate $f(2)$ to identify the point of tangency $(x_0, y_0)$:\n\n$$y_0 = f(2) = 2^3 - 3(2)^2 + 2 = 8 - 12 + 2 = -2$$\n\nUsing point-slope form:\n$$y - (-2) = 0(x - 2) \\implies y + 2 = 0 \\implies y = -2$$',
    commonMisconception:
      'Overlooking that a derivative of $0$ produces a horizontal tangent line of the form $y = c$.',
    createdAt: '2025-01-20T10:00:00.000Z',
  },
]

// Service Helpers
export const questionBankService = {
  getStoredQuestions(): QuestionBankItem[] {
    try {
      const isInitialized = localStorage.getItem(QB_INITIALIZED_FLAG) === 'true'
      const raw = localStorage.getItem(STORAGE_KEY)

      // First time initialization ONLY when flag is not set AND raw key does not exist in localStorage
      if (!isInitialized && raw === null) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_QUESTIONS))
        localStorage.setItem(QB_INITIALIZED_FLAG, 'true')
        return INITIAL_SEED_QUESTIONS
      }

      // If key is missing or empty string, return empty array (do NOT resurrect default seeds)
      if (!raw) {
        return []
      }

      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // Backfill diagram for qb-seed-03 if present and missing image
        let modified = false
        const enhanced = parsed.map((item) => {
          if (item && item.id === 'qb-seed-03' && !item.imageUrl) {
            modified = true
            return {
              ...item,
              imageUrl: SAMPLE_SECTOR_DIAGRAM_SVG,
              imageCaption: 'Circular sector OAB with central angle θ = 60° and radius r = 6 cm',
            }
          }
          return item
        })
        if (modified) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(enhanced))
        }
        return enhanced
      }
      return []
    } catch (e) {
      console.error('Failed to read questions from localStorage:', e)
      return []
    }
  },

  saveQuestions(questions: QuestionBankItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions))
      localStorage.setItem(QB_INITIALIZED_FLAG, 'true')
    } catch (e) {
      console.error('Failed to save questions to localStorage:', e)
    }
  },

  /**
   * Sync a question bank item to Supabase database if configured
   */
  async syncQuestionToDatabase(question: QuestionBankItem): Promise<void> {
    if (!isSupabaseConfigured) return
    try {
      // Build content blocks structure
      const contentBlocks: any[] = []
      if (question.imageUrl) {
        contentBlocks.push({
          type: 'image',
          url: question.imageUrl,
          caption: question.imageCaption || '',
          alt: question.imageCaption || 'Question figure',
        })
      }
      if (question.prompt) {
        contentBlocks.push({
          type: 'text',
          content: question.prompt,
        })
      }

      const explanationBlocks: any[] = question.explanation
        ? [{ type: 'text', content: question.explanation }]
        : []

      // Is question ID already a valid UUID?
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(question.id)

      const payload: any = {
        difficulty: question.difficulty || 'medium',
        points: 1,
        content_blocks: contentBlocks,
        explanation_blocks: explanationBlocks,
      }
      if (isUuid) {
        payload.id = question.id
      }

      const { data: qData, error: qError } = await supabase
        .from('questions')
        .upsert(payload)
        .select('id')
        .maybeSingle()

      if (!qError && qData && question.choices && question.choices.length > 0) {
        const choiceRows = question.choices.map((c, idx) => ({
          question_id: qData.id,
          content_blocks: [{ type: 'text', content: c.text }],
          is_correct: !!c.isCorrect,
          display_order: idx,
        }))
        await supabase.from('question_choices').insert(choiceRows).catch(() => {})
      }
    } catch (err) {
      console.warn('Notice syncing question to Supabase:', err)
    }
  },

  async deleteQuestionFromDatabase(id: string): Promise<void> {
    if (!isSupabaseConfigured) return
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) return
    try {
      await supabase.from('questions').delete().eq('id', id)
    } catch (err) {
      console.warn('Notice deleting question from Supabase:', err)
    }
  },

  /**
   * Fetch questions from Supabase database and merge with local question bank
   */
  async fetchQuestionsFromDatabase(): Promise<QuestionBankItem[]> {
    if (!isSupabaseConfigured) {
      return this.getStoredQuestions()
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          difficulty,
          points,
          content_blocks,
          explanation_blocks,
          created_at,
          question_choices ( id, content_blocks, is_correct, display_order )
        `)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        return this.getStoredQuestions()
      }

      const localList = this.getStoredQuestions()
      const localMap = new Map(localList.map((q) => [q.id, q]))

      const mapped: QuestionBankItem[] = data.map((row: any) => {
        const existingLocal = localMap.get(row.id)
        let prompt = ''
        let imageUrl = ''
        let imageCaption = ''

        if (Array.isArray(row.content_blocks)) {
          row.content_blocks.forEach((b: any) => {
            if (b.type === 'text' && b.content) prompt += (prompt ? '\n\n' : '') + b.content
            if (b.type === 'image' && b.url) {
              imageUrl = b.url
              imageCaption = b.caption || ''
            }
          })
        }

        let explanation = ''
        if (Array.isArray(row.explanation_blocks)) {
          explanation = row.explanation_blocks.map((b: any) => b.content || '').join('\n\n')
        }

        const choices: QuestionChoice[] = Array.isArray(row.question_choices)
          ? row.question_choices.map((c: any, cIdx: number) => {
              let text = ''
              if (Array.isArray(c.content_blocks)) {
                text = c.content_blocks.map((b: any) => b.content || '').join('')
              }
              return {
                id: c.id || `c${cIdx + 1}`,
                text: text || `Choice ${cIdx + 1}`,
                isCorrect: Boolean(c.is_correct),
              }
            })
          : existingLocal?.choices || []

        return {
          id: String(row.id),
          collection: existingLocal?.collection || 'Imported Database Questions',
          domain: existingLocal?.domain || 'General Mathematics',
          chapter: existingLocal?.chapter || 'Core Concepts',
          lesson: existingLocal?.lesson || 'Topic Overview',
          difficulty: (row.difficulty || existingLocal?.difficulty || 'medium') as any,
          questionType: (choices.length > 0 ? 'multiple_choice' : 'grid_in') as any,
          calculatorAllowed: existingLocal?.calculatorAllowed ?? true,
          estimatedSeconds: existingLocal?.estimatedSeconds || 90,
          targetExam: existingLocal?.targetExam || 'General',
          prompt: prompt || existingLocal?.prompt || 'Question Prompt',
          imageUrl: imageUrl || existingLocal?.imageUrl,
          imageCaption: imageCaption || existingLocal?.imageCaption,
          choices,
          explanation: explanation || existingLocal?.explanation || '',
          createdAt: row.created_at || existingLocal?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })

      // Merge: keep local items not in remote
      const remoteIds = new Set(mapped.map((m) => m.id))
      const remainingLocal = localList.filter((l) => !remoteIds.has(l.id))
      const combined = [...mapped, ...remainingLocal]

      this.saveQuestions(combined)
      return combined
    } catch (e) {
      console.warn('Error reading questions from Supabase:', e)
      return this.getStoredQuestions()
    }
  },

  getQuestionById(id: string): QuestionBankItem | undefined {
    const list = this.getStoredQuestions()
    const targetId = String(id).trim()
    return list.find((q) => String(q.id).trim() === targetId)
  },

  addQuestion(question: QuestionBankItem): void {
    const list = this.getStoredQuestions()
    const targetId = String(question.id).trim()
    const updated = [question, ...list.filter((q) => String(q.id).trim() !== targetId)]
    this.saveQuestions(updated)

    // Sync to database
    this.syncQuestionToDatabase(question)
  },

  updateQuestion(id: string, updates: Partial<QuestionBankItem>): void {
    const list = this.getStoredQuestions()
    const targetId = String(id).trim()
    let updatedItem: QuestionBankItem | null = null
    const updated = list.map((q) => {
      if (String(q.id).trim() === targetId) {
        updatedItem = { ...q, ...updates, updatedAt: new Date().toISOString() }
        return updatedItem
      }
      return q
    })
    this.saveQuestions(updated)

    if (updatedItem) {
      this.syncQuestionToDatabase(updatedItem)
    }
  },

  deleteQuestion(id: string): void {
    const list = this.getStoredQuestions()
    const targetId = String(id).trim()
    const updated = list.filter((q) => String(q.id).trim() !== targetId)
    this.saveQuestions(updated)

    this.deleteQuestionFromDatabase(targetId)
  },

  deleteQuestions(ids: string[]): void {
    const list = this.getStoredQuestions()
    const idSet = new Set(ids.map((id) => String(id).trim()))
    const updated = list.filter((q) => !idSet.has(String(q.id).trim()))
    this.saveQuestions(updated)

    ids.forEach((id) => this.deleteQuestionFromDatabase(id))
  },

  clearAllQuestions(): void {
    this.saveQuestions([])
  },

  restoreDefaultSeedQuestions(): QuestionBankItem[] {
    this.saveQuestions(INITIAL_SEED_QUESTIONS)
    return INITIAL_SEED_QUESTIONS
  },

  deleteCollection(collectionName: string, deleteQuestions: boolean = false): void {
    const trimmed = collectionName.trim().toLowerCase()
    const currentCols = this.getStoredCollections()
    this.saveStoredCollections(currentCols.filter((c) => c.name.trim().toLowerCase() !== trimmed))

    const currentQuestions = this.getStoredQuestions()
    if (deleteQuestions) {
      this.saveQuestions(
        currentQuestions.filter((q) => (q.collection || '').trim().toLowerCase() !== trimmed)
      )
    } else {
      const updated = currentQuestions.map((q) => {
        if ((q.collection || '').trim().toLowerCase() === trimmed) {
          return { ...q, collection: 'General Question Bank' }
        }
        return q
      })
      this.saveQuestions(updated)
    }
  },

  // Dynamic Taxonomy Management (Domain (Unit) -> Chapter -> Lesson)
  getTaxonomy(): TaxonomyRegistry {
    try {
      const isInitialized = localStorage.getItem(TAXONOMY_INITIALIZED_FLAG) === 'true'
      const raw = localStorage.getItem(TAXONOMY_STORAGE_KEY)

      if (!isInitialized && raw === null) {
        localStorage.setItem(TAXONOMY_STORAGE_KEY, JSON.stringify(CURRICULUM_TAXONOMY))
        localStorage.setItem(TAXONOMY_INITIALIZED_FLAG, 'true')
        return CURRICULUM_TAXONOMY
      }

      if (!raw) {
        return {}
      }

      const parsed = JSON.parse(raw)
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch (e) {
      console.error('Failed to read taxonomy from localStorage:', e)
      return {}
    }
  },

  saveTaxonomy(taxonomy: TaxonomyRegistry): void {
    try {
      localStorage.setItem(TAXONOMY_STORAGE_KEY, JSON.stringify(taxonomy))
      localStorage.setItem(TAXONOMY_INITIALIZED_FLAG, 'true')
    } catch (e) {
      console.error('Failed to save taxonomy to localStorage:', e)
    }
  },

  restoreDefaultTaxonomy(): TaxonomyRegistry {
    this.saveTaxonomy(CURRICULUM_TAXONOMY)
    return CURRICULUM_TAXONOMY
  },

  clearAllTaxonomy(): void {
    this.saveTaxonomy({})
  },

  addDomain(domainName: string, unitLabel?: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (tax[domainName]) return
    tax[domainName] = {
      unitLabel: unitLabel || `Unit: ${domainName}`,
      code: code || domainName.slice(0, 4).toUpperCase(),
      chapters: [],
    }
    this.saveTaxonomy(tax)
  },

  updateDomain(oldDomainName: string, newDomainName: string, unitLabel?: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[oldDomainName]) return
    const existingData = tax[oldDomainName]
    delete tax[oldDomainName]
    tax[newDomainName] = {
      ...existingData,
      unitLabel: unitLabel ?? existingData.unitLabel,
      code: code ?? existingData.code,
    }
    this.saveTaxonomy(tax)

    // Update questions mapped to the old domain name
    if (oldDomainName !== newDomainName) {
      const questions = this.getStoredQuestions()
      const updated = questions.map((q) =>
        q.domain === oldDomainName ? { ...q, domain: newDomainName } : q
      )
      this.saveQuestions(updated)
    }
  },

  deleteDomain(domainName: string, deleteLinkedQuestions: boolean = false): void {
    const tax = this.getTaxonomy()
    const trimmed = domainName.trim()
    const matchKey = Object.keys(tax).find((k) => k.trim().toLowerCase() === trimmed.toLowerCase()) || trimmed
    if (!tax[matchKey]) return
    delete tax[matchKey]
    this.saveTaxonomy(tax)

    if (deleteLinkedQuestions) {
      const questions = this.getStoredQuestions()
      this.saveQuestions(questions.filter((q) => q.domain.trim().toLowerCase() !== trimmed.toLowerCase()))
    }
  },

  addChapter(domainName: string, chapterName: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const exists = tax[domainName].chapters.some((c) => c.name === chapterName)
    if (exists) return
    tax[domainName].chapters.push({
      name: chapterName,
      code: code || `${tax[domainName].code || 'U'}.${tax[domainName].chapters.length + 1}`,
      lessons: [],
    })
    this.saveTaxonomy(tax)
  },

  updateChapter(domainName: string, oldChapterName: string, newChapterName: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const target = tax[domainName].chapters.find((c) => c.name === oldChapterName)
    if (!target) return
    target.name = newChapterName
    if (code) target.code = code
    this.saveTaxonomy(tax)

    if (oldChapterName !== newChapterName) {
      const questions = this.getStoredQuestions()
      const updated = questions.map((q) =>
        q.domain === domainName && q.chapter === oldChapterName ? { ...q, chapter: newChapterName } : q
      )
      this.saveQuestions(updated)
    }
  },

  deleteChapter(domainName: string, chapterName: string, deleteLinkedQuestions: boolean = false): void {
    const tax = this.getTaxonomy()
    const dTrim = domainName.trim().toLowerCase()
    const cTrim = chapterName.trim().toLowerCase()
    const dKey = Object.keys(tax).find((k) => k.trim().toLowerCase() === dTrim) || domainName
    if (!tax[dKey]) return
    tax[dKey].chapters = tax[dKey].chapters.filter((c) => c.name.trim().toLowerCase() !== cTrim)
    this.saveTaxonomy(tax)

    if (deleteLinkedQuestions) {
      const questions = this.getStoredQuestions()
      this.saveQuestions(
        questions.filter(
          (q) => !(q.domain.trim().toLowerCase() === dTrim && q.chapter.trim().toLowerCase() === cTrim)
        )
      )
    }
  },

  addLesson(domainName: string, chapterName: string, lessonName: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const chapter = tax[domainName].chapters.find((c) => c.name === chapterName)
    if (!chapter) return
    if (chapter.lessons.includes(lessonName)) return
    chapter.lessons.push(lessonName)
    this.saveTaxonomy(tax)
  },

  updateLesson(domainName: string, chapterName: string, oldLessonName: string, newLessonName: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const chapter = tax[domainName].chapters.find((c) => c.name === chapterName)
    if (!chapter) return
    const idx = chapter.lessons.indexOf(oldLessonName)
    if (idx === -1) return
    chapter.lessons[idx] = newLessonName
    this.saveTaxonomy(tax)

    if (oldLessonName !== newLessonName) {
      const questions = this.getStoredQuestions()
      const updated = questions.map((q) =>
        q.domain === domainName && q.chapter === chapterName && q.lesson === oldLessonName
          ? { ...q, lesson: newLessonName }
          : q
      )
      this.saveQuestions(updated)
    }
  },

  moveChapter(fromDomain: string, toDomain: string, chapterName: string, newChapterName?: string, newCode?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[fromDomain] || !tax[toDomain]) return
    const chapterIdx = tax[fromDomain].chapters.findIndex((c) => c.name === chapterName)
    if (chapterIdx === -1) return
    const [chapterObj] = tax[fromDomain].chapters.splice(chapterIdx, 1)
    if (newChapterName) chapterObj.name = newChapterName
    if (newCode) chapterObj.code = newCode
    tax[toDomain].chapters.push(chapterObj)
    this.saveTaxonomy(tax)

    const finalName = newChapterName || chapterName
    const questions = this.getStoredQuestions()
    const updated = questions.map((q) =>
      q.domain === fromDomain && q.chapter === chapterName
        ? { ...q, domain: toDomain, chapter: finalName }
        : q
    )
    this.saveQuestions(updated)
  },

  moveLesson(fromDomain: string, fromChapter: string, toDomain: string, toChapter: string, oldLessonName: string, newLessonName?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[fromDomain] || !tax[toDomain]) return
    const srcChapter = tax[fromDomain].chapters.find((c) => c.name === fromChapter)
    const dstChapter = tax[toDomain].chapters.find((c) => c.name === toChapter)
    if (!srcChapter || !dstChapter) return
    const lessonIdx = srcChapter.lessons.indexOf(oldLessonName)
    if (lessonIdx === -1) return
    srcChapter.lessons.splice(lessonIdx, 1)
    const finalLesson = newLessonName || oldLessonName
    if (!dstChapter.lessons.includes(finalLesson)) {
      dstChapter.lessons.push(finalLesson)
    }
    this.saveTaxonomy(tax)

    const questions = this.getStoredQuestions()
    const updated = questions.map((q) =>
      q.domain === fromDomain && q.chapter === fromChapter && q.lesson === oldLessonName
        ? { ...q, domain: toDomain, chapter: toChapter, lesson: finalLesson }
        : q
    )
    this.saveQuestions(updated)
  },

  deleteLesson(domainName: string, chapterName: string, lessonName: string, deleteLinkedQuestions: boolean = false): void {
    const tax = this.getTaxonomy()
    const dTrim = domainName.trim().toLowerCase()
    const cTrim = chapterName.trim().toLowerCase()
    const lTrim = lessonName.trim().toLowerCase()
    const dKey = Object.keys(tax).find((k) => k.trim().toLowerCase() === dTrim) || domainName
    if (!tax[dKey]) return
    const chapter = tax[dKey].chapters.find((c) => c.name.trim().toLowerCase() === cTrim)
    if (!chapter) return
    chapter.lessons = chapter.lessons.filter((l) => l.trim().toLowerCase() !== lTrim)
    this.saveTaxonomy(tax)

    if (deleteLinkedQuestions) {
      const questions = this.getStoredQuestions()
      this.saveQuestions(
        questions.filter(
          (q) =>
            !(
              q.domain.trim().toLowerCase() === dTrim &&
              q.chapter.trim().toLowerCase() === cTrim &&
              q.lesson.trim().toLowerCase() === lTrim
            )
        )
      )
    }
  },

  // Returns questions filtered by domain, chapter, or lesson
  getQuestionsForTaxonomy(domain?: string, chapter?: string, lesson?: string): QuestionBankItem[] {
    const questions = this.getStoredQuestions()
    return questions.filter((q) => {
      if (domain && q.domain !== domain) return false
      if (chapter && q.chapter !== chapter) return false
      if (lesson && q.lesson !== lesson) return false
      return true
    })
  },

  getStoredCollections(): QuestionCollection[] {
    try {
      const isInitialized = localStorage.getItem(COLLECTIONS_INITIALIZED_FLAG) === 'true'
      const raw = localStorage.getItem(COLLECTIONS_STORAGE_KEY)

      if (!isInitialized && raw === null) {
        localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(INITIAL_COLLECTIONS))
        localStorage.setItem(COLLECTIONS_INITIALIZED_FLAG, 'true')
        return INITIAL_COLLECTIONS
      }

      if (!raw) {
        return []
      }

      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.error('Failed to read collections from localStorage:', e)
      return []
    }
  },

  saveStoredCollections(collections: QuestionCollection[]): void {
    try {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections))
      localStorage.setItem(COLLECTIONS_INITIALIZED_FLAG, 'true')
    } catch (e) {
      console.error('Failed to save collections to localStorage:', e)
    }
  },

  getCollectionsList(): QuestionCollection[] {
    const questions = this.getStoredQuestions()
    const storedCols = this.getStoredCollections()

    // Calculate live question count per collection
    const counts = new Map<string, number>()
    questions.forEach((q) => {
      const name = q.collection?.trim() || 'General Question Bank'
      counts.set(name, (counts.get(name) || 0) + 1)
    })

    const map = new Map<string, QuestionCollection>()
    // Add stored collections first (even empty ones)
    storedCols.forEach((col) => {
      map.set(col.name, {
        ...col,
        questionCount: counts.get(col.name) || 0,
      })
    })

    // Also include any collection names found in stored questions that weren't explicitly registered
    counts.forEach((count, name) => {
      if (!map.has(name)) {
        map.set(name, {
          id: `col-auto-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name,
          description: '',
          targetExam: 'EST 1 / SAT Math',
          colorTag: 'blue',
          questionCount: count,
          createdAt: new Date().toISOString(),
        })
      }
    })

    return Array.from(map.values())
  },

  createCollection(
    name: string,
    description: string = '',
    targetExam: string = 'EST 1 / SAT Math',
    colorTag: string = 'blue'
  ): { success: boolean; error?: string; collection?: QuestionCollection } {
    const trimmed = name.trim()
    if (!trimmed) {
      return { success: false, error: 'Collection name cannot be empty.' }
    }

    const currentList = this.getStoredCollections()
    const existing = currentList.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      return { success: false, error: `A collection named "${trimmed}" already exists.` }
    }

    const newCollection: QuestionCollection = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      description: description.trim(),
      targetExam,
      colorTag,
      questionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updated = [...currentList, newCollection]
    this.saveStoredCollections(updated)

    return {
      success: true,
      collection: newCollection,
    }
  },

  updateCollection(
    oldName: string,
    updatedData: { name: string; description?: string; targetExam?: string; colorTag?: string }
  ): { success: boolean; error?: string } {
    const newName = updatedData.name.trim()
    if (!newName) {
      return { success: false, error: 'Collection name cannot be empty.' }
    }

    const currentCols = this.getStoredCollections()
    if (newName.toLowerCase() !== oldName.toLowerCase()) {
      const collision = currentCols.find((c) => c.name.toLowerCase() === newName.toLowerCase())
      if (collision) {
        return { success: false, error: `A collection named "${newName}" already exists.` }
      }
    }

    const updatedCols = currentCols.map((c) => {
      if (c.name === oldName) {
        return {
          ...c,
          name: newName,
          description: updatedData.description !== undefined ? updatedData.description : c.description,
          targetExam: updatedData.targetExam !== undefined ? updatedData.targetExam : c.targetExam,
          colorTag: updatedData.colorTag !== undefined ? updatedData.colorTag : c.colorTag,
          updatedAt: new Date().toISOString(),
        }
      }
      return c
    })
    this.saveStoredCollections(updatedCols)

    // Update questions referencing the old name
    if (newName !== oldName) {
      const questions = this.getStoredQuestions()
      const updatedQuestions = questions.map((q) => {
        if (q.collection === oldName) {
          return { ...q, collection: newName }
        }
        return q
      })
      this.saveQuestions(updatedQuestions)
    }

    return { success: true }
  },

  assignQuestionsToCollection(questionIds: string[], targetCollection: string): void {
    const idsSet = new Set(questionIds)
    const current = this.getStoredQuestions()
    const updated = current.map((q) => {
      if (idsSet.has(q.id)) {
        return { ...q, collection: targetCollection }
      }
      return q
    })
    this.saveQuestions(updated)
  },

  /**
   * Imports a JSON object or array into the question bank as a collection.
   * Gracefully supports:
   * - { collection_name: "...", description: "...", questions: [...] }
   * - { collectionName: "...", questions: [...] }
   * - { questions: [...] }
   * - Raw array of questions: [ { ... }, { ... } ]
   */
  importQuestionCollection(
    rawJson: any,
    fallbackCollectionName?: string
  ): { success: boolean; count: number; collectionName: string; errors?: string[] } {
    const errors: string[] = []
    let targetCollection =
      fallbackCollectionName?.trim() ||
      rawJson.collection_name ||
      rawJson.collectionName ||
      rawJson.collection ||
      'Imported Collection'

    let rawQuestionsList: any[] = []

    if (Array.isArray(rawJson)) {
      rawQuestionsList = rawJson
    } else if (rawJson && typeof rawJson === 'object') {
      if (Array.isArray(rawJson.questions)) {
        rawQuestionsList = rawJson.questions
      } else if (Array.isArray(rawJson.items)) {
        rawQuestionsList = rawJson.items
      } else {
        // Single question object
        rawQuestionsList = [rawJson]
      }
    } else {
      return {
        success: false,
        count: 0,
        collectionName: targetCollection,
        errors: ['Invalid JSON format: Expected a collection object or an array of questions.'],
      }
    }

    if (rawQuestionsList.length === 0) {
      return {
        success: false,
        count: 0,
        collectionName: targetCollection,
        errors: ['No questions found in the imported file.'],
      }
    }

    const importedQuestions: QuestionBankItem[] = []
    const now = new Date().toISOString()

    rawQuestionsList.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Item #${idx + 1} is not a valid question object.`)
        return
      }

      const prompt =
        item.prompt ||
        item.stem ||
        item.question ||
        item.text ||
        item.title ||
        `Imported Question #${idx + 1}`

      const domain = item.domain || 'Algebra & Functions'
      const chapter = item.chapter || item.cluster || item.unit || 'Linear Equations & Systems'
      const lesson = item.lesson || item.standard || item.competency || 'Single-Variable Linear Equations'
      const difficulty = ['easy', 'medium', 'hard'].includes(item.difficulty?.toLowerCase())
        ? (item.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard')
        : 'medium'

      const questionType = ['multiple_choice', 'multi_select', 'grid_in'].includes(item.questionType || item.type)
        ? (item.questionType || item.type)
        : 'multiple_choice'

      // Normalize choices
      let choices: QuestionChoice[] = []
      if (Array.isArray(item.choices)) {
        choices = item.choices.map((c: any, cIdx: number) => ({
          id: c.id || `c-${idx}-${cIdx}-${Date.now()}`,
          text: typeof c === 'string' ? c : c.text || c.label || `Option ${cIdx + 1}`,
          isCorrect: Boolean(c.isCorrect || c.correct || c.is_correct),
          rationale: c.rationale || c.explanation || '',
        }))
      } else if (Array.isArray(item.options)) {
        choices = item.options.map((opt: any, cIdx: number) => {
          const isCorrect =
            item.correct === cIdx ||
            item.correctIndex === cIdx ||
            item.correctAnswer === opt ||
            (typeof opt === 'object' && Boolean(opt.isCorrect))

          return {
            id: `c-${idx}-${cIdx}-${Date.now()}`,
            text: typeof opt === 'string' ? opt : opt.text || opt.label || `Option ${cIdx + 1}`,
            isCorrect,
            rationale: typeof opt === 'object' ? opt.rationale : '',
          }
        })
      }

      // If multiple choice but no choice marked correct, default first choice
      if (questionType !== 'grid_in' && choices.length > 0 && !choices.some((c) => c.isCorrect)) {
        choices[0].isCorrect = true
      }

      const questionItem: QuestionBankItem = {
        id: item.id ? String(item.id) : `qb-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        collection: item.collection || targetCollection,
        domain,
        chapter,
        lesson,
        difficulty,
        questionType,
        calculatorAllowed: Boolean(item.calculatorAllowed ?? item.calculator),
        estimatedSeconds: Number(item.estimatedSeconds || item.timeLimit || 90),
        targetExam: item.targetExam || item.exam || 'EST 1 / SAT Math',
        prompt,
        imageUrl: item.imageUrl || item.image || item.diagram || '',
        imageCaption: item.imageCaption || item.caption || '',
        choices,
        numericAnswer: String(item.numericAnswer || item.correct_answer || item.answer || ''),
        numericTolerance: String(item.numericTolerance || '0'),
        explanation: item.explanation || item.solution || item.derivation || '',
        commonMisconception: item.commonMisconception || item.trap || item.misconception || '',
        createdAt: item.createdAt || now,
        updatedAt: now,
      }

      importedQuestions.push(questionItem)
    })

    if (importedQuestions.length === 0) {
      return {
        success: false,
        count: 0,
        collectionName: targetCollection,
        errors: errors.length > 0 ? errors : ['Failed to extract any valid questions.'],
      }
    }

    // Merge into general question bank repository
    const existing = this.getStoredQuestions()
    // Append or replace matching IDs
    const existingIds = new Set(importedQuestions.map((q) => q.id))
    const merged = [...importedQuestions, ...existing.filter((q) => !existingIds.has(q.id))]
    this.saveQuestions(merged)

    // Ensure collection is registered in stored collections
    const storedCols = this.getStoredCollections()
    if (!storedCols.some((c) => c.name.toLowerCase() === targetCollection.toLowerCase())) {
      this.saveStoredCollections([
        ...storedCols,
        {
          id: `col-import-${Date.now()}`,
          name: targetCollection,
          description: rawJson.description || 'Imported collection',
          targetExam: 'EST 1 / SAT Math',
          colorTag: 'blue',
          questionCount: importedQuestions.length,
          createdAt: new Date().toISOString(),
        },
      ])
    }

    return {
      success: true,
      count: importedQuestions.length,
      collectionName: targetCollection,
      errors: errors.length > 0 ? errors : undefined,
    }
  },

  exportCollectionAsJson(collectionName?: string): string {
    const questions = this.getStoredQuestions()
    const exportList = collectionName
      ? questions.filter((q) => (q.collection || 'General Question Bank') === collectionName)
      : questions

    const output = {
      collection_name: collectionName || 'All Math Diagnostic Question Bank',
      exported_at: new Date().toISOString(),
      version: '2.0',
      question_count: exportList.length,
      questions: exportList,
    }

    return JSON.stringify(output, null, 2)
  },

  getSampleCollectionTemplate(): object {
    return {
      collection_name: 'EST 1 Math Diagnostic - Specimen Collection',
      description: 'Curriculum-aligned questions with domains, chapters, lessons and KaTeX support',
      version: '2.0',
      questions: [
        {
          id: 'specimen-01',
          domain: 'Algebra & Functions',
          chapter: 'Quadratic & Polynomial Equations',
          lesson: 'Quadratic Formula & Discriminant Analysis',
          difficulty: 'medium',
          questionType: 'multiple_choice',
          calculatorAllowed: false,
          estimatedSeconds: 90,
          targetExam: 'EST 1 / SAT Math',
          prompt:
            'For the quadratic equation $2x^2 - 4x + k = 0$, what value of $k$ gives exactly one real distinct root?',
          imageUrl: '',
          imageCaption: '',
          choices: [
            {
              id: 'c1',
              text: '$k = 2$',
              isCorrect: true,
              rationale: 'Discriminant 16 - 8k = 0 implies k = 2.',
            },
            {
              id: 'c2',
              text: '$k = 4$',
              isCorrect: false,
              rationale: 'Yields negative discriminant and complex roots.',
            },
            {
              id: 'c3',
              text: '$k = -2$',
              isCorrect: false,
              rationale: 'Sign error on -4ac.',
            },
            {
              id: 'c4',
              text: '$k = 0$',
              isCorrect: false,
              rationale: 'Yields two distinct roots: 0 and 2.',
            },
          ],
          explanation:
            'For exactly one distinct real root, the discriminant must be zero: $\\Delta = b^2 - 4ac = 0$. Here $(-4)^2 - 4(2)(k) = 0 \\implies 16 - 8k = 0 \\implies k = 2$.',
          commonMisconception:
            'Students frequently confuse the condition for two roots ($\\Delta > 0$) with one root ($\\Delta = 0$).',
        },
        {
          id: 'specimen-02',
          domain: 'Geometry & Measurement',
          chapter: 'Circles & Coordinate Geometry',
          lesson: 'Arc Length & Sector Area Calculations',
          difficulty: 'easy',
          questionType: 'grid_in',
          calculatorAllowed: true,
          estimatedSeconds: 60,
          targetExam: 'EST 1 / SAT Math',
          prompt:
            'A circle has a radius of $10$. What is the area of a $90^\\circ$ sector divided by $\\pi$?',
          imageUrl: '',
          imageCaption: '',
          choices: [],
          numericAnswer: '25',
          numericTolerance: '0',
          explanation:
            'The area of the circle is $\\pi r^2 = 100\\pi$. A $90^\\circ$ sector is $90/360 = 1/4$ of the circle, so the area is $25\\pi$. Dividing by $\\pi$ gives $25$.',
          commonMisconception:
            'Dividing by diameter rather than squaring radius.',
        },
      ],
    }
  },
}
