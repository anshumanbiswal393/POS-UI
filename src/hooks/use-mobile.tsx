import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const COMPACT_NAV_BREAKPOINT = 1024;

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return !!matches;
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

/** Matches Tailwind <lg (<1024px) where navigation uses the slide-over drawer. */
export function useIsCompactViewport() {
  return useMediaQuery(`(max-width: ${COMPACT_NAV_BREAKPOINT - 1}px)`);
}
