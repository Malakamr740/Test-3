import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface TaxonomySelection {
  exam_id: string
  subject_id: string
  category_id: string
  chapter_id: string
  lesson_id: string
  skill_id: string
}

interface TaxonomyOption {
  id: string
  name: string
}

interface Props {
  value: TaxonomySelection
  onChange: (value: TaxonomySelection) => void
}

const emptySelection: TaxonomySelection = {
  exam_id: '', subject_id: '', category_id: '', chapter_id: '', lesson_id: '', skill_id: '',
}

function SelectField({ label, value, options, disabled, onChange }: {
  label: string
  value: string
  options: TaxonomyOption[]
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">— Select {label} —</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </div>
  )
}

export default function TaxonomySelector({ value, onChange }: Props) {
  const [exams, setExams] = useState<TaxonomyOption[]>([])
  const [subjects, setSubjects] = useState<TaxonomyOption[]>([])
  const [categories, setCategories] = useState<TaxonomyOption[]>([])
  const [chapters, setChapters] = useState<TaxonomyOption[]>([])
  const [lessons, setLessons] = useState<TaxonomyOption[]>([])
  const [skills, setSkills] = useState<TaxonomyOption[]>([])

  useEffect(() => { void load('exams', undefined, setExams) }, [])
  useEffect(() => { void load('subjects', value.exam_id, setSubjects, 'exam_id') }, [value.exam_id])
  useEffect(() => { void load('categories', value.subject_id, setCategories, 'subject_id') }, [value.subject_id])
  useEffect(() => { void load('chapters', value.category_id, setChapters, 'category_id') }, [value.category_id])
  useEffect(() => { void load('lessons', value.chapter_id, setLessons, 'chapter_id') }, [value.chapter_id])
  useEffect(() => { void load('skills', value.lesson_id, setSkills, 'lesson_id') }, [value.lesson_id])

  async function load(table: string, parentId: string | undefined, setter: (items: TaxonomyOption[]) => void, parentColumn?: string) {
    if (parentColumn && !parentId) {
      setter([])
      return
    }
    let query = supabase.from(table).select('id, name').eq('is_active', true).order('name')
    if (parentColumn && parentId) query = query.eq(parentColumn, parentId)
    const { data } = await query
    setter(data ?? [])
  }

  function update(key: keyof TaxonomySelection, selectedId: string) {
    const keys = Object.keys(emptySelection) as (keyof TaxonomySelection)[]
    const selectedIndex = keys.indexOf(key)
    const next = { ...value, [key]: selectedId }
    for (const descendant of keys.slice(selectedIndex + 1)) next[descendant] = ''
    onChange(next)
  }

  return (
    <fieldset className="rounded-lg border border-slate-200 p-4 space-y-4">
      <div>
        <legend className="text-sm font-semibold text-slate-800">Classification</legend>
        <p className="text-xs text-slate-500 mt-1">Choose a path from broad to specific. Each level is saved on this question, never on the assessment.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Assessment Type" value={value.exam_id} options={exams} onChange={(id) => update('exam_id', id)} />
        <SelectField label="Subject" value={value.subject_id} options={subjects} disabled={!value.exam_id} onChange={(id) => update('subject_id', id)} />
        <SelectField label="Category" value={value.category_id} options={categories} disabled={!value.subject_id} onChange={(id) => update('category_id', id)} />
        <SelectField label="Chapter" value={value.chapter_id} options={chapters} disabled={!value.category_id} onChange={(id) => update('chapter_id', id)} />
        <SelectField label="Lesson" value={value.lesson_id} options={lessons} disabled={!value.chapter_id} onChange={(id) => update('lesson_id', id)} />
        <SelectField label="Skill" value={value.skill_id} options={skills} disabled={!value.lesson_id} onChange={(id) => update('skill_id', id)} />
      </div>
    </fieldset>
  )
}
