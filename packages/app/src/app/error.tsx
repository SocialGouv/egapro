"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorPage } from "~/modules/error";

export default function AppError({
	error,
}: {
	error: Error & { digest?: string };
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return <ErrorPage />;
}
