import React, { useEffect, useState, useCallback, useMemo, useContext, ReactNode } from "react"

import globalStyles from "../utils/globalStyles"
const { grid } = globalStyles

export type LayoutType = "mobile" | "tablet" | "desktop"

const gutterCount = grid.columns + 1
const totalGuttersWidth = gutterCount * grid.gutterWidth

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num))
}

function findColumnWidth(windowWidth: number) {
  const clampedWidth = clamp(windowWidth, grid.minWidth, grid.maxWidth)
  const availableWidthWithoutGutters = clampedWidth - totalGuttersWidth
  const columnWidth = availableWidthWithoutGutters / 12
  return Math.floor(columnWidth)
}

function findLayoutType(windowWidth: number): LayoutType {
  if (windowWidth < grid.minWidth) {
    return "mobile"
  } else if (windowWidth < grid.maxTabletWidth) {
    return "tablet"
  } else {
    return "desktop"
  }
}

// Context

export const GridContext = React.createContext({
  columnWidth: findColumnWidth(window.innerWidth),
  gutterWidth: grid.gutterWidth,
  layoutType: findLayoutType(window.innerWidth),
})

// Provider

function GridProvider({ children }: { children: ReactNode }) {
  const [columnWidth, setColumnWidth] = useState(findColumnWidth(window.innerWidth))
  const [layoutType, setLayoutType] = useState(findLayoutType(window.innerWidth))

  const handleResize = useCallback(
    (event: any) => {
      setColumnWidth(findColumnWidth(event.currentTarget.innerWidth))
      setLayoutType(findLayoutType(event.currentTarget.innerWidth))
    },
    [setColumnWidth, setLayoutType],
  )

  useEffect(() => {
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  })

  const value = useMemo(
    () => ({
      columnWidth,
      gutterWidth: grid.gutterWidth,
      layoutType,
    }),
    [columnWidth, layoutType],
  )

  return <GridContext.Provider value={value}>{children}</GridContext.Provider>
}

export default GridProvider

// Consumer

export const useGridContext = () => useContext(GridContext)

export const useColumnsWidth = (numColumns: number) => {
  const { columnWidth, gutterWidth } = useGridContext()
  return columnWidth * numColumns + gutterWidth * (numColumns - 1)
}

export const useLayoutType = () => {
  const { layoutType } = useGridContext()
  return layoutType
}
