import { createContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
                                  children,
                                  defaultTheme = "system",
                                  storageKey = "vite-ui-theme",
                                  ...props
                              }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem(storageKey) as Theme | null
        if (defaultTheme === "system") {
            return "system"
        }
        return stored ?? defaultTheme
    })

    useEffect(() => {
        const root = window.document.documentElement
        const media = window.matchMedia("(prefers-color-scheme: dark)")

        const applyTheme = (nextTheme: Theme) => {
            root.classList.remove("light", "dark")

            if (nextTheme === "system") {
                const systemTheme = media.matches ? "dark" : "light"
                root.classList.add(systemTheme)
                return
            }

            root.classList.add(nextTheme)
        }

        applyTheme(theme)

        if (theme !== "system") {
            return
        }

        const handleChange = () => applyTheme("system")
        media.addEventListener("change", handleChange)
        return () => media.removeEventListener("change", handleChange)
    }, [theme])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

