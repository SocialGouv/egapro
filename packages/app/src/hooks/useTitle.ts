import { useEffect } from "react"
/**
 * Update the title of the page and restore it when the component is unmouted.
 *
 * @param title title of the page
 */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title + " - Index Egapro"
  })
}
