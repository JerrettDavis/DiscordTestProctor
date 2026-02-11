import { useMemo } from "react"

export function AppFooter() {
  const legalBaseUrl = useMemo(() => {
    const base =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BASE_URL ||
      window.location.origin
    return base.endsWith("/") ? base.slice(0, -1) : base
  }, [])

  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40 px-6 py-5 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>© 2026 Janus Proctor. All rights reserved.</span>
        <div className="flex flex-wrap items-center gap-4">
          <a className="hover:text-foreground" href={`${legalBaseUrl}/privacy`}>
            Privacy
          </a>
          <a className="hover:text-foreground" href={`${legalBaseUrl}/terms`}>
            Terms
          </a>
          <a className="hover:text-foreground" href="#/help">
            Help
          </a>
          <a className="hover:text-foreground" href={`${legalBaseUrl}/health`}>
            Status
          </a>
        </div>
      </div>
    </footer>
  )
}
