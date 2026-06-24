import { redirect } from "next/navigation";

import { LoginPage, sanitizeCallbackUrl } from "~/modules/login";
import { auth } from "~/server/auth";

type PageProps = {
	searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
	const { callbackUrl } = await searchParams;
	const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

	const session = await auth();

	if (session?.user) {
		redirect(safeCallbackUrl ?? "/mon-espace");
	}

	return <LoginPage callbackUrl={safeCallbackUrl} />;
}
