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
				<h1>Une erreur est survenue</h1>
				<p>Une erreur inattendue s&apos;est produite. Veuillez réessayer.</p>
			</body>
		</html>
	);
}
