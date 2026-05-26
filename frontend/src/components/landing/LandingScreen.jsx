import { useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Zap, Terminal, Code2, Sparkles, ArrowRight, Globe, Star } from 'lucide-react'
import { startSandbox } from '../../api/sandbox'
import { setSandboxStarting, setSandboxReady, setSandboxError } from '../../store/sandboxSlice'
import { selectIsSandboxStarting } from '../../store/selectors'
import { Button } from '../ui/Button'
import toast from 'react-hot-toast'

const features = [
  { icon: Sparkles, label: 'AI-Powered', desc: 'GPT-4 level intelligence' },
  { icon: Code2, label: 'Live Editing', desc: 'Real-time file changes' },
  { icon: Terminal, label: 'Full Terminal', desc: 'Bash shell access' },
  { icon: Zap, label: 'Instant Preview', desc: 'Hot-reload browser' },
]

export function LandingScreen() {
  const dispatch = useDispatch()
  const isSandboxStarting = useSelector(selectIsSandboxStarting)

  const [hovered, setHovered] = useState(false)

  const handleStart = useCallback(async () => {
    dispatch(setSandboxStarting(true))
    try {
      const result = await startSandbox()
      dispatch(setSandboxReady({ sandboxId: result.sandboxId, previewUrl: result.previewUrl }))
      toast.success('Sandbox ready! Welcome to your AI IDE.')
    } catch (err) {
      dispatch(setSandboxError(err.message))
      toast.error(`Failed to start sandbox: ${err.message}`)
    }
  }, [dispatch])

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Ambient gradient orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(263,85%,65%), transparent)' }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(210,90%,60%), transparent)' }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--border-default) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-default) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top nav bar */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="font-semibold text-sm text-[var(--text-primary)]">DevSandbox AI</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-subtle)]"
          >
            <Globe size={13} />
            GitHub
          </a>
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-lg">
            <Star size={11} className="text-[var(--warning)]" fill="currentColor" />
            4.9k stars
          </span>
        </div>
      </header>

      {/* Hero content */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl w-full animate-slide-up">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-[var(--primary-glow)] bg-[var(--primary-subtle)] text-[var(--primary)] text-xs font-medium">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--primary)]" />
          </span>
          Now with GPT-4o · Instant Deployment
        </div>

        {/* Title */}
        <h1
          className="text-5xl sm:text-6xl font-extrabold mb-4 leading-tight tracking-tight"
          style={{
            background: 'linear-gradient(135deg, hsl(220,15%,94%) 0%, hsl(263,85%,75%) 50%, hsl(210,90%,70%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Build Apps with AI
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[var(--text-secondary)] mb-10 max-w-lg leading-relaxed">
          Describe what you want. Watch AI generate, edit, and deploy your full-stack app — live in seconds.
          Your personal AI pair programmer.
        </p>

        {/* CTA Button */}
        <button
          id="start-sandbox-btn"
          onClick={handleStart}
          disabled={isSandboxStarting}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative group mb-10 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <div
            className="absolute inset-0 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"
            style={{ background: 'var(--primary)' }}
          />
          <div
            className="relative flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold text-base transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, hsl(263,85%,60%), hsl(263,85%,72%))',
              boxShadow: hovered ? '0 0 30px var(--primary-glow)' : '0 0 15px var(--primary-glow)',
            }}
          >
            {isSandboxStarting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting your sandbox...
              </>
            ) : (
              <>
                <Zap size={18} fill="white" />
                Start Sandbox
                <ArrowRight
                  size={18}
                  className={`transition-transform duration-200 ${hovered ? 'translate-x-1' : ''}`}
                />
              </>
            )}
          </div>
        </button>

        {/* Feature pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-default"
            >
              <Icon size={16} className="text-[var(--primary)]" />
              <span className="text-xs font-medium text-[var(--text-primary)]">{label}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{desc}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-4 text-[11px] text-[var(--text-disabled)]">
        Powered by DevSandbox AI · Built for developers
      </footer>
    </div>
  )
}
