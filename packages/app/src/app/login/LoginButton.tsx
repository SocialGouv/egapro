"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
	return (
		<button
			className="fr-btn"
			onClick={() => signIn("proconnect", { callbackUrl: "/declaration" })}
			type="button"
		>
			Se connecter avec ProConnect
		</button>
	);
}
