import { useSearchParams } from "next/navigation";

/**
 *  Utility hook to know if the page is displayed for the first time.
 *
 * Heuristic based on router.query.
 */
export const useIsFirstRender = () => {
  const query = useSearchParams();

  return [...(query?.keys() ?? [])].length === 0;
};
