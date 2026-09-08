"use client";

import { signIn } from "next-auth/react";

type Props = {
	returnPath: string;
};

// Triggered by a click, never by the page itself: an automatic redirect would
// bounce the agent between Egapro and ProConnect were the issuer to replay an
// authentication too old for our window.
export function AdminAccessResumeButton({ returnPath }: Props) {
	return (
		<button
			className="fr-btn"
			onClick={() => {
				void signIn("proconnect", { callbackUrl: returnPath });
			}}
			type="button"
		>
			Refaire la double authentification
		</button>
	);
}
