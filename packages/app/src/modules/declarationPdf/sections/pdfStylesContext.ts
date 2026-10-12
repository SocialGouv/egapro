import type { Styles } from "@react-pdf/renderer";
import { createContext, useContext } from "react";

import { styles } from "../recapPdfStyles";

export type PdfStyles = Record<keyof typeof styles, Styles[string]>;

// Lets a document re-pace the shared sections without changing the recap's layout.
export const PdfStylesContext = createContext<PdfStyles>(styles);

export function usePdfStyles(): PdfStyles {
	return useContext(PdfStylesContext);
}
