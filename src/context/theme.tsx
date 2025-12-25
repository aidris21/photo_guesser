import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type ThemePreference = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type ThemeContextValue = {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const storageKey = "photo-guesser-theme"

const themeValues = new Set<ThemePreference>(["light", "dark", "system"])

const getStoredTheme = (): ThemePreference | null => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const value = localStorage.getItem(storageKey)
    if (value && themeValues.has(value as ThemePreference)) {
      return value as ThemePreference
    }
  } catch {
    // Storage can be unavailable in private modes.
  }

  return null
}

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: ThemePreference
}

export function ThemeProvider({ children, defaultTheme = "system" }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme() ?? defaultTheme)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light")
    }

    updateSystemTheme()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateSystemTheme)
      return () => mediaQuery.removeEventListener("change", updateSystemTheme)
    }

    mediaQuery.addListener(updateSystemTheme)
    return () => mediaQuery.removeListener(updateSystemTheme)
  }, [])

  const resolvedTheme = theme === "system" ? systemTheme : theme

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const root = document.documentElement
    root.classList.toggle("dark", resolvedTheme === "dark")
    root.setAttribute("data-theme", resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      // Ignore write failures.
    }
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
