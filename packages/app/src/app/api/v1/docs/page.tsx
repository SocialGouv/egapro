import { notFound } from "next/navigation";

import { env } from "~/env.js";
import { SwaggerUI } from "~/modules/export";

export default function DocsPage() {
	if (env.NEXT_PUBLIC_EGAPRO_ENV === "prod") {
		notFound();
	}

	return <SwaggerUI />;
}
