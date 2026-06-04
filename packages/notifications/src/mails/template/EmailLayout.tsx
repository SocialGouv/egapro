import { Body, Font, Head, Html, Preview } from "@react-email/components";
import type { ReactNode } from "react";
import { getPublicUrl } from "../shared/urls.js";
import { BASE_CSS } from "./baseCss.js";
import { COLORS, FONT } from "./tokens.js";

type EmailLayoutProps = {
	previewText: string;
	children: ReactNode;
};

// Marianne is the typographic identity of the French Republic — required by the
// DSFR. Mail clients can't load the DSFR CSS bundle so we declare the three
// weights we use explicitly. Sources live under `${EGAPRO_PUBLIC_URL}/dsfr/fonts/`
// (deployed by `scripts/copy-dsfr.mjs` on every app build, URL stable per env).
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
				<meta name="color-scheme" content="light" />
				<meta name="supported-color-schemes" content="light" />
				<MarianneFonts />
				<style>{BASE_CSS}</style>
			</Head>
			<Preview>{previewText}</Preview>
			<Body
				style={{
					margin: 0,
					padding: 0,
					width: "100%",
					fontFamily: FONT.family,
					color: COLORS.textTitle,
					WebkitFontSmoothing: "antialiased",
				}}
			>
				{children}
				<table
					role="presentation"
					width="100%"
					cellSpacing={0}
					cellPadding={0}
					border={0}
					style={{ borderCollapse: "collapse", width: "100%" }}
				>
					<tbody>
						<tr>
							<td style={{ height: 40, lineHeight: "40px", fontSize: 40 }}>
								&nbsp;
							</td>
						</tr>
					</tbody>
				</table>
			</Body>
		</Html>
	);
}
