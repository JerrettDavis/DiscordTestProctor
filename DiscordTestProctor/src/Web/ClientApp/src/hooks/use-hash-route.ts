import { useEffect, useMemo, useState } from "react"

export type HashRoute = {
  path: string
  segments: string[]
}

const normalizeHash = (hash: string) => hash.replace(/^#/, "")

const parseHash = (hash: string): HashRoute => {
  const cleaned = normalizeHash(hash).trim()
  const segments = cleaned.split("/").filter(Boolean)
  return {
    path: segments[0] ?? "overview",
    segments,
  }
}

export function useHashRoute(defaultPath = "overview") {
  const [route, setRoute] = useState<HashRoute>(() => {
    const initial = parseHash(window.location.hash)
    if (initial.segments.length === 0) {
      window.location.hash = `#/${defaultPath}`
      return { path: defaultPath, segments: [defaultPath] }
    }
    return initial
  })

  useEffect(() => {
    const handler = () => setRoute(parseHash(window.location.hash))
    window.addEventListener("hashchange", handler)
    return () => window.removeEventListener("hashchange", handler)
  }, [])

  const navigate = (path: string) => {
    const target = path.startsWith("#") ? path : `#/${path}`
    window.location.hash = target
  }

  const params = useMemo(() => route.segments.slice(1), [route.segments])

  return { route, params, navigate }
}
