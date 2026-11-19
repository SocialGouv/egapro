import type { Metadata } from "next";

import { ServiceStatusPage } from "~/modules/admin/serviceStatus";

export const metadata: Metadata = { title: "État des services" };

export default function Page() {
	return <ServiceStatusPage />;
}
