/* eslint-disable @typescript-eslint/no-empty-function */
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { useRef, useContext, useCallback, createContext, ReactNode } from "react"

// Context

export const ScrollContext = createContext({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scrollTo: (coord: number) => {},
})

// Provider

function ScrollProvider({ children, style }: { children: ReactNode; style: any }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollEl = scrollRef.current

  const scrollTo = useCallback(
    (coord: number) => {
      if (scrollEl) {
        if (scrollEl.scrollTo) {
          scrollEl.scrollTo(coord, 0)
        } else {
          scrollEl.scrollTop = coord
        }
      }
    },
    [scrollEl],
  )

  return (
    <ScrollContext.Provider value={{ scrollTo }}>
      <div ref={scrollRef} css={[styles.scroll, style]}>
        {children}
      </div>
    </ScrollContext.Provider>
  )
}

const styles = {
  scroll: css({
    border: "10px solid red !important",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    "@media print": {
      overflow: "visible",
    },
  }),
}

export default ScrollProvider

// Consumer

const useScrollContext = () => useContext(ScrollContext)

export const useScrollTo = () => {
  const { scrollTo } = useScrollContext()
  return scrollTo
}
