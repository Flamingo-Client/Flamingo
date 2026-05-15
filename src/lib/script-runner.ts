export interface ScriptLog {
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: number
}

export interface ScriptResult {
  logs: ScriptLog[]
  error: string | null
}

export function runPreRequestScript(
  script: string,
  context: { request: Record<string, any> }
): ScriptResult {
  const logs: ScriptLog[] = []
  const capturedConsole: Record<string, (...args: any[]) => void> = {
    log: (...args) => logs.push({ type: 'log', message: args.map(String).join(' '), timestamp: Date.now() }),
    warn: (...args) => logs.push({ type: 'warn', message: args.map(String).join(' '), timestamp: Date.now() }),
    error: (...args) => logs.push({ type: 'error', message: args.map(String).join(' '), timestamp: Date.now() }),
    info: (...args) => logs.push({ type: 'info', message: args.map(String).join(' '), timestamp: Date.now() }),
  }

  try {
    const fn = new Function('console', 'request', script)
    fn(capturedConsole, context.request)
    return { logs, error: null }
  } catch (err: any) {
    logs.push({ type: 'error', message: err.message, timestamp: Date.now() })
    return { logs, error: err.message }
  }
}

export function runPostResponseScript(
  script: string,
  context: { request: Record<string, any>; response: Record<string, any> }
): ScriptResult {
  const logs: ScriptLog[] = []
  const capturedConsole: Record<string, (...args: any[]) => void> = {
    log: (...args) => logs.push({ type: 'log', message: args.map(String).join(' '), timestamp: Date.now() }),
    warn: (...args) => logs.push({ type: 'warn', message: args.map(String).join(' '), timestamp: Date.now() }),
    error: (...args) => logs.push({ type: 'error', message: args.map(String).join(' '), timestamp: Date.now() }),
    info: (...args) => logs.push({ type: 'info', message: args.map(String).join(' '), timestamp: Date.now() }),
  }

  try {
    const fn = new Function('console', 'request', 'response', script)
    fn(capturedConsole, context.request, context.response)
    return { logs, error: null }
  } catch (err: any) {
    logs.push({ type: 'error', message: err.message, timestamp: Date.now() })
    return { logs, error: err.message }
  }
}
