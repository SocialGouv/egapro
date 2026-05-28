import {
	Body,
	Container,
	Font,
	Head,
	Html,
	Preview,
} from "@react-email/components";
import type { ReactNode } from "react";
import { getPublicUrl } from "../shared/urls.js";
import { COLORS, FONT, LAYOUT } from "./tokens.js";

type EmailLayoutProps = {
	previewText: string;
	children: ReactNode;
};

// Marianne is the typographic identity of the French Republic — required by
// the DSFR. Mail clients can't load the DSFR CSS bundle so we declare the
// three weights we use (Regular/Medium/Bold) explicitly. Sources live under
// `${EGAPRO_PUBLIC_URL}/dsfr/fonts/` (deployed by `scripts/copy-dsfr.mjs` on
// every app build, so the URL is stable across all environments).
const MARIANNE_FALLBACK: ("Arial" | "Helvetica" | "sans-serif")[] = [
	"Arial",
	"Helvetica",
	"sans-serif",
];

function MarianneFonts() {
	const base = `${getPublicUrl()}/dsfr/fonts`;
	return (
		<>
			<Font
				fontFamily="Marianne"
				fallbackFontFamily={MARIANNE_FALLBACK}
				webFont={{ url: `${base}/Marianne-Regular.woff2`, format: "woff2" }}
				fontWeight={FONT.weight.regular}
				fontStyle="normal"
			/>
			<Font
				fontFamily="Marianne"
				fallbackFontFamily={MARIANNE_FALLBACK}
				webFont={{ url: `${base}/Marianne-Medium.woff2`, format: "woff2" }}
				fontWeight={FONT.weight.medium}
				fontStyle="normal"
			/>
			<Font
				fontFamily="Marianne"
				fallbackFontFamily={MARIANNE_FALLBACK}
				webFont={{ url: `${base}/Marianne-Bold.woff2`, format: "woff2" }}
				fontWeight={FONT.weight.bold}
				fontStyle="normal"
			/>
		</>
	);
}

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
	return (
		<Html lang="fr">
			<Head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="x-apple-disable-message-reformatting" />
				<MarianneFonts />
			</Head>
			<Preview>{previewText}</Preview>
			<Body
				style={{
					margin: 0,
					padding: 0,
					backgroundColor: COLORS.bgAltGrey,
					fontFamily: FONT.family,
					color: COLORS.textTitle,
					WebkitFontSmoothing: "antialiased",
				}}
			>
				<div
					style={{
						width: "100%",
						height: 32,
						backgroundColor: COLORS.topBar,
					}}
				/>
				<Container
					style={{
						width: "100%",
						maxWidth: LAYOUT.contentWidth,
						margin: "0 auto",
						backgroundColor: COLORS.bgWhite,
						borderLeft: `1px solid ${COLORS.border}`,
						borderRight: `1px solid ${COLORS.border}`,
					}}
				>
					{children}
				</Container>
			</Body>
		</Html>
	);
}
