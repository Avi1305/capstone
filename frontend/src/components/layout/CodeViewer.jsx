import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { X, FileText, AlertCircle, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { closeFile } from '../../store/sandboxSlice'
import { selectSelectedFile } from '../../store/selectors'

/* ── language detection from file extension ─────────────────────────── */
function detectLanguage(path = '') {
  const ext = path.split('.').pop()?.toLowerCase()
  const map = {
    js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
    py: 'python', css: 'css', html: 'html', json: 'json',
    md: 'markdown', sh: 'bash', bash: 'bash', yml: 'yaml',
    yaml: 'yaml', env: 'bash', txt: 'text', rs: 'rust',
    go: 'go', java: 'java', cpp: 'cpp', c: 'c', rb: 'ruby',
    php: 'php', sql: 'sql', xml: 'xml', dockerfile: 'docker',
  }
  return map[ext] || 'text'
}

/* ── Custom dark code theme matching the app palette ───────────────── */
const codeTheme = {
  'code[class*="language-"]': {
    color: 'hsl(220, 15%, 88%)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13px',
    lineHeight: '1.6',
    background: 'transparent',
  },
  'pre[class*="language-"]': {
    background: 'transparent',
    margin: 0,
    padding: 0,
    overflow: 'visible',
  },
  comment: { color: 'hsl(220, 10%, 45%)', fontStyle: 'italic' },
  prolog: { color: 'hsl(220, 10%, 45%)' },
  doctype: { color: 'hsl(220, 10%, 45%)' },
  cdata: { color: 'hsl(220, 10%, 45%)' },
  punctuation: { color: 'hsl(220, 15%, 65%)' },
  property: { color: 'hsl(210, 90%, 70%)' },
  tag: { color: 'hsl(0, 75%, 68%)' },
  boolean: { color: 'hsl(263, 80%, 72%)' },
  number: { color: 'hsl(263, 80%, 72%)' },
  constant: { color: 'hsl(263, 80%, 72%)' },
  symbol: { color: 'hsl(38, 95%, 65%)' },
  selector: { color: 'hsl(142, 65%, 55%)' },
  'attr-name': { color: 'hsl(210, 90%, 70%)' },
  string: { color: 'hsl(142, 65%, 55%)' },
  char: { color: 'hsl(142, 65%, 55%)' },
  builtin: { color: 'hsl(38, 95%, 65%)' },
  operator: { color: 'hsl(220, 15%, 75%)' },
  entity: { color: 'hsl(38, 95%, 65%)', cursor: 'help' },
  url: { color: 'hsl(142, 65%, 55%)' },
  keyword: { color: 'hsl(263, 85%, 72%)' },
  regex: { color: 'hsl(38, 95%, 65%)' },
  important: { color: 'hsl(38, 95%, 65%)', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  'class-name': { color: 'hsl(38, 95%, 65%)' },
  function: { color: 'hsl(210, 90%, 70%)' },
  variable: { color: 'hsl(0, 75%, 72%)' },
  'attr-value': { color: 'hsl(142, 65%, 55%)' },
  'atrule': { color: 'hsl(263, 85%, 72%)' },
  'rule': { color: 'hsl(263, 85%, 72%)' },
  'unit': { color: 'hsl(38, 95%, 65%)' },
  'template-string': { color: 'hsl(142, 65%, 55%)' },
  'template-punctuation': { color: 'hsl(220, 15%, 65%)' },
  'interpolation-punctuation': { color: 'hsl(263, 85%, 72%)' },
}

export function CodeViewer() {
  const dispatch = useDispatch()
  const selectedFile = useSelector(selectSelectedFile)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!selectedFile?.content) return
    navigator.clipboard.writeText(selectedFile.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [selectedFile])

  if (!selectedFile) return null

  const fileName = selectedFile.path?.split('/').pop() || selectedFile.path
  const language = detectLanguage(selectedFile.path)
  const lineCount = selectedFile.content?.split('\n').length || 0

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'hsl(220, 14%, 7%)',
    }}>
      {/* ── File tab bar ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
        overflowX: 'auto',
        minHeight: '36px',
      }}>
        {/* Active file tab */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 12px',
          height: '36px',
          borderRight: '1px solid var(--border-subtle)',
          borderBottom: '2px solid var(--primary)',
          background: 'hsl(220, 14%, 7%)',
          flexShrink: 0,
        }}>
          <FileText size={12} style={{ color: getFileColor(selectedFile.path) }} />
          <span style={{
            fontSize: '12px',
            color: 'var(--text-primary)',
            fontFamily: 'JetBrains Mono, monospace',
            whiteSpace: 'nowrap',
          }}>
            {fileName}
          </span>
          <button
            onClick={() => dispatch(closeFile())}
            title="Close file"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '1px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'var(--error-subtle)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
          >
            <X size={11} />
          </button>
        </div>

        {/* Spacer + actions on the right */}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', flexShrink: 0 }}>
          {!selectedFile.loading && !selectedFile.error && (
            <button
              onClick={handleCopy}
              title="Copy file content"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: copied ? 'var(--success)' : 'var(--text-muted)',
                fontSize: '10px',
                padding: '3px 7px',
                borderRadius: '4px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          {!selectedFile.loading && !selectedFile.error && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '0 6px' }}>
              {lineCount} lines · {language}
            </span>
          )}
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {selectedFile.loading ? (
          <LoadingSkeleton />
        ) : selectedFile.error ? (
          <ErrorState error={selectedFile.error} path={selectedFile.path} />
        ) : (
          <CodeContent
            content={selectedFile.content}
            language={language}
          />
        )}
      </div>
    </div>
  )
}

