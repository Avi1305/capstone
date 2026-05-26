

/**
 * Start a new sandbox instance
 * @returns {{ sandboxId: string, previewUrl: string }}
 */
export async function startSandbox() {
  const response = await fetch(`/api/sandbox/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Failed to start sandbox (${response.status})`)
  }

  const data = await response.json()

  if (!data.sandboxId || !data.previewUrl) {
    throw new Error('Invalid response from sandbox start API')
  }

  return {
    sandboxId: data.sandboxId,
    previewUrl: data.previewUrl,
    message: data.message,
  }
}
