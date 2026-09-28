import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { parseContentText } from '../lib/contentBlocks'

interface ImportQuestionsModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

interface RawImportItem {
  question: string
  prompt?: string
  type: 'MCQ' | 'TRUE_FALSE' | 'GRID_IN'
  difficulty?: 'easy' | 'medium' | 'hard'
  points?: number
  exam?: string
  subject?: string
  category?: string
  chapter?: string
  lesson?: string
  skill?: string
  explanation?: string
  imageUrl?: string
  image_url?: string
  imageCaption?: string
  image_caption?: string
  choices?: Array<{ text: string; is_correct?: boolean; isCorrect?: boolean; rationale?: string }>
  correct_answer?: number | boolean | string
  tolerance?: number
}

interface QuestionSetOption {
  id: string
  title: string
}

export default function ImportQuestionsModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportQuestionsModalProps) {
  const [jsonText, setJsonText] = useState('')
  const [parsedItems, setParsedItems] = useState<RawImportItem[]>([])
  const [parseError, setParseError] = useState<string | null>(null)

  const [existingSets, setExistingSets] = useState<QuestionSetOption[]>([])
  const [selectedSetMode, setSelectedSetMode] = useState<'new' | 'existing'>('new')
  const [selectedSetId, setSelectedSetId] = useState('')
  const [newSetTitle, setNewSetTitle] = useState('')

  const [defaultExam, setDefaultExam] = useState('EST I')
  const [defaultSubject, setDefaultSubject] = useState('Math')

  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState('')

  useEffect(() => {
    async function loadSets() {
      const { data } = await supabase.from('question_sets').select('id, title').order('title')
      if (data && data.length > 0) {
        setExistingSets(data)
        setSelectedSetId(data[0].id)
      }
    }
    loadSets()
  }, [])

  if (!isOpen) return null

  function validateAndExtract(text: string) {
    setParseError(null)
    if (!text.trim()) {
      setParsedItems([])
      return
    }

    try {
      let data = JSON.parse(text)

      // If a full assessment blueprint with modules was pasted, unwrap the questions automatically
      if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
        if (data.assessment?.name && !newSetTitle) {
          setNewSetTitle(data.assessment.name)
        }
        if (data.assessment?.exam) {
          setDefaultExam(data.assessment.exam)
        }

        if (Array.isArray(data.modules)) {
          // Flatten questions across all modules
          data = data.modules.flatMap((m: any) => Array.isArray(m.questions) ? m.questions : [])
        } else if (Array.isArray(data.questions)) {
          data = data.questions
        }
      }

      if (!Array.isArray(data) || data.length === 0) {
        setParseError('Could not find a list of questions. Ensure the JSON is an array [ { ... } ] or contains a "questions" array.')
        setParsedItems([])
        return
      }

      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        // Fallback to prompt if question is missing
        if (!item.question && item.prompt) {
          item.question = item.prompt
        }
        if (!item.question || typeof item.question !== 'string') {
          setParseError(`Question #${i + 1} is missing a "question" text string.`)
          setParsedItems([])
          return
        }
        if (!['MCQ', 'TRUE_FALSE', 'GRID_IN'].includes(item.type)) {
          setParseError(`Question #${i + 1} has invalid type "${item.type}". Must be MCQ, TRUE_FALSE, or GRID_IN.`)
          setParsedItems([])
          return
        }
        if (item.type === 'MCQ') {
          if (!Array.isArray(item.choices) || item.choices.length < 2) {
            setParseError(`Question #${i + 1} (MCQ) must have at least 2 choices.`)
            setParsedItems([])
            return
          }
          // Normalize is_correct / isCorrect
          item.choices.forEach((c: any) => {
            if (c.is_correct === undefined && c.isCorrect !== undefined) {
              c.is_correct = c.isCorrect
            }
          })
          if (!item.choices.some((c: any) => c.is_correct === true)) {
            setParseError(`Question #${i + 1} (MCQ) must have at least one choice with "is_correct": true.`)
            setParsedItems([])
            return
          }
        }
      }

      setParsedItems(data)
    } catch (err: any) {
      setParseError(`Invalid JSON syntax: ${err.message}`)
      setParsedItems([])
    }
  }

  async function loadSampleAssessment() {
    try {
      setImportProgress('Loading EST I Math Sample Test #1 preset...')
      const res = await fetch('/est1_math_sample_test_1.json')
      if (!res.ok) throw new Error(`HTTP ${res.status} loading sample test`)
      const json = await res.text()
      setJsonText(json)
      setNewSetTitle('EST I Math Sample Test #1')
      setDefaultExam('EST I')
      setDefaultSubject('Math')
      validateAndExtract(json)
      setImportProgress('')
    } catch (err: any) {
      setParseError(`Failed to load preset: ${err.message}`)
      setImportProgress('')
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setJsonText(content)
      validateAndExtract(content)
      if (!newSetTitle) {
        setNewSetTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (parsedItems.length === 0) return
    setImporting(true)
    setImportProgress('Authenticating...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in.')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Could not identify organization.')

      // 1. Resolve or Create Question Set ID
      let targetSetId: string | null = null
      if (selectedSetMode === 'existing' && selectedSetId) {
        targetSetId = selectedSetId
      } else if (selectedSetMode === 'new' && newSetTitle.trim()) {
        const { data: newSet, error: setError } = await supabase
          .from('question_sets')
          .insert({
            organization_id: profile.organization_id,
            title: newSetTitle.trim(),
          })
          .select('id')
          .single()

        if (setError) throw setError
        targetSetId = newSet.id
      }

      // 2. Fetch Answer Type IDs
      const { data: answerTypes } = await supabase.from('answer_types').select('id, code')
      const typeMap = new Map<string, string>()
      answerTypes?.forEach((at) => typeMap.set(at.code, at.id))

      // 3. Process each question
      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i]
        setImportProgress(`Importing item ${i + 1} of ${parsedItems.length}...`)

        const typeId = typeMap.get(item.type)
        if (!typeId) throw new Error(`Unknown answer type: ${item.type}`)

        let taxIds = {
          exam_id: null as string | null,
          subject_id: null as string | null,
          category_id: null as string | null,
          chapter_id: null as string | null,
          lesson_id: null as string | null,
          skill_id: null as string | null,
        }

        const examName = item.exam || defaultExam || null
        const subjectName = item.subject || defaultSubject || null

        if (examName) {
          const { data: taxData, error: taxError } = await supabase.rpc(
            'resolve_or_create_taxonomy',
            {
              p_org_id: profile.organization_id,
              p_exam: examName,
              p_subject: subjectName,
              p_category: item.category || null,
              p_chapter: item.chapter || null,
              p_lesson: item.lesson || null,
              p_skill: item.skill || null,
            }
          )
          if (!taxError && taxData && taxData.length > 0) taxIds = taxData[0]
        }

        const contentBlocks = parseContentText(item.question)
        if (item.imageUrl || item.image_url) {
          contentBlocks.unshift({
            type: 'image',
            url: item.imageUrl || item.image_url || '',
            caption: item.imageCaption || item.image_caption || '',
            alt: item.imageCaption || 'Question figure',
          })
        }
        const explanationBlocks = item.explanation ? parseContentText(item.explanation) : []

        // Insert Question
        const { data: insertedQuestion, error: qError } = await supabase
          .from('questions')
          .insert({
            organization_id: profile.organization_id,
            question_set_id: targetSetId,
            source_item_number: i + 1,
            answer_type_id: typeId,
            content_blocks: contentBlocks,
            explanation_blocks: explanationBlocks,
            difficulty: item.difficulty || 'medium',
            points: item.points || 1,
            exam_id: taxIds.exam_id,
            subject_id: taxIds.subject_id,
            category_id: taxIds.category_id,
            chapter_id: taxIds.chapter_id,
            lesson_id: taxIds.lesson_id,
            skill_id: taxIds.skill_id,
            status: 'published',
          })
          .select('id')
          .single()

        if (qError || !insertedQuestion) {
          throw new Error(`Failed to import item #${i + 1}: ${qError?.message}`)
        }

        // Insert Choices or Answers
        if (item.type === 'MCQ' && item.choices) {
          const choiceRows = item.choices.map((c, cIdx) => ({
            question_id: insertedQuestion.id,
            content_blocks: parseContentText(c.text),
            is_correct: !!c.is_correct,
            display_order: cIdx,
          }))
          const { error: cError } = await supabase.from('question_choices').insert(choiceRows)
          if (cError) throw cError
        } else if (item.type === 'TRUE_FALSE') {
          await supabase.from('question_correct_answers').insert({
            question_id: insertedQuestion.id,
            answer_data: { value: Boolean(item.correct_answer) },
          })
        } else if (item.type === 'GRID_IN') {
          await supabase.from('question_correct_answers').insert({
            question_id: insertedQuestion.id,
            answer_data: {
              value: Number(item.correct_answer),
              tolerance: item.tolerance ? Number(item.tolerance) : 0,
            },
          })
        }
      }

      setImporting(false)
      onImportComplete()
      onClose()
    } catch (err: any) {
      setImporting(false)
      setParseError(err.message || 'Import failed.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Bulk Import Test JSON</h2>
            <p className="text-xs text-slate-500">
              Import full question sets directly into your database.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Collection Selection */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                📁 Assign to Test Collection
              </span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSetMode('new')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    selectedSetMode === 'new' ? 'bg-purple-700 text-white' : 'bg-white text-purple-700'
                  }`}
                >
                  + New Test Set
                </button>
                {existingSets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSetMode('existing')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      selectedSetMode === 'existing' ? 'bg-purple-700 text-white' : 'bg-white text-purple-700'
                    }`}
                  >
                    Existing Test Set
                  </button>
                )}
              </div>
            </div>

            {selectedSetMode === 'new' ? (
              <input
                type="text"
                placeholder="e.g. EST I - Sample Test #1 or Digital SAT Test #1"
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-purple-300 rounded-lg px-3 py-2"
              />
            ) : (
              <select
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-purple-300 rounded-lg px-3 py-2"
              >
                {existingSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* JSON Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Questions JSON</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadSampleAssessment}
                  className="text-xs text-purple-600 hover:text-purple-800 font-semibold cursor-pointer underline flex items-center gap-1"
                >
                  ⚡ Load EST I Math Test #1 (50 Qs + Figures)
                </button>
                <label className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                  📁 Upload .json file
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value)
                validateAndExtract(e.target.value)
              }}
              className="w-full text-xs font-mono border border-slate-300 rounded-lg p-3 leading-relaxed focus:border-blue-500 focus:outline-none"
              placeholder="Paste JSON array here..."
            />
          </div>

          {parseError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              ❌ {parseError}
            </p>
          )}

          {parsedItems.length > 0 && !parseError && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
              <span>✓ Valid JSON Structure</span>
              <span>{parsedItems.length} questions parsed</span>
            </div>
          )}

          {/* Exam & Subject Defaults */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Exam Type</label>
              <input
                type="text"
                value={defaultExam}
                onChange={(e) => setDefaultExam(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Subject</label>
              <input
                type="text"
                value={defaultSubject}
                onChange={(e) => setDefaultSubject(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">{importProgress}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || parsedItems.length === 0 || !!parseError}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Import ${parsedItems.length} Questions`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

}



