import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Projects
  projects: [],
  currentProject: null,   // { _id, title, user, createdAt, updatedAt }
  isLoadingProjects: false,
  projectsError: null,

  // Sandbox
  sandboxId: null,
  previewUrl: null,
  isSandboxStarting: false,
  sandboxError: null,

  // Chat
  messages: [],
  isStreaming: false,
  streamingMessage: '',

  // Terminal
  terminalConnected: false,
  terminalError: null,

  // Preview
  isLoadingPreview: true,
  previewKey: 0,

  // Files
  files: [],
  isLoadingFiles: false,

  // File viewer
  selectedFile: null,   // { path: string, content: string, loading: boolean, error: string|null }
  centerTab: 'preview', // 'preview' | 'file'
}

const sandboxSlice = createSlice({
  name: 'sandbox',
  initialState,
  reducers: {
    // ── Projects ─────────────────────────────────────────────────────────
    setProjects(state, action) {
      state.projects = action.payload
      state.projectsError = null
    },
    setProjectsLoading(state, action) {
      state.isLoadingProjects = action.payload
    },
    setProjectsError(state, action) {
      state.projectsError = action.payload
      state.isLoadingProjects = false
    },
    setCurrentProject(state, action) {
      state.currentProject = action.payload
    },
    addProject(state, action) {
      state.projects.unshift(action.payload)
    },

    // ── Sandbox ──────────────────────────────────────────────────────────
    setSandboxStarting(state, action) {
      state.isSandboxStarting = action.payload
    },
    setSandboxReady(state, action) {
      const { sandboxId, previewUrl } = action.payload
      state.sandboxId = sandboxId
      state.previewUrl = previewUrl
      state.sandboxError = null
    },
    setSandboxError(state, action) {
      state.sandboxError = action.payload
      state.isSandboxStarting = false
    },
    resetSandbox(state) {
      state.sandboxId = null
      state.previewUrl = null
      state.isSandboxStarting = false
      state.sandboxError = null
      state.currentProject = null
      state.messages = []
      state.isStreaming = false
      state.streamingMessage = ''
      state.terminalConnected = false
      state.files = []
      state.previewKey = 0
    },

    // ── Chat ─────────────────────────────────────────────────────────────
    addMessage(state, action) {
      state.messages.push({
        ...action.payload,
        id: Date.now() + Math.random(),
      })
    },
    setStreaming(state, action) {
      state.isStreaming = action.payload
    },
    appendStreamingChunk(state, action) {
      state.streamingMessage += action.payload
    },
    resetStreamingMessage(state) {
      state.streamingMessage = ''
    },
    commitStreamingMessage(state) {
      if (!state.streamingMessage.trim()) {
        state.streamingMessage = ''
        state.isStreaming = false
        return
      }
      state.messages.push({
        id: Date.now(),
        role: 'assistant',
        content: state.streamingMessage,
      })
      state.streamingMessage = ''
      state.isStreaming = false
    },
    clearMessages(state) {
      state.messages = []
    },

    // ── Terminal ──────────────────────────────────────────────────────────
    setTerminalConnected(state, action) {
      state.terminalConnected = action.payload
    },
    setTerminalError(state, action) {
      state.terminalError = action.payload
    },

    // ── Preview ───────────────────────────────────────────────────────────
    setPreviewLoading(state, action) {
      state.isLoadingPreview = action.payload
    },
    refreshPreview(state) {
      state.previewKey += 1
      state.isLoadingPreview = true
    },

    // ── Files ─────────────────────────────────────────────────────────────
    setFiles(state, action) {
      state.files = action.payload
    },
    setLoadingFiles(state, action) {
      state.isLoadingFiles = action.payload
    },

    // ── File viewer ───────────────────────────────────────────────────────
    openFile(state, action) {
      // payload: { path, content?, loading?, error? }
      state.selectedFile = { loading: true, error: null, content: '', ...action.payload }
      state.centerTab = 'file'
    },
    setFileContent(state, action) {
      // payload: { path, content }
      if (state.selectedFile && state.selectedFile.path === action.payload.path) {
        state.selectedFile.content = action.payload.content
        state.selectedFile.loading = false
        state.selectedFile.error = null
      }
    },
    setFileError(state, action) {
      // payload: { path, error }
      if (state.selectedFile && state.selectedFile.path === action.payload.path) {
        state.selectedFile.error = action.payload.error
        state.selectedFile.loading = false
      }
    },
    closeFile(state) {
      state.selectedFile = null
      state.centerTab = 'preview'
    },
    setCenterTab(state, action) {
      state.centerTab = action.payload
    },
  },
})

export const {
  setProjects,
  setProjectsLoading,
  setProjectsError,
  setCurrentProject,
  addProject,
  setSandboxStarting,
  setSandboxReady,
  setSandboxError,
  resetSandbox,
  addMessage,
  setStreaming,
  appendStreamingChunk,
  resetStreamingMessage,
  commitStreamingMessage,
  clearMessages,
  setTerminalConnected,
  setTerminalError,
  setPreviewLoading,
  refreshPreview,
  setFiles,
  setLoadingFiles,
  openFile,
  setFileContent,
  setFileError,
  closeFile,
  setCenterTab,
} = sandboxSlice.actions

export default sandboxSlice.reducer
