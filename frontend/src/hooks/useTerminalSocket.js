import { useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { io } from 'socket.io-client'
import { setTerminalConnected, setTerminalError } from '../store/sandboxSlice'
import { selectSandboxId } from '../store/selectors'

/**
 * Custom hook that connects xterm.js terminal to Socket.IO
 * with the sandbox's agent host header.
 *
 * @param {object} terminalRef - React ref to an xterm Terminal instance
 * @param {boolean} enabled - Whether the terminal should connect
 */
export function useTerminalSocket(terminalRef, enabled) {
  const dispatch = useDispatch()
  const sandboxId = useSelector(selectSandboxId)
  const socketRef = useRef(null)

  const connect = useCallback(() => {
    if (!sandboxId || !enabled || !terminalRef.current) return

    // Cleanup any existing connection
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    const socket = io(`${sandboxId}.agent.localhost`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      dispatch(setTerminalConnected(true))
      dispatch(setTerminalError(null))
      terminalRef.current?.write('\r\n\x1b[32m✓ Terminal connected\x1b[0m\r\n')
    })

    socket.on('disconnect', (reason) => {
      dispatch(setTerminalConnected(false))
      if (reason !== 'io client disconnect') {
        terminalRef.current?.write('\r\n\x1b[33m⚠ Terminal disconnected. Reconnecting...\x1b[0m\r\n')
      }
    })

    socket.on('connect_error', (err) => {
      dispatch(setTerminalError(err.message))
      terminalRef.current?.write(`\r\n\x1b[31m✗ Connection error: ${err.message}\x1b[0m\r\n`)
    })

    socket.on('terminal-output', (data) => {
      if (terminalRef.current) {
        terminalRef.current.write(
          typeof data === 'string' ? data : new Uint8Array(data)
        )
      }
    })

    // Attach input handler to terminal
    if (terminalRef.current) {
      terminalRef.current.onData((data) => {
        if (socket.connected) {
          socket.emit('terminal-input', data)
        }
      })
    }
  }, [dispatch, sandboxId, enabled, terminalRef])

  // Expose a manual reconnect
  const reconnect = useCallback(() => {
    connect()
  }, [connect])

  useEffect(() => {
    if (!enabled) return
    connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [connect, enabled])

  return { reconnect }
}
