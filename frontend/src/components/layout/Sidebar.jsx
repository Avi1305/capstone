import { useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  FolderOpen, FileText, RefreshCw, Zap,
  ChevronRight, ChevronDown, Folder,
} from 'lucide-react'
import { setFiles, setLoadingFiles, openFile, setFileContent, setFileError } from '../../store/sandboxSlice'
import { selectSandboxId, selectFiles, selectIsLoadingFiles, selectSelectedFile } from '../../store/selectors'
import { listFiles, readFile } from '../../api/files'
import { shortId } from '../../lib/utils'
import toast from 'react-hot-toast'

/* ── File icon with extension-based colour ─────────────────────────── */
function FileIcon({ name = '' }) {
  const ext = name.split('.').pop()?.toLowerCase()
  const colorMap = {
    js: '#f7df1e', jsx: '#61dafb', ts: '#3178c6', tsx: '#61dafb',
    css: '#e96699', html: '#e44d26', json: '#cbcb41', md: '#9e9e9e',
    py: '#3572a5', sh: '#89e051', env: '#e8e8e8', yml: '#cb171e',
    yaml: '#cb171e', svg: '#ffb13b', png: '#a074c4', jpg: '#a074c4',
  }
  return (
    <FileText
      size={12}
      style={{ color: colorMap[ext] || 'var(--text-muted)', flexShrink: 0 }}
    />
  )
}

/* ── Section header (VSCode-style) ─────────────────────────────────── */
function SectionHeader({ label, expanded, onToggle, action }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 8px',
        cursor: 'pointer',
        userSelect: 'none',
        color: 'var(--text-muted)',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {expanded
          ? <ChevronDown size={10} />
          : <ChevronRight size={10} />
        }
        {label}
      </div>
      {action}
    </div>
  )
}

export function Sidebar() {
  const dispatch = useDispatch()
  const sandboxId = useSelector(selectSandboxId)
  const files = useSelector(selectFiles)
  const isLoadingFiles = useSelector(selectIsLoadingFiles)
  const selectedFile = useSelector(selectSelectedFile)

  const fetchFiles = useCallback(async () => {
    if (!sandboxId) return
    dispatch(setLoadingFiles(true))
    try {
      const result = await listFiles(sandboxId)
      dispatch(setFiles(Array.isArray(result) ? result : []))
    } catch {
      // Silently fail if agent not reachable
    } finally {
      dispatch(setLoadingFiles(false))
    }
  }, [dispatch, sandboxId])

  const handleFileClick = useCallback(async (filePath) => {
    dispatch(openFile({ path: filePath }))
    try {
      const content = await readFile(sandboxId, filePath)
      dispatch(setFileContent({ path: filePath, content }))
    } catch (err) {
      dispatch(setFileError({ path: filePath, error: err.message }))
    }
  }, [dispatch, sandboxId])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'hsl(220, 14%, 8%)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* ── Explorer header ──────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 12px 4px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        <Zap size={10} color="var(--primary)" />
        Explorer
      </div>

      {/* ── Sandbox section ──────────────────────────────────────── */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border-subtle)', padding: '6px 0' }}>
        <div style={{ padding: '0 12px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 6px var(--success)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {shortId(sandboxId)}
          </span>
        </div>
      </div>

      {/* ── Files section ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <SectionHeader
          label="Files"
          expanded={true}
          onToggle={() => {}}
          action={
            <button
              onClick={(e) => { e.stopPropagation(); fetchFiles() }}
              title="Refresh"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'inherit', padding: '0 2px', lineHeight: 1,
              }}
            >
              <RefreshCw size={10} className={isLoadingFiles ? 'animate-spin' : ''} />
            </button>
          }
        />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoadingFiles ? (
            /* Skeleton loader */
            <div style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[80, 65, 90, 70, 55].map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: '12px', borderRadius: '3px',
                    background: 'var(--bg-elevated)',
                    width: `${w}%`,
                    animation: 'pulse 1.5s ease infinite',
                  }}
                />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '24px 12px', textAlign: 'center', gap: '8px',
              }}
            >
              <FolderOpen size={20} color="var(--text-muted)" />
              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No files</p>
              <button
                onClick={fetchFiles}
                style={{
                  fontSize: '10px', color: 'var(--primary)',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>
          ) : (
            <FileTree files={files} onFileClick={handleFileClick} selectedPath={selectedFile?.path} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── File tree with folder grouping ────────────────────────────────── */
function FileTree({ files, onFileClick, selectedPath }) {
  // Group files into a simple flat tree
  return (
    <div>
      {files.map((file) => {
        const path = typeof file === 'string' ? file : (file.path || file.name || '')
        const name = path.split('/').pop()
        const depth = path.split('/').length - 2  // depth relative to root
        return (
          <FileRow
            key={path}
            name={name}
            path={path}
            depth={Math.max(0, depth)}
            onClick={() => onFileClick?.(path)}
            isActive={selectedPath === path}
          />
        )
      })}
    </div>
  )
}

function FileRow({ name, path, depth, onClick, isActive }) {
  return (
    <div
      title={path}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '3px 8px 3px ' + (12 + depth * 12) + 'px',
        cursor: 'pointer',
        transition: 'background 0.1s',
        background: isActive ? 'var(--primary-subtle)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      <FileIcon name={name} />
      <span
        style={{
          fontSize: '12px',
          color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color 0.1s',
          fontWeight: isActive ? 600 : 400,
        }}
        onMouseEnter={e => { if (!isActive) e.target.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { if (!isActive) e.target.style.color = 'var(--text-secondary)' }}
      >
        {name}
      </span>
    </div>
  )
}
