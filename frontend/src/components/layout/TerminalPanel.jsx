import { useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Terminal as TerminalIcon, RefreshCw, Maximize2 } from 'lucide-react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useTerminalSocket } from '../../hooks/useTerminalSocket'
import { selectTerminalConnected, selectSandboxId } from '../../store/selectors'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function TerminalPanel() {
  const containerRef = useRef(null)
  const terminalRef = useRef(null)
  const fitAddonRef = useRef(null)
  const terminalConnected = useSelector(selectTerminalConnected)
  const sandboxId = useSelector(selectSandboxId)

  const { reconnect } = useTerminalSocket(terminalRef, !!sandboxId)

  // Initialize xterm.js
  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      lineHeight: 1.4,
      theme: {
        background: 'hsl(220, 14%, 6%)',
        foreground: 'hsl(220, 15%, 88%)',
        cursor: 'hsl(263, 85%, 65%)',
        cursorAccent: 'hsl(220, 14%, 6%)',
        black: '#1e2030',
        red: '#ff5f57',
        green: '#5af78e',
        yellow: '#f3f99d',
        blue: '#57c7ff',
        magenta: '#ff6ac1',
        cyan: '#9aedfe',
        white: '#f1f1f0',
        brightBlack: '#686868',
        brightRed: '#ff5f57',
        brightGreen: '#5af78e',
        brightYellow: '#f3f99d',
        brightBlue: '#57c7ff',
        brightMagenta: '#ff6ac1',
        brightCyan: '#9aedfe',
        brightWhite: '#f1f1f0',
        selectionBackground: 'hsl(263, 85%, 65%, 0.3)',
      },
      scrollback: 5000,
      allowTransparency: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(containerRef.current)

    // Initial welcome message
    term.writeln('\x1b[38;5;135m╔══════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[38;5;135m║  \x1b[1;97mDevSandbox AI Terminal\x1b[0m\x1b[38;5;135m           ║\x1b[0m')
    term.writeln('\x1b[38;5;135m╚══════════════════════════════════╝\x1b[0m')
    term.writeln('')
    term.writeln('\x1b[90mConnecting to sandbox...\x1b[0m')

    terminalRef.current = term
    fitAddonRef.current = fitAddon

    // Initial fit
    try { fitAddon.fit() } catch {}

    return () => {
      term.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(() => {
      try { fitAddonRef.current?.fit() } catch {}
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const handleClear = useCallback(() => {
    terminalRef.current?.clear()
  }, [])

  return (
    <div
      style={{
        height: '100%', width: '100%',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        background: 'hsl(220, 14%, 6%)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 border-b flex-shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Traffic light dots */}
        <div className="flex items-center gap-1.5 mr-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--error)] opacity-80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] opacity-80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)] opacity-80" />
        </div>

        <TerminalIcon size={12} className="text-[var(--text-muted)]" />
        <span className="text-xs font-semibold text-[var(--text-primary)]">Terminal</span>

        <Badge variant={terminalConnected ? 'pulse' : 'default'}>
          {terminalConnected ? 'Connected' : 'Disconnected'}
        </Badge>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={reconnect}
            title="Reconnect terminal"
          >
            <RefreshCw size={11} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            title="Clear terminal"
          >
            <Maximize2 size={11} />
          </Button>
        </div>
      </div>

      {/* xterm container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{ padding: '4px 4px' }}
      />
    </div>
  )
}
