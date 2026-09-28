import { InlineMath } from 'react-katex'
import { parseContentText } from '../lib/contentBlocks'

interface TableBlockEditorProps {
  rows: string[][]
  onChange: (rows: string[][]) => void
}

export default function TableBlockEditor({ rows, onChange }: TableBlockEditorProps) {
  function updateCell(rowIndex: number, colIndex: number, value: string) {
    const next = rows.map((row) => [...row])
    next[rowIndex][colIndex] = value
    onChange(next)
  }

  function addRow() {
    const colCount = rows[0]?.length ?? 2
    onChange([...rows, Array(colCount).fill('')])
  }

  function addColumn() {
    onChange(rows.map((row) => [...row, '']))
  }

  function removeRow(rowIndex: number) {
    onChange(rows.filter((_, i) => i !== rowIndex))
  }

  function removeColumn(colIndex: number) {
    onChange(rows.map((row) => row.filter((_, i) => i !== colIndex)))
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">
        Wrap math in <code className="bg-slate-100 px-1 rounded">$...$</code> inside any cell, e.g.{' '}
        <code className="bg-slate-100 px-1 rounded">{'$x^2$'}</code>.
      </p>

      <table className="border-collapse w-full">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="border border-slate-300 p-1 align-top">
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    className={`w-full px-2 py-1 text-sm outline-none font-mono ${
                      rowIndex === 0 ? 'font-semibold bg-slate-50' : ''
                    }`}
                    placeholder={rowIndex === 0 ? 'Header' : ''}
                  />
                  {cell.includes('$') && (
                    <div className="px-2 py-1 text-sm bg-white border-t border-slate-100">
                      {parseContentText(cell).map((block, i) =>
                        block.type === 'math' ? (
                          <InlineMath key={i} math={block.latex} />
                        ) : block.type === 'text' ? (
                          <span key={i}>{block.value}</span>
                        ) : null
                      )}
                    </div>
                  )}
                </td>
              ))}
              <td>
                <button
                  type="button"
                  onClick={() => removeRow(rowIndex)}
                  className="text-xs text-red-600 hover:underline px-2"
                >
                  ✕ row
                </button>
              </td>
            </tr>
          ))}
          <tr>
            {rows[0]?.map((_, colIndex) => (
              <td key={colIndex} className="text-center">
                <button
                  type="button"
                  onClick={() => removeColumn(colIndex)}
                  className="text-xs text-red-600 hover:underline"
                >
                  ✕ col
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addRow}
          className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300"
        >
          + Row
        </button>
        <button
          type="button"
          onClick={addColumn}
          className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300"
        >
          + Column
        </button>
      </div>
    </div>
  )
}