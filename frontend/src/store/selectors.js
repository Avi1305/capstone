// Sandbox selectors
export const selectSandboxId = (state) => state.sandbox.sandboxId
export const selectPreviewUrl = (state) => state.sandbox.previewUrl
export const selectIsSandboxStarting = (state) => state.sandbox.isSandboxStarting
export const selectSandboxError = (state) => state.sandbox.sandboxError

// Chat selectors
export const selectMessages = (state) => state.sandbox.messages
export const selectIsStreaming = (state) => state.sandbox.isStreaming
export const selectStreamingMessage = (state) => state.sandbox.streamingMessage

// Terminal selectors
export const selectTerminalConnected = (state) => state.sandbox.terminalConnected
export const selectTerminalError = (state) => state.sandbox.terminalError

// Preview selectors
export const selectIsLoadingPreview = (state) => state.sandbox.isLoadingPreview
export const selectPreviewKey = (state) => state.sandbox.previewKey

// Files selectors
export const selectFiles = (state) => state.sandbox.files
export const selectIsLoadingFiles = (state) => state.sandbox.isLoadingFiles

// File viewer selectors
export const selectSelectedFile = (state) => state.sandbox.selectedFile
export const selectCenterTab = (state) => state.sandbox.centerTab
