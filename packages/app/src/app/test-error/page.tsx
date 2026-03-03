import { notFound } from "next/navigation";

import { env } from "~/env.js";
import { ErrorTrigger } from "~/modules/testError";

/** Test route for the 500 error page. Only available in development. */
export default function TestError() {
	if (env.NODE_ENV === "production") {
		notFound();
	}

	return <ErrorTrigger />;
}
