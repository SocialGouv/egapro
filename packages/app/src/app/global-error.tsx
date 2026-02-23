"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
	error,
}: {
	error: Error & { digest?: string };
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html lang="fr">
			<body>
				<h1>An error occurred</h1>
				<p>An unexpected error occurred. Please try again.</p>
			</body>
		</html>
	);
}
