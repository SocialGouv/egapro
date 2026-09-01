import type { Metadata } from "next";
import Script from "next/script";

import { env } from "~/env.js";
import { MatomoAnalytics } from "~/modules/analytics";
import { SessionProviderWrapper } from "~/modules/auth";
import {
	Header,
	ImpersonateBanner,
	PublicChrome,
	SkipLinks,
} from "~/modules/layout";
import { buildMetadataRobots } from "~/modules/legal";
import { ProfileModal } from "~/modules/profile";
import { TRPCReactProvider } from "~/trpc/react";

// Overrides must win on specificity — this bundle loads before dsfr.min.css.
import "~/modules/layout/designTokens.css";
import "~/modules/layout/dsfrFixes.scss";

export const metadata: Metadata = {
	title: { template: "%s — Egapro", default: "Egapro" },
	description: "Indicateurs d'égalité professionnelle femmes‑hommes",
	robots: buildMetadataRobots(env.NEXT_PUBLIC_EGAPRO_ENV === "prod"),
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html data-fr-scheme="system" lang="fr">
			<head>
				{/* Restore user theme from cookie before render to avoid flash */}
				<Script id="dsfr-theme-init" strategy="beforeInteractive">
					{`(function(){var c=document.cookie.match(/(?:^|; )fr-theme=([^;]*)/);if(c)document.documentElement.setAttribute('data-fr-scheme',decodeURIComponent(c[1]));})();`}
				</Script>
				<link href="/dsfr/dsfr.min.css" rel="stylesheet" />
				<link href="/dsfr/utility/icons/icons.min.css" rel="stylesheet" />
				<link href="/dsfr/utility/colors/colors.min.css" rel="stylesheet" />
				<link
					href="/dsfr/favicon/apple-touch-icon.png"
					rel="apple-touch-icon"
				/>
				<link
					href="/dsfr/favicon/favicon.svg"
					rel="icon"
					type="image/svg+xml"
				/>
				<link
					href="/dsfr/favicon/favicon.ico"
					rel="shortcut icon"
					type="image/x-icon"
				/>
				<link
					crossOrigin="use-credentials"
					href="/dsfr/favicon/manifest.webmanifest"
					rel="manifest"
				/>
			</head>
			<body>
				<MatomoAnalytics />
				<SkipLinks />
				<SessionProviderWrapper>
					<TRPCReactProvider>
						<ImpersonateBanner />
						<Header />
						{children}
						<PublicChrome />
						<ProfileModal />
					</TRPCReactProvider>
				</SessionProviderWrapper>
				<Script
					src="/dsfr/dsfr.module.min.js"
					strategy="afterInteractive"
					type="module"
				/>
			</body>
		</html>
	);
}
