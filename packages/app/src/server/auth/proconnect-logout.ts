import { env } from "~/env";

interface OidcConfig {
	end_session_endpoint?: string;
}

export async function fetchEndSessionEndpoint(): Promise<string | null> {
	if (!env.EGAPRO_PROCONNECT_ISSUER) {
		return null;
	}
	try {
		const response = await fetch(
			`${env.EGAPRO_PROCONNECT_ISSUER}/.well-known/openid-configuration`,
		);
		const config = (await response.json()) as OidcConfig;
		return config.end_session_endpoint ?? null;
	} catch {
		return null;
	}
}
