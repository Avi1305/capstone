
/**
 * Create a new project
 * @param {string} title - Project title
 * @returns {{ message: string, project: object }}
 */
export async function createProject(title) {
  const response = await fetch('/api/sandbox/project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to create project (${response.status})`)
  }

  const data = await response.json()
  return data
}

/**
 * Fetch all projects for the current user
 * @returns {{ message: string, projects: object[] }}
 */
export async function getProjects() {
  const response = await fetch('/api/sandbox/project', {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to fetch projects (${response.status})`)
  }

  const data = await response.json()
  return data
}

/**
 * Start a new sandbox instance for a project (always calls the API)
 * @param {string} projectId - The project ID to start the sandbox for
 * @returns {{ sandboxId: string, previewUrl: string, message: string }}
 */
export async function startSandbox(projectId) {
  const response = await fetch('/api/sandbox/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ projectId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to start sandbox (${response.status})`)
  }

  const data = await response.json()

  if (!data.sandboxId || !data.previewUrl) {
    throw new Error('Invalid response from sandbox start API')
  }

  const result = {
    sandboxId: data.sandboxId,
    previewUrl: data.previewUrl,
    message: data.message,
  }

  // Persist so revisiting the same project reuses this sandbox
  saveSandboxForProject(projectId, result)

  return result
}

// ── Sandbox cache (localStorage) ──────────────────────────────────────────────
const SANDBOX_CACHE_KEY = 'devsandbox:project_sandboxes'

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(SANDBOX_CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(SANDBOX_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

/**
 * Persist sandbox info for a project so it can be reused on revisit.
 */
export function saveSandboxForProject(projectId, { sandboxId, previewUrl }) {
  const cache = readCache()
  cache[projectId] = { sandboxId, previewUrl }
  writeCache(cache)
}

/**
 * Retrieve the cached sandbox info for a project, or null if none exists.
 * @returns {{ sandboxId: string, previewUrl: string } | null}
 */
export function getSandboxForProject(projectId) {
  const cache = readCache()
  return cache[projectId] ?? null
}

/**
 * Clear the cached sandbox for a specific project (e.g. after the sandbox
 * is known to be destroyed).
 */
export function clearSandboxForProject(projectId) {
  const cache = readCache()
  delete cache[projectId]
  writeCache(cache)
}

/**
 * Get the cached sandbox for a project, or start a fresh one if none is cached.
 * This is the main entry-point for launching an existing project — it will NOT
 * create a new sandbox if one has already been started for that project.
 *
 * @param {string} projectId
 * @returns {{ sandboxId: string, previewUrl: string, fromCache: boolean }}
 */
export async function getOrStartSandbox(projectId) {
  const cached = getSandboxForProject(projectId)
  if (cached) {
    return { ...cached, fromCache: true }
  }

  const result = await startSandbox(projectId)   // also calls saveSandboxForProject internally
  return { ...result, fromCache: false }
}

// ── Project metadata cache (localStorage) ─────────────────────────────────────
const PROJECT_META_KEY = 'devsandbox:projects_meta'

/**
 * Persist a project object locally so it can be shown in the UI even when
 * the API is unavailable or returns an empty list.
 * @param {object} project - The full project object from the API
 */
export function saveProjectMeta(project) {
  try {
    const stored = JSON.parse(localStorage.getItem(PROJECT_META_KEY) || '[]')
    const idx = stored.findIndex(p => p._id === project._id)
    if (idx >= 0) {
      stored[idx] = project
    } else {
      stored.unshift(project)   // newest first
    }
    localStorage.setItem(PROJECT_META_KEY, JSON.stringify(stored))
  } catch {
    // ignore
  }
}

/**
 * Return all locally-cached project objects (fallback for when the API fails).
 * @returns {object[]}
 */
export function getLocalProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_META_KEY) || '[]')
  } catch {
    return []
  }
}
