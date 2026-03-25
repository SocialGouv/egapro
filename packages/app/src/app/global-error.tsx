"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorPage } from "~/modules/error";

export default function GlobalError({
	error,
}: {
	error: Error & { digest?: string };
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html data-fr-scheme="system" lang="fr">
			<head>
				<title>Erreur inattendue — Egapro</title>
				<link href="/dsfr/dsfr.min.css" rel="stylesheet" />
				<link href="/dsfr/utility/colors/colors.min.css" rel="stylesheet" />
			</head>
			<body>
				<ErrorPage />
			</body>
		</html>
	);
}
