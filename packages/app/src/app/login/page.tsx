import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginPage, sanitizeCallbackUrl } from "~/modules/login";
import { MY_SPACE, runtimeRoute } from "~/modules/routes";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Connexion" };

type PageProps = {
	searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
	const { callbackUrl } = await searchParams;
	const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

	const session = await auth();

	if (session?.user) {
		redirect(safeCallbackUrl ? runtimeRoute(safeCallbackUrl) : MY_SPACE);
	}

	return <LoginPage callbackUrl={safeCallbackUrl} />;
}
