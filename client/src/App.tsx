import { useEffect, useState } from 'react'

type HealthStatus =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ok'; timestamp: string }

function App() {
  const [health, setHealth] = useState<HealthStatus>({ state: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/health`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API responded with ${res.status}`)
        return res.json() as Promise<{ timestamp: string }>
      })
      .then((data) => setHealth({ state: 'ok', timestamp: data.timestamp }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setHealth({
          state: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          ServiceFlow
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Service-business management platform — Phase 0 scaffold
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
        {health.state === 'loading' && (
          <span className="text-muted-foreground">Checking API connection…</span>
        )}
        {health.state === 'ok' && (
          <span className="text-success">
            API connected — server time {new Date(health.timestamp).toLocaleTimeString()}
          </span>
        )}
        {health.state === 'error' && (
          <span className="text-destructive">API unreachable: {health.message}</span>
        )}
      </div>
    </main>
  )
}

export default App
