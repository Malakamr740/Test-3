import React from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  text?: string | null
  className?: string
}

function cleanLatex(math: string): string {
  let cleaned = math.trim()
  // Ensure line breaks in cases, aligned, matrix environments are preserved
  // If \begin{cases} has unescaped line breaks, normalize them
  if (cleaned.includes('\\begin{cases}') || cleaned.includes('\\begin{aligned}') || cleaned.includes('\\begin{matrix}')) {
    // Replace single backslash before newline with double backslash
    cleaned = cleaned.replace(/\\?\n\s*/g, ' \\\\ ')
  }
  return cleaned
}

function renderKatexToString(math: string, displayMode: boolean): string {
  try {
    const cleaned = cleanLatex(math)
    return katex.renderToString(cleaned, {
      displayMode,
      throwOnError: false,
      errorColor: '#2563eb',
      trust: true,
    })
  } catch {
    return `<span class="katex-fallback font-mono text-xs text-blue-700 bg-blue-50 px-1 py-0.5 rounded">${math}</span>`
  }
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  if (!text) return null

  // Check if text has block math: either $$...$$ or \[...\]
  const blockRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\])/g
  const blockParts = text.split(blockRegex)

  return (
    <span className={`math-renderer-container inline ${className}`}>
      {blockParts.map((blockPart, bIdx) => {
        // Block math: $$ ... $$ or \[ ... \]
        const isDoubleDollar = blockPart.startsWith('$$') && blockPart.endsWith('$$') && blockPart.length > 4
        const isBracketBlock = blockPart.startsWith('\\[') && blockPart.endsWith('\\]') && blockPart.length > 4

        if (isDoubleDollar || isBracketBlock) {
          const rawMath = isDoubleDollar ? blockPart.slice(2, -2) : blockPart.slice(2, -2)
          const html = renderKatexToString(rawMath, true)
          return (
            <span
              key={bIdx}
              className="block my-3 text-center overflow-x-auto py-1.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        }

        // Inline math: $ ... $ or \( ... \)
        // Notice: Ignore escaped dollars: \$
        // Regex captures ($...$) where dollar sign is not preceded by backslash
        const inlineRegex = /(\$(?:\\\$|[^\$\n])+?\$|\\\([\s\S]+?\\\))/g
        const inlineParts = blockPart.split(inlineRegex)

        return (
          <span key={bIdx}>
            {inlineParts.map((part, iIdx) => {
              const isInlineDollar = part.startsWith('$') && part.endsWith('$') && part.length > 2 && !part.startsWith('\\$')
              const isParenInline = part.startsWith('\\(') && part.endsWith('\\)') && part.length > 4

              if (isInlineDollar || isParenInline) {
                const rawMath = isInlineDollar ? part.slice(1, -1) : part.slice(2, -2)
                const html = renderKatexToString(rawMath, false)
                return (
                  <span
                    key={iIdx}
                    className="inline-math-item inline align-baseline"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                )
              }

              // Normal text with unescaped \$ handling
              const displayText = part.replace(/\\\$/g, '$')

              // Preserve newlines cleanly
              if (displayText.includes('\n')) {
                const lines = displayText.split('\n')
                return (
                  <span key={iIdx}>
                    {lines.map((line, lIdx) => (
                      <React.Fragment key={lIdx}>
                        {lIdx > 0 && <br />}
                        {line}
                      </React.Fragment>
                    ))}
                  </span>
                )
              }

              return <span key={iIdx}>{displayText}</span>
            })}
          </span>
        )
      })}
    </span>
  )
}

export default MathRenderer
