import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode } from '@/lib/types'

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  resolvedTheme: 'light' | 'dark'
  setResolvedTheme: (theme: 'light' | 'dark') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: (theme) => set({ theme }),
      setResolvedTheme: (theme) => set({ resolvedTheme: theme }),
    }),
    { name: 'flamingo-theme' }
  )
)
