import { useState, useCallback, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Zap, Wifi, WifiOff, Monitor, Code2 } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ChatPanel } from './ChatPanel'
import { PreviewPanel } from './PreviewPanel'
import { TerminalPanel } from './TerminalPanel'
import { CodeViewer } from './CodeViewer'
import { resetSandbox, setCenterTab } from '../../store/sandboxSlice'
import { selectSandboxId, selectTerminalConnected, selectCenterTab, selectSelectedFile } from '../../store/selectors'
import { shortId } from '../../lib/utils'

/* ─── Custom Drag-to-Resize Hook ─────────────────────────────────────────── */
function useDrag(onDrag) {
  const dragging = useRef(false)
  const startPos = useRef(0)
  const startSize = useRef(0)

  const onMouseDown = useCallback((e, currentSize, axis = 'x') => {
    e.preventDefault()
    dragging.current = true
    startPos.current = axis === 'x' ? e.clientX : e.clientY
    startSize.current = currentSize

    const move = (e) => {
      if (!dragging.current) return
      const delta = (axis === 'x' ? e.clientX : e.clientY) - startPos.current
      onDrag(startSize.current + delta)
    }
    const up = () => {
      dragging.current = false
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [onDrag])

  return onMouseDown
}

/* ─── Vertical Resize Handle (between Preview & Terminal) ──────────────── */
function VHandle({ onMouseDown }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: '4px',
        width: '100%',
        background: hovered ? 'var(--primary)' : 'var(--border-subtle)',
        cursor: 'row-resize',
        flexShrink: 0,
        transition: 'background 0.15s',
        zIndex: 20,
      }}
    />
  )
}

/* ─── Horizontal Resize Handle (between columns) ────────────────────────── */
function HHandle({ onMouseDown }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '4px',
        height: '100%',
        background: hovered ? 'var(--primary)' : 'var(--border-subtle)',
        cursor: 'col-resize',
        flexShrink: 0,
        transition: 'background 0.15s',
        zIndex: 20,
      }}
    />
  )
}

