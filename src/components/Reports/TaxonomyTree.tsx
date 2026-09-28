import React, { useState, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FolderTree,
  FileText,
  Plus,
  Trash2,
  Tag,
  Layers,
} from 'lucide-react'
import type { BreakdownRow, TaxonomyType } from './Types'

export interface TaxonomyTreeNode {
  id: string
  name: string
  score?: number
  correct?: number
  total?: number
  percentage?: number
  children?: TaxonomyTreeNode[]
}

export interface TaxonomyNode {
  id: string
  name: string
  code?: string
  children?: TaxonomyNode[]
  question_count?: number
}

export interface TaxonomyTreeProps {
  // Tree hierarchical mode
  tree?: TaxonomyTreeNode[]
  data?: TaxonomyNode[]
  selectedId?: string
  onSelectNode?: (node: TaxonomyNode) => void
  onAddChild?: (parentNode: TaxonomyNode) => void
  onDeleteNode?: (node: TaxonomyNode) => void

  // Report breakdown mode
  breakdowns?: BreakdownRow[]
  onSelect?: (type: TaxonomyType, label: string) => void
  activeFilter?: { type: TaxonomyType; label: string } | null
}

const TreeNodeItem: React.FC<{ node: TaxonomyTreeNode; depth?: number }> = ({
  node,
  depth = 0,
}) => {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0

  const pct =
    node.percentage ??
    (node.total ? Math.round(((node.correct ?? 0) / node.total) * 100) : 0)

  return (
    <div className="text-xs">
      <div
        className={`flex items-center justify-between rounded-lg p-2 transition hover:bg-slate-50 ${
          depth > 0 ? 'ml-4' : ''
        }`}
      >
        <div
          className="flex items-center gap-2 cursor-pointer select-none flex-1"
          onClick={() => hasChildren && setIsOpen(!isOpen)}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )
          ) : (
            <div className="h-3.5 w-3.5 shrink-0" />
          )}
          <span
            className={`text-slate-800 ${
              depth === 0 ? 'font-bold' : depth === 1 ? 'font-semibold' : 'font-normal'
            }`}
          >
            {node.name}
          </span>
        </div>

        {node.total !== undefined && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-slate-500">
              {node.correct ?? 0} / {node.total}
            </span>
            <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
            <span
              className={`w-9 text-right font-semibold text-[11px] ${
                pct >= 75 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-rose-700'
              }`}
            >
              {pct}%
            </span>
          </div>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="space-y-0.5 border-l border-slate-200 ml-3.5 pl-1 my-0.5">
          {node.children!.map((child) => (
            <TreeNodeItem key={child.id || child.name} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export const TaxonomyTree: React.FC<TaxonomyTreeProps> = ({
  tree,
  data,
  selectedId,
  onSelectNode,
  onAddChild,
  onDeleteNode,
  breakdowns,
  onSelect,
  activeFilter,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // 1. If tree prop is provided (Tree hierarchy with scores)
  if (tree) {
    if (tree.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
          <FolderTree className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          No taxonomy breakdown tree available for this attempt.
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Taxonomy Hierarchy Breakdown
          </h4>
          <span className="text-[10px] text-slate-400">Expandable Category & Skills</span>
        </div>
        <div className="space-y-1">
          {tree.map((rootNode) => (
            <TreeNodeItem key={rootNode.id || rootNode.name} node={rootNode} depth={0} />
          ))}
        </div>
      </div>
    )
  }

  // 2. If breakdowns prop is provided (Report breakdown mode)
  if (breakdowns && breakdowns.length > 0) {
    const categories = breakdowns.filter((b) => b.type === 'category')
    const lessons = breakdowns.filter((b) => b.type === 'lesson')
    const skills = breakdowns.filter((b) => b.type === 'skill')
    const others = breakdowns.filter(
      (b) => b.type !== 'category' && b.type !== 'lesson' && b.type !== 'skill'
    )

    const renderRow = (b: BreakdownRow) => {
      const isFiltered =
        activeFilter && activeFilter.type === b.type && activeFilter.label === b.label

      const pillClass =
        b.classification === 'strong'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : b.classification === 'weak'
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-slate-100 text-slate-700 border-slate-200'

      return (
        <div
          key={`${b.type}-${b.label}-${b.id ?? ''}`}
          onClick={() => onSelect && onSelect(b.type, b.label)}
          className={`group flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
            isFiltered
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-100 font-semibold'
              : 'border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {b.type === 'category' ? (
              <Folder className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            ) : b.type === 'lesson' ? (
              <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            ) : (
              <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            )}
            <span className="truncate text-slate-800">{b.label}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400">
              {b.correct_count}/{b.total_questions} ({Math.round(b.percentage)}%)
            </span>
            {b.classification && (
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${pillClass}`}
              >
                {b.classification}
              </span>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {categories.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-slate-500 text-xs font-semibold">
              <FolderTree className="h-3.5 w-3.5 text-blue-600" />
              <span>Categories / Domains</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{categories.map(renderRow)}</div>
          </div>
        )}

        {lessons.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-slate-500 text-xs font-semibold">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              <span>Chapters & Lessons</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{lessons.map(renderRow)}</div>
          </div>
        )}

        {skills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-slate-500 text-xs font-semibold">
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              <span>Granular Skills</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{skills.map(renderRow)}</div>
          </div>
        )}

        {others.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{others.map(renderRow)}</div>
        )}
      </div>
    )
  }

  // 3. Fallback: Hierarchical Node Tree Mode (Admin Taxonomy Tree)
  const renderNode = (node: TaxonomyNode, depth = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0)
    const isExpanded = expandedNodes[node.id] ?? depth < 1
    const isSelected = selectedId === node.id

    return (
      <div key={node.id} className="select-none text-xs">
        <div
          onClick={() => onSelectNode && onSelectNode(node)}
          style={{ paddingLeft: `${Math.max(8, depth * 18)}px` }}
          className={`group flex items-center justify-between rounded-lg py-1.5 pr-2 transition cursor-pointer ${
            isSelected
              ? 'bg-blue-50 text-blue-800 font-semibold ring-1 ring-blue-500/20'
              : 'text-slate-700 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}

            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              )
            ) : (
              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}

            <span className="truncate">{node.name}</span>
            {node.code && (
              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-500">
                {node.code}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            {node.question_count !== undefined && (
              <span className="text-[10px] text-slate-400 mr-1">
                {node.question_count} qs
              </span>
            )}
            {onAddChild && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddChild(node)
                }}
                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-white transition"
                title="Add sub-node"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
            {onDeleteNode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteNode(node)
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-white transition"
                title="Delete node"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-0.5 space-y-0.5 border-l border-slate-100 ml-3">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (data && data.length > 0) {
    return <div className="space-y-1">{data.map((rootNode) => renderNode(rootNode, 0))}</div>
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
      <FolderTree className="h-8 w-8 text-slate-300 mx-auto mb-2" />
      No taxonomy breakdown tree available for this attempt.
    </div>
  )
}

export default TaxonomyTree
