import { services } from "@common/config";

import { type IJsxPdfService } from "./IJsxPdfService";
import { ReactPdfService } from "./impl/ReactPdfService";

export let jsxPdfService: IJsxPdfService;

if (services.jsxPdf === "react-pdf") {
  jsxPdfService = new ReactPdfService();
}
