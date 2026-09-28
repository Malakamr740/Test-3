import React, { useState, useMemo } from 'react'
import { Search, Sparkles, DollarSign, HelpCircle, Check } from 'lucide-react'

export interface MathSymbolItem {
  label: string
  latex: string
  name: string
  category: 'delimiters' | 'algebra' | 'geometry' | 'relations' | 'calculus' | 'stats_greek'
  isDelimiter?: boolean
  isCurrency?: boolean
  wrapTemplate?: (selected: string) => string
  cursorOffsetInside?: number // offset from start of inserted text when inside math
  selectLengthInside?: number // length of text to select
  tooltip?: string
  popular?: boolean
}

export const ALL_MATH_SYMBOLS: MathSymbolItem[] = [
  // ── Delimiters & Currency ($) ──
  {
    label: '$…$',
    latex: '$',
    name: 'dollar inline math wrapper latex delimiters equation formula',
    category: 'delimiters',
    isDelimiter: true,
    popular: true,
    tooltip: 'Inline math wrapper: $...$ (wraps highlighted text or places cursor inside)',
  },
  {
    label: '$$…$$',
    latex: '$$',
    name: 'dollar block display math wrapper center equations',
    category: 'delimiters',
    isDelimiter: true,
    popular: true,
    tooltip: 'Display/Block math: $$...$$ (centered equation)',
  },
  {
    label: '\\$',
    latex: '\\$',
    name: 'dollar sign currency money price cost escape literal dollar',
    category: 'delimiters',
    isCurrency: true,
    popular: true,
    tooltip: 'Currency dollar sign: \\$ (e.g. \\$25.00, prevents LaTeX syntax conflicts)',
  },
  {
    label: '\\text{…}',
    latex: '\\text{}',
    name: 'text words units plain text inside equation cm meters hours',
    category: 'delimiters',
    popular: true,
    wrapTemplate: (s) => `\\text{${s}}`,
    cursorOffsetInside: 6,
    tooltip: 'Plain text inside formula: \\text{cm}',
  },
  {
    label: '(…)',
    latex: '\\left(  \\right)',
    name: 'parentheses auto sizing brackets parens left right',
    category: 'delimiters',
    wrapTemplate: (s) => `\\left( ${s} \\right)`,
    cursorOffsetInside: 7,
    tooltip: 'Auto-sizing parentheses: \\left( ... \\right)',
  },
  {
    label: '[…]',
    latex: '\\left[  \\right]',
    name: 'brackets square brackets auto sizing left right',
    category: 'delimiters',
    wrapTemplate: (s) => `\\left[ ${s} \\right]`,
    cursorOffsetInside: 7,
    tooltip: 'Auto-sizing square brackets: \\left[ ... \\right]',
  },
  {
    label: '{…}',
    latex: '\\{  \\}',
    name: 'curly braces set notation set builder elements',
    category: 'delimiters',
    wrapTemplate: (s) => `\\{ ${s} \\}`,
    cursorOffsetInside: 3,
    tooltip: 'Literal curly braces: \\{ ... \\}',
  },
  {
    label: '|x|',
    latex: '\\left| x \\right|',
    name: 'absolute value modulus determinant magnitude bars',
    category: 'delimiters',
    popular: true,
    wrapTemplate: (s) => `\\left| ${s} \\right|`,
    cursorOffsetInside: 7,
    selectLengthInside: 1,
    tooltip: 'Absolute value / modulus: \\left| x \\right|',
  },

  // ── Algebra, Fractions, Powers & Roots ──
  {
    label: 'a/b',
    latex: '\\frac{a}{b}',
    name: 'fraction divide over rational quotient a b',
    category: 'algebra',
    popular: true,
    wrapTemplate: (s) => `\\frac{${s}}{b}`,
    cursorOffsetInside: 6,
    selectLengthInside: 1,
    tooltip: 'Fraction: \\frac{a}{b}',
  },
  {
    label: 'x²',
    latex: 'x^2',
    name: 'squared power 2 exponent quadratic',
    category: 'algebra',
    popular: true,
    wrapTemplate: (s) => `{${s}}^2`,
    tooltip: 'Squared: x^2',
  },
  {
    label: 'x³',
    latex: 'x^3',
    name: 'cubed power 3 exponent cubic',
    category: 'algebra',
    wrapTemplate: (s) => `{${s}}^3`,
    tooltip: 'Cubed: x^3',
  },
  {
    label: 'xⁿ',
    latex: 'x^{n}',
    name: 'power exponent nth power superscript power n',
    category: 'algebra',
    popular: true,
    wrapTemplate: (s) => `{${s}}^{n}`,
    cursorOffsetInside: 3,
    selectLengthInside: 1,
    tooltip: 'Exponent / power: x^{n}',
  },
  {
    label: 'x_n',
    latex: 'x_{n}',
    name: 'subscript index sequence term sequence sub n',
    category: 'algebra',
    popular: true,
    wrapTemplate: (s) => `{${s}}_{n}`,
    cursorOffsetInside: 3,
    selectLengthInside: 1,
    tooltip: 'Subscript: x_{n}',
  },
  {
    label: '√x',
    latex: '\\sqrt{x}',
    name: 'square root radical root sqrt',
    category: 'algebra',
    popular: true,
    wrapTemplate: (s) => `\\sqrt{${s}}`,
    cursorOffsetInside: 6,
    selectLengthInside: 1,
    tooltip: 'Square root: \\sqrt{x}',
  },
  {
    label: 'ⁿ√x',
    latex: '\\sqrt[n]{x}',
    name: 'nth root cube root radical index root',
    category: 'algebra',
    popular: true,
    wrapTemplate: (s) => `\\sqrt[n]{${s}}`,
    cursorOffsetInside: 9,
    selectLengthInside: 1,
    tooltip: 'Nth root: \\sqrt[n]{x}',
  },
  {
    label: '·',
    latex: '\\cdot',
    name: 'multiplication dot times dot product scalar product cdot',
    category: 'algebra',
    popular: true,
    tooltip: 'Multiplication dot: \\cdot',
  },
  {
    label: '×',
    latex: '\\times',
    name: 'times cross multiply cross product scientific notation',
    category: 'algebra',
    popular: true,
    tooltip: 'Multiplication cross: \\times',
  },
  {
    label: '÷',
    latex: '\\div',
    name: 'divide division sign div',
    category: 'algebra',
    popular: true,
    tooltip: 'Division sign: \\div',
  },
  {
    label: '±',
    latex: '\\pm',
    name: 'plus minus sign tolerance quadratic formula pm',
    category: 'algebra',
    popular: true,
    tooltip: 'Plus-minus: \\pm',
  },
  {
    label: '∓',
    latex: '\\mp',
    name: 'minus plus sign mp',
    category: 'algebra',
    tooltip: 'Minus-plus: \\mp',
  },
  {
    label: 'binom',
    latex: '\\binom{n}{k}',
    name: 'binomial coefficient combinations n choose k probability',
    category: 'algebra',
    tooltip: 'Binomial coefficient: \\binom{n}{k}',
  },
  {
    label: 'cases',
    latex: '\\begin{cases} x & \\text{if } x \\ge 0 \\\\ -x & \\text{if } x < 0 \\end{cases}',
    name: 'piecewise function cases system equations brace',
    category: 'algebra',
    tooltip: 'Piecewise function / system: \\begin{cases}...\\end{cases}',
  },

  // ── Geometry & Trigonometry ──
  {
    label: '°',
    latex: '^\\circ',
    name: 'degree degrees angle 30 45 60 90 temperature circ',
    category: 'geometry',
    popular: true,
    wrapTemplate: (s) => `{${s}}^\\circ`,
    tooltip: 'Degree symbol: ^\\circ (e.g. 60^\\circ)',
  },
  {
    label: '∠',
    latex: '\\angle',
    name: 'angle geometric angle ABC angle DEF',
    category: 'geometry',
    popular: true,
    wrapTemplate: (s) => `\\angle ${s}`,
    tooltip: 'Angle: \\angle ABC',
  },
  {
    label: 'm∠',
    latex: 'm\\angle',
    name: 'measure angle measure of angle m angle ABC',
    category: 'geometry',
    popular: true,
    wrapTemplate: (s) => `m\\angle ${s}`,
    tooltip: 'Measure of angle: m\\angle ABC',
  },
  {
    label: '△',
    latex: '\\triangle',
    name: 'triangle delta shape ABC triangle XYZ',
    category: 'geometry',
    popular: true,
    wrapTemplate: (s) => `\\triangle ${s}`,
    tooltip: 'Triangle: \\triangle ABC',
  },
  {
    label: '⊥',
    latex: '\\perp',
    name: 'perpendicular orthogonal altitude normal right angle 90 degrees perp',
    category: 'geometry',
    popular: true,
    tooltip: 'Perpendicular: \\perp (e.g. AB \\perp CD)',
  },
  {
    label: '∥',
    latex: '\\parallel',
    name: 'parallel lines parallel transversals identical slopes',
    category: 'geometry',
    popular: true,
    tooltip: 'Parallel: \\parallel (e.g. d_1 \\parallel d_2)',
  },
  {
    label: '≅',
    latex: '\\cong',
    name: 'congruent congruence triangle congruent SSS SAS ASA',
    category: 'geometry',
    popular: true,
    tooltip: 'Congruent: \\cong',
  },
  {
    label: '∼',
    latex: '\\sim',
    name: 'similar similarity triangle similar proportional',
    category: 'geometry',
    popular: true,
    tooltip: 'Similar: \\sim',
  },
  {
    label: 'AB̄',
    latex: '\\overline{AB}',
    name: 'line segment bar overline overbar line segment AB',
    category: 'geometry',
    popular: true,
    wrapTemplate: (s) => `\\overline{${s}}`,
    cursorOffsetInside: 10,
    selectLengthInside: 2,
    tooltip: 'Line segment overbar: \\overline{AB}',
  },
  {
    label: 'v⃗',
    latex: '\\vec{v}',
    name: 'vector arrow directed ray overarrow',
    category: 'geometry',
    wrapTemplate: (s) => `\\vec{${s}}`,
    cursorOffsetInside: 5,
    selectLengthInside: 1,
    tooltip: 'Vector arrow: \\vec{v}',
  },
  {
    label: 'π',
    latex: '\\pi',
    name: 'pi circle circumference area 3.14159 radians',
    category: 'geometry',
    popular: true,
    tooltip: 'Pi: \\pi',
  },
  {
    label: 'θ',
    latex: '\\theta',
    name: 'theta angle radians trigonometry unknown angle',
    category: 'geometry',
    popular: true,
    tooltip: 'Theta: \\theta',
  },
  {
    label: 'α',
    latex: '\\alpha',
    name: 'alpha angle greek letter',
    category: 'geometry',
    tooltip: 'Alpha: \\alpha',
  },
  {
    label: 'β',
    latex: '\\beta',
    name: 'beta angle greek letter',
    category: 'geometry',
    tooltip: 'Beta: \\beta',
  },
  {
    label: 'φ',
    latex: '\\phi',
    name: 'phi angle golden ratio',
    category: 'geometry',
    tooltip: 'Phi: \\phi',
  },
  {
    label: 'sin',
    latex: '\\sin(x)',
    name: 'sine trig trigonometric SOH CAH TOA',
    category: 'geometry',
    tooltip: 'Sine: \\sin(x)',
  },
  {
    label: 'cos',
    latex: '\\cos(x)',
    name: 'cosine trig trigonometric SOH CAH TOA',
    category: 'geometry',
    tooltip: 'Cosine: \\cos(x)',
  },
  {
    label: 'tan',
    latex: '\\tan(x)',
    name: 'tangent trig trigonometric SOH CAH TOA',
    category: 'geometry',
    tooltip: 'Tangent: \\tan(x)',
  },
  {
    label: 'arcsin',
    latex: '\\arcsin(x)',
    name: 'inverse sine arcsin sin^-1',
    category: 'geometry',
    tooltip: 'Inverse sine: \\arcsin(x)',
  },
  {
    label: 'arccos',
    latex: '\\arccos(x)',
    name: 'inverse cosine arccos cos^-1',
    category: 'geometry',
    tooltip: 'Inverse cosine: \\arccos(x)',
  },
  {
    label: 'arctan',
    latex: '\\arctan(x)',
    name: 'inverse tangent arctan tan^-1',
    category: 'geometry',
    tooltip: 'Inverse tangent: \\arctan(x)',
  },

  // ── Inequalities, Relations & Sets ──
  {
    label: '≤',
    latex: '\\le',
    name: 'less than or equal to inequality leq',
    category: 'relations',
    popular: true,
    tooltip: 'Less than or equal to: \\le',
  },
  {
    label: '≥',
    latex: '\\ge',
    name: 'greater than or equal to inequality geq',
    category: 'relations',
    popular: true,
    tooltip: 'Greater than or equal to: \\ge',
  },
  {
    label: '≠',
    latex: '\\neq',
    name: 'not equal unequal differs',
    category: 'relations',
    popular: true,
    tooltip: 'Not equal to: \\neq',
  },
  {
    label: '≈',
    latex: '\\approx',
    name: 'approximately equal approx rounding estimation almost',
    category: 'relations',
    popular: true,
    tooltip: 'Approximately equal: \\approx',
  },
  {
    label: '≡',
    latex: '\\equiv',
    name: 'identically equal equivalent modular congruence',
    category: 'relations',
    tooltip: 'Equivalent / identical: \\equiv',
  },
  {
    label: '∝',
    latex: '\\propto',
    name: 'proportional variation varies directly directly proportional',
    category: 'relations',
    tooltip: 'Proportional to: \\propto',
  },
  {
    label: '∈',
    latex: '\\in',
    name: 'element of member of belongs to set',
    category: 'relations',
    popular: true,
    tooltip: 'Element of: \\in',
  },
  {
    label: '∉',
    latex: '\\notin',
    name: 'not element of not in set',
    category: 'relations',
    tooltip: 'Not an element of: \\notin',
  },
  {
    label: '⊂',
    latex: '\\subset',
    name: 'subset proper subset set inclusion',
    category: 'relations',
    tooltip: 'Subset of: \\subset',
  },
  {
    label: '∪',
    latex: '\\cup',
    name: 'union set union or Venn diagram',
    category: 'relations',
    popular: true,
    tooltip: 'Set union: \\cup',
  },
  {
    label: '∩',
    latex: '\\cap',
    name: 'intersection set intersection and Venn diagram',
    category: 'relations',
    popular: true,
    tooltip: 'Set intersection: \\cap',
  },
  {
    label: '∅',
    latex: '\\emptyset',
    name: 'empty set null set no solution null',
    category: 'relations',
    popular: true,
    tooltip: 'Empty set (no solution): \\emptyset',
  },
  {
    label: '⇒',
    latex: '\\implies',
    name: 'implies conditional logic therefore',
    category: 'relations',
    popular: true,
    tooltip: 'Implies: \\implies',
  },
  {
    label: '⇔',
    latex: '\\iff',
    name: 'if and only if biconditional logic equivalence',
    category: 'relations',
    tooltip: 'If and only if: \\iff',
  },
  {
    label: '→',
    latex: '\\to',
    name: 'approaches arrow right arrow tends to limit',
    category: 'relations',
    tooltip: 'Approaches: \\to',
  },
  {
    label: '∴',
    latex: '\\therefore',
    name: 'therefore proof conclusion conclusion dots',
    category: 'relations',
    tooltip: 'Therefore: \\therefore',
  },
  {
    label: '∵',
    latex: '\\because',
    name: 'because since reason proof',
    category: 'relations',
    tooltip: 'Because: \\because',
  },

  // ── Functions & Calculus ──
  {
    label: 'f(x)',
    latex: 'f(x)',
    name: 'function notation f of x formula',
    category: 'calculus',
    tooltip: 'Function notation: f(x)',
  },
  {
    label: 'f⁻¹(x)',
    latex: 'f^{-1}(x)',
    name: 'inverse function f inverse',
    category: 'calculus',
    tooltip: 'Inverse function: f^{-1}(x)',
  },
  {
    label: '(f∘g)',
    latex: '(f \\circ g)(x)',
    name: 'composite function composition f of g of x',
    category: 'calculus',
    tooltip: 'Composite function: (f \\circ g)(x)',
  },
  {
    label: 'log_b',
    latex: '\\log_b(x)',
    name: 'logarithm log base b log base',
    category: 'calculus',
    popular: true,
    tooltip: 'Logarithm with base: \\log_b(x)',
  },
  {
    label: 'ln',
    latex: '\\ln(x)',
    name: 'natural logarithm log base e ln',
    category: 'calculus',
    popular: true,
    tooltip: 'Natural log: \\ln(x)',
  },
  {
    label: 'eˣ',
    latex: 'e^{x}',
    name: 'exponential e to the x power Euler constant',
    category: 'calculus',
    popular: true,
    tooltip: 'Exponential: e^{x}',
  },
  {
    label: '∞',
    latex: '\\infty',
    name: 'infinity infinite domain range unbound',
    category: 'calculus',
    popular: true,
    tooltip: 'Infinity: \\infty',
  },
  {
    label: 'Δ',
    latex: '\\Delta',
    name: 'delta discriminant change in y b2-4ac capital delta',
    category: 'calculus',
    popular: true,
    tooltip: 'Delta / Discriminant: \\Delta',
  },
  {
    label: 'lim',
    latex: '\\lim_{x \\to a}',
    name: 'limit calculus limits infinity x to a',
    category: 'calculus',
    popular: true,
    tooltip: 'Limit: \\lim_{x \\to a}',
  },
  {
    label: '∑',
    latex: '\\sum_{i=1}^{n}',
    name: 'sum summation sigma series add all',
    category: 'calculus',
    popular: true,
    tooltip: 'Summation: \\sum_{i=1}^{n}',
  },
  {
    label: '∏',
    latex: '\\prod_{i=1}^{n}',
    name: 'product capital pi product sequence',
    category: 'calculus',
    tooltip: 'Product: \\prod_{i=1}^{n}',
  },
  {
    label: '∫',
    latex: '\\int',
    name: 'integral calculus antiderivative area',
    category: 'calculus',
    popular: true,
    tooltip: 'Indefinite integral: \\int',
  },
  {
    label: '∫_a^b',
    latex: '\\int_{a}^{b}',
    name: 'definite integral bounds calculus limits a b',
    category: 'calculus',
    tooltip: 'Definite integral: \\int_{a}^{b}',
  },
  {
    label: 'dy/dx',
    latex: '\\frac{dy}{dx}',
    name: 'derivative differentiation rate of change Leibniz prime',
    category: 'calculus',
    popular: true,
    tooltip: 'Derivative: \\frac{dy}{dx}',
  },

  // ── Statistics & Greek Letters ──
  {
    label: 'μ',
    latex: '\\mu',
    name: 'mu population mean average micro statistics',
    category: 'stats_greek',
    popular: true,
    tooltip: 'Population mean: \\mu',
  },
  {
    label: 'σ',
    latex: '\\sigma',
    name: 'sigma standard deviation spread variance',
    category: 'stats_greek',
    popular: true,
    tooltip: 'Standard deviation: \\sigma',
  },
  {
    label: 'σ²',
    latex: '\\sigma^2',
    name: 'variance sigma squared spread',
    category: 'stats_greek',
    tooltip: 'Variance: \\sigma^2',
  },
  {
    label: 'x̄',
    latex: '\\bar{x}',
    name: 'sample mean x bar average sample statistics',
    category: 'stats_greek',
    popular: true,
    wrapTemplate: (s) => `\\bar{${s}}`,
    tooltip: 'Sample mean: \\bar{x}',
  },
  {
    label: 'p̂',
    latex: '\\hat{p}',
    name: 'p hat sample proportion probability percentage',
    category: 'stats_greek',
    popular: true,
    tooltip: 'Sample proportion: \\hat{p}',
  },
  {
    label: 'λ',
    latex: '\\lambda',
    name: 'lambda eigenvalue wavelength rate parameter',
    category: 'stats_greek',
    tooltip: 'Lambda: \\lambda',
  },
  {
    label: 'γ',
    latex: '\\gamma',
    name: 'gamma angle letter',
    category: 'stats_greek',
    tooltip: 'Gamma: \\gamma',
  },
  {
    label: 'ω',
    latex: '\\omega',
    name: 'omega angular velocity frequency',
    category: 'stats_greek',
    tooltip: 'Omega: \\omega',
  },
  {
    label: 'Ω',
    latex: '\\Omega',
    name: 'capital omega sample space ohm resistance',
    category: 'stats_greek',
    tooltip: 'Capital Omega: \\Omega',
  },
  {
    label: 'Σ',
    latex: '\\Sigma',
    name: 'capital sigma sum covariance matrix',
    category: 'stats_greek',
    tooltip: 'Capital Sigma: \\Sigma',
  },
]

