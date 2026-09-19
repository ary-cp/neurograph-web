import { createContext, useContext } from 'react'

/** Per-render derived facts nodes/edges need but React Flow doesn't pass: degrees, highlight, collisions, flares. */
export const ChartContext = createContext({
  degrees: new Map(),
  highlight: new Set(),
  colliding: new Set(),
  flare: new Set(),
})

export const useChart = () => useContext(ChartContext)