/* ─── Main Layout ────────────────────────────────────────────────────────── */
export function AppLayout() {
  const dispatch = useDispatch()
  const sandboxId = useSelector(selectSandboxId)
  const terminalConnected = useSelector(selectTerminalConnected)
  const centerTab = useSelector(selectCenterTab)
  const selectedFile = useSelector(selectSelectedFile)

  // Panel sizes (px)
  const [sidebarW, setSidebarW] = useState(220)
  const [chatW, setChatW] = useState(340)
  const [terminalH, setTerminalH] = useState(220)

  // Clamp helpers
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

  const onSidebarDrag = useDrag(useCallback(v => setSidebarW(clamp(v, 150, 400)), []))
  const onChatDrag    = useDrag(useCallback(v => {
    // chat handle is dragged from the left of chat panel
    // delta is negative when shrinking chat
    setChatW(clamp(v, 250, 600))
  }, []))
  const onTerminalDrag = useDrag(useCallback(v => setTerminalH(clamp(v, 80, 450)), []))

  // For chat: we drag from the left edge of chat, so size = window.innerWidth - chatW - drag
  const containerRef = useRef(null)
  const [containerW, setContainerW] = useState(window.innerWidth)
  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      setContainerW(entries[0].contentRect.width)
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // chat handle: dragging moves the boundary from the right
  const chatDragFn = useRef(null)
  const onChatHandleDown = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = chatW
    const move = (e) => {
      const delta = startX - e.clientX  // moving left = bigger chat
      setChatW(clamp(startW + delta, 250, 600))
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [chatW])

  const termDragFn = useRef(null)
  const onTermHandleDown = useCallback((e) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = terminalH
    const move = (e) => {
      const delta = startY - e.clientY  // moving up = bigger terminal
      setTerminalH(clamp(startH + delta, 80, 450))
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [terminalH])

  const sidebarDragDown = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = sidebarW
    const move = (e) => {
      setChatW(w => w)  // keep chat
      setSidebarW(clamp(startW + (e.clientX - startX), 150, 400))
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [sidebarW])

  return (
    <div
      style={{
        height: '100vh', width: '100vw',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-base)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ── Title Bar ────────────────────────────────────────────────── */}
      <TitleBar
        sandboxId={sandboxId}
        connected={terminalConnected}
        onExit={() => dispatch(resetSandbox())}
      />

      {/* ── Main 3-column area ───────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1, display: 'flex', flexDirection: 'row',
          overflow: 'hidden', minHeight: 0,
        }}
      >
        {/* LEFT: File Explorer */}
        <div
          style={{
            width: sidebarW, minWidth: sidebarW, maxWidth: sidebarW,
            height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <Sidebar />
        </div>

        {/* Sidebar ↔ Center handle */}
        <div
          onMouseDown={sidebarDragDown}
          style={{
            width: '4px', height: '100%', flexShrink: 0,
            background: 'var(--border-subtle)', cursor: 'col-resize',
            transition: 'background 0.15s', zIndex: 20,
          }}
          onMouseEnter={e => e.target.style.background = 'var(--primary)'}
          onMouseLeave={e => e.target.style.background = 'var(--border-subtle)'}
        />

        {/* CENTER: Preview/Code (top) + Terminal (bottom) */}
        <div
          style={{
            flex: 1, height: '100%',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', minWidth: 0,
          }}
        >
          {/* ── Tab switcher ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
            height: '36px',
            paddingLeft: '4px',
            gap: '2px',
          }}>
            <TabButton
              active={centerTab === 'preview'}
              icon={<Monitor size={11} />}
              label="Preview"
              onClick={() => dispatch(setCenterTab('preview'))}
            />
            <TabButton
              active={centerTab === 'file'}
              icon={<Code2 size={11} />}
              label={selectedFile ? selectedFile.path?.split('/').pop() : 'Code'}
              onClick={() => selectedFile && dispatch(setCenterTab('file'))}
              disabled={!selectedFile}
            />
          </div>

          {/* Preview fills remaining space */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0,
              visibility: centerTab === 'preview' ? 'visible' : 'hidden',
              pointerEvents: centerTab === 'preview' ? 'auto' : 'none',
            }}>
              <PreviewPanel />
            </div>
            {centerTab === 'file' && (
              <div style={{ position: 'absolute', inset: 0 }}>
                <CodeViewer />
              </div>
            )}
          </div>

          {/* Terminal ↕ drag handle */}
          <div
            onMouseDown={onTermHandleDown}
            style={{
              height: '4px', width: '100%', flexShrink: 0,
              background: 'var(--border-subtle)', cursor: 'row-resize',
              transition: 'background 0.15s', zIndex: 20,
            }}
            onMouseEnter={e => e.target.style.background = 'var(--primary)'}
            onMouseLeave={e => e.target.style.background = 'var(--border-subtle)'}
          />

          {/* Terminal fixed height */}
          <div
            style={{
              height: terminalH, minHeight: terminalH, maxHeight: terminalH,
              overflow: 'hidden', flexShrink: 0,
            }}
          >
            <TerminalPanel />
          </div>
        </div>

        {/* Center ↔ Chat handle */}
        <div
          onMouseDown={onChatHandleDown}
          style={{
            width: '4px', height: '100%', flexShrink: 0,
            background: 'var(--border-subtle)', cursor: 'col-resize',
            transition: 'background 0.15s', zIndex: 20,
          }}
          onMouseEnter={e => e.target.style.background = 'var(--primary)'}
          onMouseLeave={e => e.target.style.background = 'var(--border-subtle)'}
        />

        {/* RIGHT: AI Chat */}
        <div
          style={{
            width: chatW, minWidth: chatW, maxWidth: chatW,
            height: '100%', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}
        >
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}

/* ─── Tab Button ─────────────────────────────────────────────────────────── */
function TabButton({ active, icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '0 10px',
        height: '28px',
        borderRadius: '6px',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '11px',
        fontWeight: active ? 600 : 400,
        fontFamily: 'Inter, sans-serif',
        color: active ? 'var(--primary)' : disabled ? 'var(--text-disabled)' : 'var(--text-muted)',
        background: active ? 'var(--primary-subtle)' : 'transparent',
        transition: 'all 0.15s',
        outline: 'none',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = 'var(--bg-elevated)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {icon}
      {label}
    </button>
  )
}

/* ─── Title Bar ──────────────────────────────────────────────────────────── */
function TitleBar({ sandboxId, connected, onExit }) {
  return (
    <div
      style={{
        height: '36px', minHeight: '36px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px',
        background: 'hsl(220, 14%, 7%)',
        borderBottom: '1px solid var(--border-subtle)',
        userSelect: 'none',
      }}
    >
      {/* Logo + name + sandbox ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '6px',
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={12} color="white" fill="white" />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
          DevSandbox AI
        </span>
        {sandboxId && (
          <span style={{
            fontSize: '10px', color: 'var(--text-muted)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: '4px', padding: '1px 7px',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {shortId(sandboxId)}
          </span>
        )}
      </div>

      {/* Connection status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {connected
          ? <Wifi size={11} color="var(--success)" />
          : <WifiOff size={11} color="var(--text-muted)" />
        }
        <span style={{ fontSize: '10px', color: connected ? 'var(--success)' : 'var(--text-muted)' }}>
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {/* Exit button */}
      <button
        onClick={onExit}
        title="Exit sandbox"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '14px',
          width: '24px', height: '24px', borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-subtle)'; e.currentTarget.style.color = 'var(--error)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        ✕
      </button>
    </div>
  )
}