type CategoryTab = 'popular' | 'delimiters' | 'geometry' | 'algebra' | 'relations' | 'calculus' | 'stats_greek' | 'all'

const CATEGORY_TABS: { id: CategoryTab; label: string; icon?: string }[] = [
  { id: 'popular', label: '⭐ Popular & $' },
  { id: 'delimiters', label: '💲 Delimiters ($)' },
  { id: 'geometry', label: '📐 Geometry & Trig' },
  { id: 'algebra', label: '🔢 Algebra & Roots' },
  { id: 'relations', label: '⚖️ Relations & Sets' },
  { id: 'calculus', label: '📈 Calculus & Functions' },
  { id: 'stats_greek', label: '📊 Stats & Greek' },
  { id: 'all', label: 'All Symbols' },
]

interface MathSymbolInserterProps {
  onInsert: (snippet: MathSymbolItem) => void
  activeTargetLabel?: string
  className?: string
}

export const MathSymbolInserter: React.FC<MathSymbolInserterProps> = ({
  onInsert,
  activeTargetLabel = 'Problem Stem',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('popular')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastInsertedLabel, setLastInsertedLabel] = useState<string | null>(null)

  const filteredSymbols = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      return ALL_MATH_SYMBOLS.filter(
        (sym) =>
          sym.label.toLowerCase().includes(q) ||
          sym.latex.toLowerCase().includes(q) ||
          sym.name.toLowerCase().includes(q)
      )
    }

    if (activeTab === 'all') return ALL_MATH_SYMBOLS
    if (activeTab === 'popular') return ALL_MATH_SYMBOLS.filter((sym) => sym.popular)
    return ALL_MATH_SYMBOLS.filter((sym) => sym.category === activeTab)
  }, [activeTab, searchQuery])

  const handleSnippetClick = (item: MathSymbolItem) => {
    onInsert(item)
    setLastInsertedLabel(item.label)
    setTimeout(() => {
      setLastInsertedLabel((prev) => (prev === item.label ? null : prev))
    }, 1200)
  }

  return (
    <div className={`p-3 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-2xs space-y-2.5 ${className}`}>
      {/* Header bar with target indicator and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                Quick Math & LaTeX Symbol Inserter
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                <DollarSign className="w-2.5 h-2.5 mr-0.5" /> $ included
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Inserting into:</span>
              <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                {activeTargetLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search $, angle, perp, deg..."
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-slate-700 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/70">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Symbol Grid */}
      <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto pr-1">
        {filteredSymbols.length === 0 ? (
          <div className="py-4 text-center w-full text-xs text-slate-400">
            No symbols found matching "{searchQuery}". Try searching "dollar", "perp", "angle", "sqrt", etc.
          </div>
        ) : (
          filteredSymbols.map((item) => {
            const isJustInserted = lastInsertedLabel === item.label
            const isDollarItem = item.isDelimiter || item.isCurrency || item.latex.includes('$')

            return (
              <button
                key={item.label + item.latex}
                type="button"
                onMouseDown={(e) => {
                  // Crucial: prevents blur from active textarea so cursor and selection are maintained!
                  e.preventDefault()
                }}
                onClick={() => handleSnippetClick(item)}
                title={`${item.tooltip || item.label} (Click to insert)`}
                className={`relative px-2 py-1 min-w-[2.25rem] rounded-lg border text-xs font-mono font-semibold transition-all duration-150 flex items-center justify-center ${
                  isJustInserted
                    ? 'bg-emerald-500 text-white border-emerald-600 scale-95 shadow-xs'
                    : isDollarItem
                    ? 'bg-gradient-to-b from-indigo-50/80 to-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100 hover:border-blue-400 hover:shadow-xs'
                    : item.popular
                    ? 'bg-white hover:bg-blue-50/90 text-slate-800 hover:text-blue-700 border-slate-200 hover:border-blue-300 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isJustInserted ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <span>{item.label}</span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Helper Footer / Tip */}
      <div className="pt-1 border-t border-slate-200/70 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            <strong>Pro-tip:</strong> Highlight any text and click{' '}
            <code className="bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-semibold">$…$</code>,{' '}
            <code className="bg-slate-200 text-slate-800 px-1 py-0.2 rounded font-semibold">√x</code>, or{' '}
            <code className="bg-slate-200 text-slate-800 px-1 py-0.2 rounded font-semibold">a/b</code> to wrap it
            instantly!
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          Clicking a symbol keeps your cursor in place
        </span>
      </div>
    </div>
  )
}

export default MathSymbolInserter
