import { create } from 'zustand'

interface CoachStore {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useCoachStore = create<CoachStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
