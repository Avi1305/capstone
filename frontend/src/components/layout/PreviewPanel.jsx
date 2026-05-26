import { useState, useCallback, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Monitor, RefreshCw, ExternalLink, AlertCircle, Wifi } from 'lucide-react'
import { setPreviewLoading, refreshPreview } from '../../store/sandboxSlice'
import {
  selectPreviewUrl,
  selectIsLoadingPreview,
  selectPreviewKey,
} from '../../store/selectors'
import { Button } from '../ui/Button'

export function PreviewPanel() {
  const dispatch = useDispatch()
  const previewUrl = useSelector(selectPreviewUrl)
  const isLoadingPreview = useSelector(selectIsLoadingPreview)
  const previewKey = useSelector(selectPreviewKey)

  const [iframeError, setIframeError] = useState(false)
  const loadTimeoutRef = useRef(null)

  // Fallback: if onLoad never fires (common with cross-origin sandboxed iframes),
  // dismiss the spinner after 5 seconds so it doesn't cover the preview forever.
  useEffect(() => {
    if (isLoadingPreview && previewUrl) {
      loadTimeoutRef.current = setTimeout(() => {
        dispatch(setPreviewLoading(false))
      }, 5000)
    }
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
    }
  }, [dispatch, isLoadingPreview, previewUrl, previewKey])

  const handleIframeLoad = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
      loadTimeoutRef.current = null
    }
    dispatch(setPreviewLoading(false))
    setIframeError(false)
  }, [dispatch])

  const handleIframeError = useCallback(() => {
    dispatch(setPreviewLoading(false))
    setIframeError(true)
  }, [dispatch])

  return (
    <div
      style={{
        height: '100%', width: '100%',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-base)',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <Monitor size={13} className="text-[var(--text-muted)]" />
        <span className="text-xs font-semibold text-[var(--text-primary)]">Preview</span>

        {/* URL bar */}
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-mono text-[var(--text-muted)] truncate mx-2"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}
        >
          {isLoadingPreview ? (
            <span className="w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse" />
          ) : iframeError ? (
            <span className="w-2 h-2 rounded-full bg-[var(--error)]" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
          )}
          <span className="truncate">{previewUrl || 'No preview available'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => dispatch(refreshPreview())}
            title="Refresh preview"
          >
            <RefreshCw size={12} className={isLoadingPreview ? 'animate-spin' : ''} />
          </Button>
          {previewUrl && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => window.open(previewUrl, '_blank')}
              title="Open in new tab"
            >
              <ExternalLink size={12} />
            </Button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-hidden">
        {previewUrl ? (
          <>
            {/* Loading overlay */}
            {isLoadingPreview && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                style={{ background: 'var(--bg-base)' }}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-[var(--border-default)] flex items-center justify-center">
                    <Monitor size={20} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-t-[var(--primary)] animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Loading preview...</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono truncate max-w-xs">
                    {previewUrl}
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {iframeError && !isLoadingPreview && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                style={{ background: 'var(--bg-base)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--error-subtle)', border: '1px solid var(--error-subtle)' }}
                >
                  <AlertCircle size={20} className="text-[var(--error)]" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-[var(--text-primary)]">Preview unavailable</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-xs">
                    The preview URL may not be accessible from your browser.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => dispatch(refreshPreview())}>
                    <RefreshCw size={11} />
                    Retry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    <ExternalLink size={11} />
                    Open in Tab
                  </Button>
                </div>
              </div>
            )}

            <iframe key={previewKey} src={previewUrl} title="Sandbox Preview" className="w-full h-full border-0" onLoad={handleIframeLoad} onError={handleIframeError} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock" allow="clipboard-read; clipboard-write" />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <Wifi size={22} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No preview available</p>
            <p className="text-xs text-[var(--text-muted)]">
              Start a sandbox to see a live preview here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
