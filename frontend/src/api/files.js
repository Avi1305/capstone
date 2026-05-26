

/**
 * List all files in the sandbox
 * @param {string} sandboxId
 * @returns {Promise<string[]>} - Array of file paths
 */


export async function listFiles(sandboxId) {
  const response = await fetch("/agent/list-files", {
    headers: {
      "x-sandbox-id": sandboxId
    }
  })
  if (!response.ok) {
    throw new Error(`Failed to list files (${response.status})`)
  }
  const data = await response.json()
  return data.files || data || []
}

/**
 * Read a single file from the sandbox
 * @param {string} sandboxId
 * @param {string} filePath - e.g. '/src/index.js'
 * @returns {Promise<string>} - File content as a string
 */
export async function readFile(sandboxId, filePath) {
  const response = await fetch(`/agent/read-files?files=${encodeURIComponent(filePath)}`, {
    headers: {
      'x-sandbox-id': sandboxId,
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to read file (${response.status})`)
  }
  const data = await response.json()

  // Backend returns: { results: [{ "/path/to/file": "<content>" }] }
  // We grab the first value since we only request one file at a time.
  if (Array.isArray(data?.results) && data.results.length > 0) {
    const firstEntry = data.results[0]
    if (firstEntry && typeof firstEntry === 'object') {
      const content = Object.values(firstEntry)[0]
      if (content !== undefined) return content
    }
  }

  // Fallbacks
  if (typeof data === 'string') return data
  if (typeof data?.content === 'string') return data.content

  console.error('[readFile] unexpected response shape:', data)
  throw new Error(`Could not read file: ${filePath}`)
}



/**
 * Update files in the sandbox
 * @param {string} sandboxId
 * @param {Array<{file: string, content: string}>} updates
 * @returns {Promise<void>}
 */
export async function updateFiles(sandboxId, updates) {
  const response = await fetch(`/agent/update-files`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-sandbox-id': sandboxId,
    },
    body: JSON.stringify({ updates }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update files (${response.status})`);
  }

  return response.json();
}
