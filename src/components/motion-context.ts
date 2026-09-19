import { createContext, useContext } from 'react'
export const MotionContext = createContext({ enabled: true, toggle: () => {} })
export function useMotion() { return useContext(MotionContext) }
