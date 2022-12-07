import { useRouter } from "next/router";

/**
 *  Utility hook to know if the page is displayed for the first time.
 *
 * Heuristic based on router.query.
 */
export const useIsFirstRender = () => {
  const router = useRouter();

  return Object.keys(router.query).length === 0;
};
