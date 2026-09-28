import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Layers,
  BookOpen,
  Plus,
  Trash2,
  Calculator,
  Clock,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Lightbulb,
  FileCode,
  Sliders,
  Upload,
  X,
  FileText,
  FolderPlus,
} from 'lucide-react'
import {
  CURRICULUM_TAXONOMY,
  questionBankService,
  QuestionChoice,
  QuestionBankItem,
} from '../lib/questionBankService'
import { assessmentService } from '../lib/assessmentService'
import MathRenderer from '../components/MathRenderer'
import MathSymbolInserter, { MathSymbolItem } from '../components/MathSymbolInserter'

export const CreateQuestionPage: React.FC = () => {
  const navigate = useNavigate()
  const { questionId } = useParams()
  const [searchParams] = useSearchParams()
  const queryCollection = searchParams.get('collection')
  const isEditing = Boolean(questionId)

  // Question Categorization State (Domain (Unit) -> Chapter -> Lesson)
  const [taxonomyData, setTaxonomyData] = useState<Record<string, any>>(CURRICULUM_TAXONOMY)
  const [domain, setDomain] = useState<string>('Algebra & Functions')
  const [chapter, setChapter] = useState<string>('Quadratic & Polynomial Equations')
  const [lesson, setLesson] = useState<string>('Quadratic Formula & Discriminant Analysis')
  const [collection, setCollection] = useState<string>(queryCollection || 'General Question Bank')
  const [isCustomChapter, setIsCustomChapter] = useState(false)
  const [isCustomLesson, setIsCustomLesson] = useState(false)

  // Quick Collection Creation Modal
  const [isQuickCollectionModalOpen, setIsQuickCollectionModalOpen] = useState(false)
  const [quickColName, setQuickColName] = useState('')
  const [quickColDesc, setQuickColDesc] = useState('')
  const [quickColTargetExam, setQuickColTargetExam] = useState('EST 1 / SAT Math')
  const [quickColError, setQuickColError] = useState<string | null>(null)

  // Delete Question confirmation modal in edit mode
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Pedagogical & Exam Metadata
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'multi_select' | 'grid_in'>(
    'multiple_choice'
  )
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [calculatorAllowed, setCalculatorAllowed] = useState(false)
  const [estimatedSeconds, setEstimatedSeconds] = useState(90)
  const [targetExam, setTargetExam] = useState('EST 1 / SAT Math')

  // Problem Stem & Media (File upload based)
  const [prompt, setPrompt] = useState(
    'For the quadratic equation $2x^2 - 4x + k = 0$, what value of $k$ will yield exactly one real distinct root?'
  )
  const [imageUrl, setImageUrl] = useState('')
  const [imageFileName, setImageFileName] = useState('')
  const [imageFileSize, setImageFileSize] = useState('')
  const [imageCaption, setImageCaption] = useState('')
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Answer Choices for MCQ
  const [choices, setChoices] = useState<QuestionChoice[]>([
    {
      id: 'c1',
      text: '$k = 2$',
      isCorrect: true,
      rationale: 'Discriminant $(-4)^2 - 4(2)(k) = 16 - 8k = 0 \\implies k = 2$.',
    },
    {
      id: 'c2',
      text: '$k = 4$',
      isCorrect: false,
      rationale: 'If $k = 4$, $16 - 32 = -16$ (produces complex roots).',
    },
    {
      id: 'c3',
      text: '$k = -2$',
      isCorrect: false,
      rationale: 'Sign error when applying $-4ac$.',
    },
    {
      id: 'c4',
      text: '$k = 0$',
      isCorrect: false,
      rationale: 'If $k = 0$, the equation becomes $2x^2 - 4x = 0$ with two real roots: $0$ and $2$.',
    },
  ])

  // Numeric Free Response / Grid-in Answer
  const [numericAnswer, setNumericAnswer] = useState('2')
  const [numericTolerance, setNumericTolerance] = useState('0')

  // Detailed Solution & Diagnostic Feedback
  const [explanation, setExplanation] = useState(
    'For a quadratic equation $ax^2 + bx + c = 0$ to possess exactly one distinct real root, its discriminant must be zero:\n\n$$\\Delta = b^2 - 4ac = 0$$\n\nHere, $a = 2$, $b = -4$, and $c = k$.\n\nSubstitute these values:\n$$(-4)^2 - 4(2)(k) = 0$$\n$$16 - 8k = 0$$\n$$8k = 16 \\implies k = 2$$'
  )
  const [commonMisconception, setCommonMisconception] = useState(
    'Students frequently confuse the condition for two distinct real roots ($b^2 - 4ac > 0$) with one real root ($\\Delta = 0$), or forget parentheses when squaring negative $b$: $(-4)^2 = 16$.'
  )

  // Preview interactive state
  const [previewSelectedChoice, setPreviewSelectedChoice] = useState<string | null>(null)
  const [previewMultiSelected, setPreviewMultiSelected] = useState<string[]>([])
  const [previewInputAnswer, setPreviewInputAnswer] = useState('')
  const [showExplanationInPreview, setShowExplanationInPreview] = useState(true)
  const [previewMode, setPreviewMode] = useState<'split' | 'editor' | 'preview'>('split')
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)
  const explanationTextareaRef = useRef<HTMLTextAreaElement>(null)
  const misconceptionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const choiceInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const activeInputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)
  const [activeTargetName, setActiveTargetName] = useState<string>('prompt')

  // Existing collections list for dropdown
  const [existingCollections, setExistingCollections] = useState<string[]>([])
  const [questionNotFound, setQuestionNotFound] = useState(false)
  const isQuestionLoadedRef = useRef(false)
  const initialDomainRef = useRef<string | null>(null)

  // Load existing question if in edit mode
  useEffect(() => {
    const collectionsList = questionBankService.getCollectionsList().map((c) => c.name)
    setExistingCollections(collectionsList)
    const currentTax = questionBankService.getTaxonomy()
    setTaxonomyData(currentTax)

    if (questionId) {
      let existing = questionBankService.getQuestionById(questionId)

      // Fallback: Check if question is stored in any assessment section
      if (!existing) {
        const assessments = assessmentService.getStoredAssessments()
        for (const ass of assessments) {
          for (const sec of ass.sections || []) {
            for (const qItem of sec.questions || []) {
              if (qItem.questionId === questionId || qItem.id === questionId) {
                if (qItem.questionSnapshot) {
                  existing = qItem.questionSnapshot as QuestionBankItem
                  break
                }
              }
            }
            if (existing) break
          }
          if (existing) break
        }
      }

      if (existing) {
        initialDomainRef.current = existing.domain || 'Algebra & Functions'
        setDomain(existing.domain || 'Algebra & Functions')
        setChapter(existing.chapter || 'Quadratic & Polynomial Equations')
        setLesson(existing.lesson || 'Quadratic Formula & Discriminant Analysis')
        setCollection(existing.collection || 'General Question Bank')
        setQuestionType(existing.questionType || 'multiple_choice')
        setDifficulty(existing.difficulty || 'medium')
        setCalculatorAllowed(Boolean(existing.calculatorAllowed))
        setEstimatedSeconds(existing.estimatedSeconds || 90)
        setTargetExam(existing.targetExam || 'EST 1 / SAT Math')
        setPrompt(existing.prompt || '')
        setImageUrl(existing.imageUrl || '')
        setImageCaption(existing.imageCaption || '')
        if (existing.choices && Array.isArray(existing.choices) && existing.choices.length > 0) {
          const normalizedChoices = existing.choices.map((c: any, idx: number) => ({
            id: c?.id || `c${idx + 1}`,
            text: typeof c === 'string' ? c : (c?.text ?? ''),
            isCorrect: Boolean(c?.isCorrect),
            rationale: c?.rationale || '',
          }))
          setChoices(normalizedChoices)
        }
        setNumericAnswer(existing.numericAnswer || '')
        setNumericTolerance(existing.numericTolerance || '0')
        setExplanation(existing.explanation || '')
        setCommonMisconception(existing.commonMisconception || '')
        isQuestionLoadedRef.current = true
      } else {
        setQuestionNotFound(true)
      }
    } else if (queryCollection) {
      setCollection(queryCollection)
    }
  }, [questionId, queryCollection])

  const handleQuickCreateCollection = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setQuickColError(null)
    if (!quickColName.trim()) {
      setQuickColError('Collection name cannot be empty.')
      return
    }

    const res = questionBankService.createCollection(
      quickColName.trim(),
      quickColDesc.trim(),
      quickColTargetExam
    )

    if (!res.success) {
      setQuickColError(res.error || 'Failed to create collection.')
      return
    }

    const createdName = res.collection!.name
    const updatedList = questionBankService.getCollectionsList().map((c) => c.name)
    setExistingCollections(updatedList)
    setCollection(createdName)
    setIsQuickCollectionModalOpen(false)
    setQuickColName('')
    setQuickColDesc('')
  }

  // Update chapters only when user changes domain interactively
  useEffect(() => {
    if (isCustomChapter) return
    // Prevent overriding chapter during initial question load
    if (isEditing && !isQuestionLoadedRef.current) return
    if (initialDomainRef.current === domain) return

    const domainData = taxonomyData[domain] || CURRICULUM_TAXONOMY[domain]
    if (domainData && domainData.chapters.length > 0) {
      const defaultChapter = domainData.chapters[0].name
      setChapter(defaultChapter)
      if (!isCustomLesson && domainData.chapters[0].lessons.length > 0) {
        setLesson(domainData.chapters[0].lessons[0])
      }
    }
  }, [domain, isCustomChapter, isCustomLesson, taxonomyData, isEditing])

  // Update lessons when chapter changes interactively
  useEffect(() => {
    if (isCustomLesson || isCustomChapter) return
    if (isEditing && !isQuestionLoadedRef.current) return

    const domainData = taxonomyData[domain] || CURRICULUM_TAXONOMY[domain]
    const matched = domainData?.chapters.find((c: any) => c.name === chapter)
    if (matched && matched.lessons.length > 0) {
      // Keep existing lesson if valid in this chapter, otherwise pick first
      if (!matched.lessons.includes(lesson)) {
        setLesson(matched.lessons[0])
      }
    }
  }, [chapter, domain, isCustomLesson, isCustomChapter, taxonomyData, isEditing, lesson])

  // Active target label computation
  const activeTargetLabel = useMemo(() => {
    if (activeTargetName === 'prompt') return 'Problem Stem'
    if (activeTargetName === 'explanation') return 'Step-by-Step Solution'
    if (activeTargetName === 'misconception') return 'Misconceptions'
    if (activeTargetName.startsWith('choice-')) {
      const cId = activeTargetName.replace('choice-', '')
      const idx = choices.findIndex((c) => c.id === cId)
      if (idx !== -1) {
        return `Option ${String.fromCharCode(65 + idx)}`
      }
      return 'Choice Option'
    }
    return 'Problem Stem'
  }, [activeTargetName, choices])

  // Quick Math & LaTeX Snippet Inserter (supports dollar sign, wrapping, and cursor positioning)
  const handleInsertMathSnippet = (item: MathSymbolItem) => {
    // Determine the active target element
    let targetEl: HTMLTextAreaElement | HTMLInputElement | null = activeInputRef.current
    if (!targetEl || !document.body.contains(targetEl)) {
      targetEl = promptTextareaRef.current
      setActiveTargetName('prompt')
    }
    if (!targetEl) return

    const start = targetEl.selectionStart ?? 0
    const end = targetEl.selectionEnd ?? 0
    const currentText = targetEl.value ?? ''
    const hasSelection = end > start
    const selectedText = currentText.substring(start, end)

    // Check if cursor is already inside an inline math delimiter ($ ... $)
    let dollarCountBefore = 0
    for (let i = 0; i < start; i++) {
      if (currentText[i] === '$' && (i === 0 || currentText[i - 1] !== '\\')) {
        dollarCountBefore++
      }
    }
    const isInsideMath = dollarCountBefore % 2 === 1

    let insertionText = ''
    let newCursorPos = start
    let newSelectLength = 0

    if (item.isCurrency) {
      // Literal currency dollar sign: \$ (prevents LaTeX parser breaking)
      insertionText = '\\$'
      newCursorPos = start + insertionText.length
    } else if (item.isDelimiter) {
      if (item.latex === '$') {
        if (hasSelection) {
          // If already surrounded by $, toggle it off, else wrap in $
          if (selectedText.startsWith('$') && selectedText.endsWith('$') && selectedText.length >= 2) {
            insertionText = selectedText.slice(1, -1)
            newCursorPos = start
            newSelectLength = insertionText.length
          } else {
            insertionText = `$${selectedText}$`
            newCursorPos = start
            newSelectLength = insertionText.length
          }
        } else {
          // Insert $ $ and position cursor in the middle
          insertionText = '$ $'
          newCursorPos = start + 1
        }
      } else if (item.latex === '$$') {
        if (hasSelection) {
          insertionText = `$$${selectedText}$$`
          newCursorPos = start
          newSelectLength = insertionText.length
        } else {
          insertionText = '$$\n\n$$'
          newCursorPos = start + 3
        }
      }
    } else if (hasSelection) {
      // Wrapping selected text
      const wrapped = item.wrapTemplate ? item.wrapTemplate(selectedText) : item.latex
      if (!isInsideMath && !item.isDelimiter) {
        insertionText = `$${wrapped}$`
      } else {
        insertionText = wrapped
      }
      newCursorPos = start
      newSelectLength = insertionText.length
    } else {
      // No text selected: insert symbol
      if (item.wrapTemplate) {
        const dummyWrapped = item.wrapTemplate('x')
        if (!isInsideMath) {
          insertionText = `$${dummyWrapped}$`
          newCursorPos = start + (item.cursorOffsetInside ? item.cursorOffsetInside + 1 : 1)
          newSelectLength = item.selectLengthInside ?? 1
        } else {
          insertionText = dummyWrapped
          newCursorPos = start + (item.cursorOffsetInside ?? 0)
          newSelectLength = item.selectLengthInside ?? 1
        }
      } else {
        if (!isInsideMath) {
          insertionText = `$${item.latex}$`
          newCursorPos = start + insertionText.length
        } else {
          insertionText = item.latex
          newCursorPos = start + insertionText.length
        }
      }
    }

    const updatedText = currentText.substring(0, start) + insertionText + currentText.substring(end)

    // Update state based on active target
    if (activeTargetName === 'prompt' || targetEl === promptTextareaRef.current) {
      setPrompt(updatedText)
    } else if (activeTargetName === 'explanation' || targetEl === explanationTextareaRef.current) {
      setExplanation(updatedText)
    } else if (activeTargetName === 'misconception' || targetEl === misconceptionTextareaRef.current) {
      setCommonMisconception(updatedText)
    } else if (activeTargetName.startsWith('choice-')) {
      const choiceId = activeTargetName.replace('choice-', '')
      handleUpdateChoiceText(choiceId, updatedText)
    } else {
      setPrompt(updatedText)
    }

    // Set cursor and focus
    setTimeout(() => {
      if (targetEl) {
        targetEl.focus()
        targetEl.setSelectionRange(newCursorPos, newCursorPos + newSelectLength)
      }
    }, 30)
  }

  // Fallback alias for existing calls
  const insertMathSnippet = (latex: string) => {
    handleInsertMathSnippet({
      label: latex,
      latex,
      name: latex,
      category: 'algebra',
    })
  }

  // Choices Management
  const handleAddChoice = () => {
    const nextId = `c${choices.length + 1}-${Date.now()}`
    setChoices([...choices, { id: nextId, text: '', isCorrect: false, rationale: '' }])
  }

  const handleUpdateChoiceText = (id: string, text: string) => {
    setChoices(choices.map((c) => (c.id === id ? { ...c, text } : c)))
  }

  const handleUpdateChoiceRationale = (id: string, rationale: string) => {
    setChoices(choices.map((c) => (c.id === id ? { ...c, rationale } : c)))
  }

  const handleSetCorrectChoice = (id: string) => {
    if (questionType === 'multiple_choice') {
      setChoices(choices.map((c) => ({ ...c, isCorrect: c.id === id })))
    } else {
      setChoices(choices.map((c) => (c.id === id ? { ...c, isCorrect: !c.isCorrect } : c)))
    }
  }

  const handleRemoveChoice = (id: string) => {
    if (choices.length <= 2) {
      alert('A multiple choice question must have at least 2 options.')
      return
    }
    setChoices(choices.filter((c) => c.id !== id))
  }

  // File-based Image Upload Handling
  const handleFileSelected = (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, SVG).')
      return
    }

    // Format size
    const sizeInKb = (file.size / 1024).toFixed(1)
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKb} KB`

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImageUrl(dataUrl)
      setImageFileName(file.name)
      setImageFileSize(sizeStr)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingFile(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    setImageFileName('')
    setImageFileSize('')
    setImageCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Save to Question Bank Service
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!prompt.trim()) {
      setFormError('Please enter a question prompt stem.')
      return
    }

    if (questionType === 'multiple_choice' || questionType === 'multi_select') {
      const correctCount = choices.filter((c) => c.isCorrect).length
      if (correctCount === 0) {
        setFormError('Please mark at least one correct answer key.')
        return
      }
    } else if (questionType === 'grid_in') {
      if (!numericAnswer.trim()) {
        setFormError('Please specify the accepted numeric answer for this grid-in question.')
        return
      }
    }

    const questionItem: QuestionBankItem = {
      id: questionId || `qb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      collection: collection.trim() || 'General Question Bank',
      domain,
      chapter,
      lesson,
      difficulty,
      questionType,
      calculatorAllowed,
      estimatedSeconds,
      targetExam,
      prompt,
      imageUrl,
      imageCaption,
      choices: questionType === 'grid_in' ? [] : choices,
      numericAnswer: questionType === 'grid_in' ? numericAnswer : undefined,
      numericTolerance: questionType === 'grid_in' ? numericTolerance : undefined,
      explanation,
      commonMisconception,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (isEditing && questionId) {
      questionBankService.updateQuestion(questionId, questionItem)
    } else {
      questionBankService.addQuestion(questionItem)
    }

    navigate('/admin/questions')
  }

  // Helper to render math text or LaTeX safely (supports both $block$ and $inline$)
  const renderMathSafe = (text: string) => {
    if (!text) return null
    return <MathRenderer text={text} />
  }

  if (questionNotFound) {
    return (
      <AdminLayout
        title="Question Not Found"
        subtitle="The requested question could not be located in the question bank."
        showBackButton={true}
        backButtonPath="/admin/questions"
      >
        <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Question Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The question ID <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{questionId}</code> was not found in the question repository. It may have been deleted or moved.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Link
              to="/admin/questions"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
            >
              Return to Question Bank
            </Link>
            <Link
              to="/admin/questions/new"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Create New Question
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const currentChapters = (taxonomyData[domain] || CURRICULUM_TAXONOMY[domain])?.chapters || []
  const currentLessons = currentChapters.find((c: any) => c.name === chapter)?.lessons || []

  return (
    <AdminLayout
      title={isEditing ? 'Edit Question' : 'Question Bank: Create Question'}
      subtitle="Categorize by Domain › Chapter › Lesson, attach diagram files, and verify live student preview"
      actions={
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPreviewMode('editor')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                previewMode === 'editor'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form Only
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('split')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                previewMode === 'split'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('preview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                previewMode === 'preview'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5 inline mr-1" />
              Live Preview
            </button>
          </div>

          <Link
            to="/admin/questions"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Bank</span>
          </Link>
        </div>
      }
    >
      <div
        className={`grid gap-6 ${
          previewMode === 'split'
            ? 'grid-cols-1 lg:grid-cols-12'
            : previewMode === 'editor'
            ? 'grid-cols-1 max-w-4xl mx-auto'
            : 'grid-cols-1 max-w-3xl mx-auto'
        }`}
      >
        {/* Editor Form Column */}
        {previewMode !== 'preview' && (
          <form
            onSubmit={handleSave}
            className={`space-y-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs ${
              previewMode === 'split' ? 'lg:col-span-7' : 'w-full'
            }`}
          >
            {/* Section 1: 3-Tier Categorization: Domain -> Chapter -> Lesson */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  1. Question Categorization (Domain › Chapter › Lesson)
                </h3>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Curriculum Mapping
                </span>
              </div>

              {/* Target Collection assignment */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Question Collection / Test Pool
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickColName('')
                      setQuickColDesc('')
                      setQuickColTargetExam(targetExam || 'EST 1 / SAT Math')
                      setQuickColError(null)
                      setIsQuickCollectionModalOpen(true)
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Collection</span>
                  </button>
                </div>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    list="existing-collections"
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    placeholder="e.g. EST 1 Math Diagnostic 2025, Algebra Sprint..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                  <datalist id="existing-collections">
                    {existingCollections.map((c) => (
                      <option key={c} value={c} />
                    ))}
                    <option value="General Question Bank" />
                  </datalist>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Select an existing collection, type a new name, or use &quot;New Collection&quot; above.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Domain Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Domain (Unit)</label>
                  <select
                    value={domain}
                    onChange={(e) => {
                      setDomain(e.target.value)
                      setIsCustomChapter(false)
                      setIsCustomLesson(false)
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    {Object.keys(taxonomyData).map((d) => {
                      const dInfo = taxonomyData[d]
                      const codeBadge = dInfo?.code ? `[${dInfo.code}] ` : ''
                      return (
                        <option key={d} value={d}>
                          {codeBadge}{dInfo?.unitLabel ? `${dInfo.unitLabel} — ${d}` : d}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Chapter Selector with Custom option */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">Chapter</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomChapter(!isCustomChapter)}
                      className="text-[10px] font-semibold text-blue-600 hover:underline"
                    >
                      {isCustomChapter ? 'Select from list' : '+ Custom chapter'}
                    </button>
                  </div>
                  {isCustomChapter ? (
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="Enter custom chapter name..."
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                    />
                  ) : (
                    <select
                      value={chapter}
                      onChange={(e) => {
                        setChapter(e.target.value)
                        setIsCustomLesson(false)
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                    >
                      {currentChapters.map((c: any) => {
                        const cCodeBadge = c.code ? `[${c.code}] ` : ''
                        return (
                          <option key={c.name} value={c.name}>
                            {cCodeBadge}{c.name}
                          </option>
                        )
                      })}
                    </select>
                  )}
                </div>
              </div>

              {/* Lesson Selector with Custom option */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Lesson</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomLesson(!isCustomLesson)}
                    className="text-[10px] font-semibold text-blue-600 hover:underline"
                  >
                    {isCustomLesson ? 'Select from list' : '+ Custom lesson'}
                  </button>
                </div>
                {isCustomLesson ? (
                  <input
                    type="text"
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    placeholder="Enter custom lesson name..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  />
                ) : (
                  <select
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    {currentLessons.map((l: string) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                    {currentLessons.length === 0 && (
                      <option value={lesson}>{lesson || 'General Lesson'}</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* Section 2: Format & Difficulty Parameters */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  2. Format & Exam Parameters
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Question Format</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="multiple_choice">Single Choice (MCQ)</option>
                    <option value="multi_select">Multi-Select (Choose All)</option>
                    <option value="grid_in">Free Response / Grid-In</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="easy">Easy (Foundational)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="hard">Hard (Advanced / Stretch)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Target Exam</label>
                  <input
                    type="text"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="e.g. EST 1 / SAT Math"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Calculator Usage</label>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalculatorAllowed(false)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition ${
                        !calculatorAllowed
                          ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      No Calculator
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculatorAllowed(true)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition ${
                        calculatorAllowed
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Permitted
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Time Estimate (sec)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="15"
                      max="300"
                      step="5"
                      value={estimatedSeconds}
                      onChange={(e) => setEstimatedSeconds(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden pl-8"
                    />
                    <Clock className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Problem Stem & Math Notation */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-emerald-600" />
                  3. Problem Stem & Mathematical Notation
                </h3>
                <span className="text-[11px] text-slate-400">Enclose equations in $...$</span>
              </div>

              {/* Math Quick Inserter Toolbar */}
              <MathSymbolInserter
                onInsert={handleInsertMathSnippet}
                activeTargetLabel={activeTargetLabel}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700">Problem Stem Text</label>
                <textarea
                  ref={promptTextareaRef}
                  onFocus={() => {
                    activeInputRef.current = promptTextareaRef.current
                    setActiveTargetName('prompt')
                  }}
                  rows={4}
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter the mathematical problem stem. Use $...$ for inline equations or $$...$$ for block math."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>

              {/* File-Based Image Uploading */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    <span>Attach Diagram / Geometric Stimulus (File Upload)</span>
                  </div>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {!imageUrl ? (
                  /* Drag and Drop Zone */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingFile(true)
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                      isDraggingFile
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Click to browse image or drag and drop here
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Supports PNG, JPG, JPEG, WEBP, or SVG files
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Uploaded Image Preview & Caption */
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                        <img
                          src={imageUrl}
                          alt="Uploaded stimulus preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {imageFileName || 'Uploaded Diagram'}
                        </p>
                        {imageFileSize && (
                          <p className="text-[11px] text-slate-400">File size: {imageFileSize}</p>
                        )}
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Replace Image
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Image Caption / Figure Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={imageCaption}
                        onChange={(e) => setImageCaption(e.target.value)}
                        placeholder="e.g. Figure 1: Graph of y = f(x) in the standard coordinate plane"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Answer Choices or Free-Response Key */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  4. Answer Key & Choices
                </h3>
                {questionType !== 'grid_in' && (
                  <button
                    type="button"
                    onClick={handleAddChoice}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              {questionType === 'grid_in' ? (
                /* Free Response / Grid-in Section */
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Exact Numeric Answer Key
                      </label>
                      <input
                        type="text"
                        value={numericAnswer}
                        onChange={(e) => setNumericAnswer(e.target.value)}
                        placeholder="e.g. 2 or 5/2 or 2.5"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Tolerance Window (±)
                      </label>
                      <input
                        type="text"
                        value={numericTolerance}
                        onChange={(e) => setNumericTolerance(e.target.value)}
                        placeholder="0 for exact matching"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Students will enter their numeric value directly into an onscreen keypad. Fractions and decimals are normalized automatically.
                  </p>
                </div>
              ) : (
                /* Multiple Choice & Multi-Select Options */
                <div className="space-y-3">
                  {choices.map((c, idx) => {
                    const letter = String.fromCharCode(65 + idx)
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-2xl border transition ${
                          c.isCorrect
                            ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleSetCorrectChoice(c.id)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                              c.isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title={c.isCorrect ? 'Correct key marked' : 'Click to set as correct answer'}
                          >
                            {c.isCorrect ? <Check className="h-4 w-4" /> : letter}
                          </button>

                          <div className="flex-1 space-y-1.5">
                            <input
                              ref={(el) => {
                                choiceInputRefs.current[c.id] = el
                              }}
                              onFocus={() => {
                                activeInputRef.current = choiceInputRefs.current[c.id]
                                setActiveTargetName(`choice-${c.id}`)
                              }}
                              type="text"
                              required
                              value={c.text}
                              onChange={(e) => handleUpdateChoiceText(c.id, e.target.value)}
                              placeholder={`Option ${letter} (e.g. k = 2 or $x = \\frac{1}{2}$)`}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden font-mono"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                            title="Remove choice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Optional Distractor Rationale */}
                        <div className="mt-2 pl-10">
                          <input
                            type="text"
                            value={c.rationale || ''}
                            onChange={(e) => handleUpdateChoiceRationale(c.id, e.target.value)}
                            placeholder={`Rationale / Distractor explanation for Option ${letter} (optional)`}
                            className="w-full text-[11px] text-slate-500 placeholder:text-slate-300 border-none bg-transparent focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Section 5: Solution Derivation & Misconceptions */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  5. Diagnostic Derivation & Student Explanations
                </h3>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Complete Step-by-Step Solution (LaTeX supported)
                  </label>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (explanationTextareaRef.current) {
                        explanationTextareaRef.current.focus()
                        activeInputRef.current = explanationTextareaRef.current
                        setActiveTargetName('explanation')
                      }
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    Target with Math Inserter
                  </button>
                </div>
                <textarea
                  ref={explanationTextareaRef}
                  onFocus={() => {
                    activeInputRef.current = explanationTextareaRef.current
                    setActiveTargetName('explanation')
                  }}
                  rows={4}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why the correct answer is true, step-by-step..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Common Trap / Student Misconception Analysis (LaTeX supported)
                </label>
                <textarea
                  ref={misconceptionTextareaRef}
                  onFocus={() => {
                    activeInputRef.current = misconceptionTextareaRef.current
                    setActiveTargetName('misconception')
                  }}
                  rows={2}
                  value={commonMisconception}
                  onChange={(e) => setCommonMisconception(e.target.value)}
                  placeholder="Explain why students commonly pick the wrong distractors (LaTeX formulas $...$ supported)..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Form Validation Error Banner */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {questionType === 'grid_in'
                  ? `Grid-in Key: ${numericAnswer || 'None set'}`
                  : `${choices.filter((c) => c.isCorrect).length} correct key(s) designated`}
              </span>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isEditing ? 'Update Question' : 'Save Question to Bank'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Live Interactive Student Preview Panel */}
        {(previewMode === 'split' || previewMode === 'preview') && (
          <div
            className={`space-y-4 ${previewMode === 'split' ? 'lg:col-span-5' : 'w-full'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Live Interactive Student View
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationInPreview(!showExplanationInPreview)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                {showExplanationInPreview ? 'Hide Answer Key' : 'Reveal Answer Key'}
              </button>
            </div>

            {/* Live Rendered Card */}
            <div className="bg-white rounded-3xl border-2 border-blue-200/70 p-6 shadow-md space-y-5">
              {/* Question Metadata Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Question 1
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md">
                    {domain}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      difficulty === 'easy'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : difficulty === 'medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {difficulty}
                  </span>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      calculatorAllowed
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Calculator className="h-3 w-3" />
                    <span>{calculatorAllowed ? 'Calc Allowed' : 'No Calc'}</span>
                  </span>
                </div>
              </div>

              {/* Categorization Breadcrumb (Domain › Chapter › Lesson) */}
              <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-700">{domain}</span>
                <span className="text-slate-300">›</span>
                <span className="font-medium text-slate-600">{chapter}</span>
                <span className="text-slate-300">›</span>
                <span className="font-medium text-blue-600">{lesson}</span>
              </div>

              {/* Collection affiliation badge */}
              {collection && (
                <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Collection: {collection}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {targetExam}
                  </span>
                </div>
              )}

              {/* Stimulus / Image if uploaded - formatted bigger and fitting with question size */}
              {imageUrl && (
                <div className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 sm:p-4 text-center space-y-2 shadow-2xs overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-200/70">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                      Stimulus / Problem Diagram
                    </span>
                    <span className="text-[11px] text-slate-400">Fitting Question Size</span>
                  </div>
                  <div className="w-full bg-white rounded-xl border border-slate-200/80 p-2.5 flex items-center justify-center overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={imageCaption || 'Problem diagram'}
                      className="w-full max-h-[460px] sm:max-h-[500px] mx-auto object-contain rounded-lg transition-transform duration-200 hover:scale-[1.01]"
                    />
                  </div>
                  {imageCaption && (
                    <p className="text-xs text-slate-600 italic font-medium pt-1 flex items-center justify-center gap-1">
                      <span>Figure: {imageCaption}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Problem Stem */}
              <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                {prompt ? (
                  renderMathSafe(prompt)
                ) : (
                  <span className="text-slate-300 italic">Enter question prompt above...</span>
                )}
              </div>

              {/* Interactive Student Answer Section */}
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {questionType === 'grid_in'
                    ? 'Student Numeric Input:'
                    : questionType === 'multi_select'
                    ? 'Student Options (Select all that apply):'
                    : 'Student Options (Click to test):'}
                </span>

                {questionType === 'grid_in' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={previewInputAnswer}
                      onChange={(e) => setPreviewInputAnswer(e.target.value)}
                      placeholder="Enter numeric answer (e.g. 2)..."
                      className="w-full rounded-xl border-2 border-blue-200 p-3 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                    />
                    {showExplanationInPreview && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Accepted Value: {numericAnswer || '2'}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {choices.map((c, i) => {
                      const letter = String.fromCharCode(65 + i)
                      const isSelected =
                        questionType === 'multiple_choice'
                          ? previewSelectedChoice === c.id
                          : previewMultiSelected.includes(c.id)

                      const handleChoiceClick = () => {
                        if (questionType === 'multiple_choice') {
                          setPreviewSelectedChoice(c.id)
                        } else {
                          if (previewMultiSelected.includes(c.id)) {
                            setPreviewMultiSelected(previewMultiSelected.filter((id) => id !== c.id))
                          } else {
                            setPreviewMultiSelected([...previewMultiSelected, c.id])
                          }
                        }
                      }

                      return (
                        <div
                          key={c.id}
                          onClick={handleChoiceClick}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-xs cursor-pointer transition select-none ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 font-semibold ring-2 ring-blue-200'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {letter}
                          </span>

                          <span className="flex-1 text-slate-800">
                            {c.text ? (
                              renderMathSafe(c.text)
                            ) : (
                              <span className="text-slate-300 italic">Option {letter}...</span>
                            )}
                          </span>

                          {showExplanationInPreview && c.isCorrect && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Correct Key
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Live Explanation & Misconception Breakdown */}
              {showExplanationInPreview && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {explanation && (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Solution & Mathematical Derivation:</span>
                      </div>
                      <div className="text-emerald-900/90 text-xs leading-relaxed pl-5 whitespace-pre-line">
                        {renderMathSafe(explanation)}
                      </div>
                    </div>
                  )}

                  {commonMisconception && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        <span>Common Student Trap / Misconception:</span>
                      </div>
                      <div className="text-amber-900/90 text-xs leading-relaxed pl-5 whitespace-pre-line">
                        {renderMathSafe(commonMisconception)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Create Collection Modal */}
      {isQuickCollectionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsQuickCollectionModalOpen(false)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add Question Collection</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCollectionModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {quickColError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{quickColError}</span>
              </div>
            )}

            <form onSubmit={handleQuickCreateCollection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Collection Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickColName}
                  onChange={(e) => setQuickColName(e.target.value)}
                  placeholder="e.g. Geometry Circles Test Pool"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Target Track / Level
                </label>
                <select
                  value={quickColTargetExam}
                  onChange={(e) => setQuickColTargetExam(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden bg-white"
                >
                  <option value="EST 1 / SAT Math">EST 1 / SAT Math</option>
                  <option value="EST 2 / SAT Subject">EST 2 / SAT Subject Math</option>
                  <option value="ACT Math">ACT Math</option>
                  <option value="AP Calculus AB/BC">AP Calculus AB/BC</option>
                  <option value="General Diagnostic">General Diagnostic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={quickColDesc}
                  onChange={(e) => setQuickColDesc(e.target.value)}
                  placeholder="Notes about curriculum coverage..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsQuickCollectionModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs"
                >
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Question Confirmation Modal (Edit Mode) */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Question</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to permanently delete this question?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-800">{domain} › {chapter}</p>
              <p className="text-slate-500 line-clamp-2">{prompt}</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                This will delete the question and any associated solutions from the question bank. This action cannot be undone.
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (questionId) {
                    questionBankService.deleteQuestion(questionId)
                    navigate('/admin/questions')
                  }
                }}
                style={{ backgroundColor: '#e11d48', color: '#ffffff' }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-xs"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Question</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default CreateQuestionPage