/* ── Code content with syntax highlighting + line numbers ─────────── */
function CodeContent({ content, language }) {
  return (
    <div style={{ display: 'flex', minHeight: '100%', fontSize: '13px' }}>
      {/* Line numbers */}
      <div style={{
        padding: '16px 0',
        background: 'hsl(220, 14%, 6%)',
        borderRight: '1px solid var(--border-subtle)',
        userSelect: 'none',
        flexShrink: 0,
        minWidth: '48px',
      }}>
        {content.split('\n').map((_, i) => (
          <div
            key={i}
            style={{
              padding: '0 12px 0 8px',
              lineHeight: '1.6',
              fontSize: '12px',
              color: 'hsl(220, 10%, 35%)',
              fontFamily: 'JetBrains Mono, monospace',
              textAlign: 'right',
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Code */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 0' }}>
        <SyntaxHighlighter
          language={language}
          style={codeTheme}
          customStyle={{
            background: 'transparent',
            padding: '0 16px',
            margin: 0,
            fontSize: '13px',
            lineHeight: '1.6',
          }}
          wrapLines={false}
          PreTag="div"
        >
          {content || ''}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

/* ── Loading skeleton ───────────────────────────────────────────────── */
function LoadingSkeleton() {
  const widths = [65, 82, 45, 90, 55, 75, 38, 88, 60, 70, 50, 80, 43, 68]
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {widths.map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '24px',
            height: '13px',
            borderRadius: '3px',
            background: 'hsl(220, 10%, 15%)',
            flexShrink: 0,
          }} />
          <div style={{
            height: '13px',
            borderRadius: '3px',
            background: 'hsl(220, 10%, 15%)',
            width: `${w}%`,
            animation: `pulse 1.5s ease ${(i * 0.06).toFixed(2)}s infinite`,
          }} />
        </div>
      ))}
    </div>
  )
}

/* ── Error state ─────────────────────────────────────────────────────── */
function ErrorState({ error, path }) {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '32px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'var(--error-subtle)',
        border: '1px solid hsl(0, 70%, 25%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <AlertCircle size={22} style={{ color: 'var(--error)' }} />
      </div>
      <div>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 4px' }}>
          Could not load file
        </p>
        <p style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
          margin: '0 0 8px',
        }}>
          {path}
        </p>
        <p style={{ fontSize: '11px', color: 'hsl(0, 70%, 65%)', margin: 0 }}>
          {error}
        </p>
      </div>
    </div>
  )
}

/* ── File icon color by extension ───────────────────────────────────── */
function getFileColor(path = '') {
  const ext = path.split('.').pop()?.toLowerCase()
  const map = {
    js: '#f7df1e', jsx: '#61dafb', ts: '#3178c6', tsx: '#61dafb',
    css: '#e96699', html: '#e44d26', json: '#cbcb41', md: '#9e9e9e',
    py: '#3572a5', sh: '#89e051', env: '#e8e8e8', yml: '#cb171e',
  }
  return map[ext] || 'var(--text-muted)'
}
