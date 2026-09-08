"use client";

import { signIn } from "next-auth/react";

type Props = {
	returnPath: string;
};

/**
 * Relaunches the ProConnect two-factor step-up, aiming back at the deep link
 * the agent originally requested.
 *
 * The passage is triggered by a click, never by the page itself: an automatic
 * redirect would send the agent bouncing between Egapro and ProConnect were the
 * issuer to replay an authentication too old for our freshness window.
 */
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
