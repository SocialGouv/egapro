import type { Metadata } from "next";

import { MaintenancePage } from "~/modules/error";

export const metadata: Metadata = {
	title: "Service indisponible",
};

/** Test route for the 503 Service Unavailable page. */
export default function Maintenance() {
	return <MaintenancePage />;
}
