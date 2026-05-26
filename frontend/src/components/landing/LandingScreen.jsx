import { useState, useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Zap, Terminal, Code2, Sparkles, ArrowRight, Globe, Star, FolderOpen, Plus, Clock, Loader2 } from 'lucide-react'
import { createProject, getProjects, startSandbox, getOrStartSandbox, saveProjectMeta, getLocalProjects, getSandboxForProject } from '../../api/sandbox'
import {
  setSandboxStarting,
  setSandboxReady,
  setSandboxError,
  setProjects,
  setProjectsLoading,
  setProjectsError,
  setCurrentProject,
  addProject,
} from '../../store/sandboxSlice'
import {
  selectIsSandboxStarting,
  selectProjects,
  selectIsLoadingProjects,
} from '../../store/selectors'
import toast from 'react-hot-toast'

const features = [
  { icon: Sparkles, label: 'AI-Powered', desc: 'GPT-4 level intelligence' },
  { icon: Code2, label: 'Live Editing', desc: 'Real-time file changes' },
  { icon: Terminal, label: 'Full Terminal', desc: 'Bash shell access' },
  { icon: Zap, label: 'Instant Preview', desc: 'Hot-reload browser' },
]

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function LandingScreen() {
  const dispatch = useDispatch()
  const isSandboxStarting = useSelector(selectIsSandboxStarting)
  const projects = useSelector(selectProjects)
  const isLoadingProjects = useSelector(selectIsLoadingProjects)

  const [hovered, setHovered] = useState(false)
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [launchingId, setLaunchingId] = useState(null) // projectId being launched

  // Fetch projects on mount — merges API results with locally-cached projects
  // so the list is always populated even if the API is temporarily unavailable.
  useEffect(() => {
    const fetchProjects = async () => {
      dispatch(setProjectsLoading(true))
      let apiProjects = []
      try {
        const data = await getProjects()
        apiProjects = data.projects || []
        // Keep local cache in sync with fresh API data
        apiProjects.forEach(saveProjectMeta)
      } catch (err) {
        dispatch(setProjectsError(err.message))
      }

      // Merge: API projects first, then any locally-known projects not in the API list
      const local = getLocalProjects()
      const merged = [...apiProjects]
      for (const lp of local) {
        if (!merged.find(p => p._id === lp._id)) {
          merged.push(lp)
        }
      }
      dispatch(setProjects(merged))
      dispatch(setProjectsLoading(false))
    }
    fetchProjects()
  }, [dispatch])

  // Create project → start sandbox
  const handleCreate = useCallback(async (e) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      toast.error('Please enter a project title.')
      return
    }
    setIsCreating(true)
    try {
      const { project } = await createProject(trimmed)
      saveProjectMeta(project)          // persist locally for offline fallback
      dispatch(addProject(project))
      dispatch(setCurrentProject(project))
      toast.success(`Project "${project.title}" created!`)

      // Now start the sandbox
      dispatch(setSandboxStarting(true))
      const result = await startSandbox(project._id)
      dispatch(setSandboxReady({ sandboxId: result.sandboxId, previewUrl: result.previewUrl }))
      toast.success('Sandbox ready! Welcome to your AI IDE.')
    } catch (err) {
      dispatch(setSandboxError(err.message))
      toast.error(err.message)
    } finally {
      setIsCreating(false)
    }
  }, [dispatch, title])

  // Launch existing project — reuses cached sandbox if available
  const handleLaunchProject = useCallback(async (project) => {
    setLaunchingId(project._id)
    dispatch(setSandboxStarting(true))
    dispatch(setCurrentProject(project))
    try {
      const result = await getOrStartSandbox(project._id)
      dispatch(setSandboxReady({ sandboxId: result.sandboxId, previewUrl: result.previewUrl }))
      toast.success(
        result.fromCache
          ? `Reopened "${project.title}"`
          : `Sandbox started for "${project.title}"`
      )
    } catch (err) {
      dispatch(setSandboxError(err.message))
      toast.error(err.message)
    } finally {
      setLaunchingId(null)
    }
  }, [dispatch])

  const isBusy = isCreating || isSandboxStarting

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
        <p className="text-base sm:text-lg text-[var(--text-secondary)] mb-8 max-w-lg leading-relaxed">
          Describe what you want. Watch AI generate, edit, and deploy your full-stack app — live in seconds.
          Your personal AI pair programmer.
        </p>

        {/* New project form */}
        <form
          onSubmit={handleCreate}
          className="w-full max-w-lg flex gap-2 mb-6"
        >
          <input
            id="project-title-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Name your project…"
            disabled={isBusy}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
          />
          <button
            id="create-project-btn"
            type="submit"
            disabled={isBusy}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <div
              className="absolute inset-0 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300"
              style={{ background: 'var(--primary)' }}
            />
            <div
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, hsl(263,85%,60%), hsl(263,85%,72%))',
                boxShadow: hovered ? '0 0 24px var(--primary-glow)' : '0 0 10px var(--primary-glow)',
              }}
            >
              {isBusy ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isCreating ? 'Creating…' : 'Starting…'}
                </>
              ) : (
                <>
                  <Plus size={15} />
                  New Project
                  <ArrowRight
                    size={15}
                    className={`transition-transform duration-200 ${hovered ? 'translate-x-0.5' : ''}`}
                  />
                </>
              )}
            </div>
          </button>
        </form>

        {/* Feature pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mb-10">
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

        {/* Existing projects */}
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={13} className="text-[var(--text-muted)]" />
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Recent Projects
            </span>
          </div>

          {isLoadingProjects ? (
            <div className="flex items-center justify-center gap-2 py-6 text-[var(--text-muted)] text-xs">
              <Loader2 size={14} className="animate-spin" />
              Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <p className="text-xs text-[var(--text-disabled)] text-center py-6">
              No projects yet — create your first one above.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map((project) => {
                const hasCached = !!getSandboxForProject(project._id)
                const isLaunching = launchingId === project._id
                return (
                  <div
                    key={project._id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--primary-glow)] hover:bg-[var(--bg-elevated)] transition-all duration-200 group"
                  >
                    <div className="flex flex-col items-start gap-0.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                          {project.title}
                        </span>
                        {hasCached && (
                          <span
                            className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: 'hsl(142,60%,15%)',
                              color: 'hsl(142,70%,50%)',
                              border: '1px solid hsl(142,60%,25%)',
                            }}
                          >
                            <span className="w-1 h-1 rounded-full bg-[hsl(142,70%,50%)] inline-block" />
                            saved
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-[var(--text-disabled)]">
                        <Clock size={9} />
                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                    <button
                      id={`launch-project-${project._id}`}
                      onClick={() => handleLaunchProject(project)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: hasCached ? 'hsl(142,60%,15%)' : 'var(--primary-subtle)',
                        color: hasCached ? 'hsl(142,70%,50%)' : 'var(--primary)',
                        border: `1px solid ${hasCached ? 'hsl(142,60%,25%)' : 'var(--primary-glow)'}`,
                      }}
                    >
                      {isLaunching ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : hasCached ? (
                        <Zap size={11} fill="currentColor" />
                      ) : (
                        <Plus size={11} />
                      )}
                      {isLaunching ? 'Starting…' : hasCached ? 'Resume' : 'Launch'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-4 text-[11px] text-[var(--text-disabled)]">
        Powered by DevSandbox AI · Built for developers
      </footer>
    </div>
  )
}

