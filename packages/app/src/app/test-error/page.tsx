import { notFound } from "next/navigation";

import { env } from "~/env.js";
import { ErrorTrigger } from "~/modules/testError";

/** Test route for the 500 error page. Blocked in production only. */
export default function TestError() {
	if (env.NEXT_PUBLIC_EGAPRO_ENV === "prod") {
		notFound();
	}

	return <ErrorTrigger />;
}
