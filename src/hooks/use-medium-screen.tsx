import * as React from "react"

const MEDIUM_BREAKPOINT_MIN = 768
const MEDIUM_BREAKPOINT_MAX = 1024

export function useIsMediumScreen() {
  const [isMedium, setIsMedium] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MEDIUM_BREAKPOINT_MIN}px) and (max-width: ${MEDIUM_BREAKPOINT_MAX}px)`)
    const onChange = (e: MediaQueryListEvent) => {
      setIsMedium(e.matches)
    }
    mql.addEventListener("change", onChange)
    setIsMedium(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMedium
}
