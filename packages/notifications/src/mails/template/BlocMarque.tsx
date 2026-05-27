import { BRAND, COLORS, FONT, SPACING } from "./tokens.js";

// Bloc-marque officiel État français — drapeau RF 27×20 + ministère 3 lignes
// + devise 3 lignes. Utilisé en haut (EmailHeader) et en bas (EmailFooter) des
// emails Egapro. SVG inline car les emails ne chargent pas d'images externes
// par défaut (Outlook, Gmail mode déconnecté).
export function BlocMarque() {
	return (
		<table
			role="presentation"
			cellSpacing={0}
			cellPadding={0}
			border={0}
			style={{ borderCollapse: "collapse" }}
		>
			<tbody>
				<tr>
					<td style={{ paddingBottom: SPACING.xs }}>
						<svg
							width="27"
							height="20"
							viewBox="0 0 27 20"
							xmlns="http://www.w3.org/2000/svg"
							role="presentation"
							aria-hidden="true"
							style={{ display: "block" }}
						>
							<title>Drapeau français</title>
							<rect width="9" height="20" fill={COLORS.mariannBlue} />
							<rect x="9" width="9" height="20" fill={COLORS.bgWhite} />
							<rect x="18" width="9" height="20" fill={COLORS.mariannRed} />
						</svg>
					</td>
				</tr>
				<tr>
					<td
						style={{
							fontFamily: FONT.family,
							fontSize: FONT.size.xs,
							fontWeight: FONT.weight.bold,
							color: COLORS.textTitle,
							lineHeight: "14px",
							letterSpacing: "0.02em",
							textTransform: "uppercase",
						}}
					>
						{BRAND.ministryLines.map((line) => (
							<div key={line}>{line}</div>
						))}
					</td>
				</tr>
				<tr>
					<td
						style={{
							paddingTop: SPACING.xs,
							fontFamily: FONT.family,
							fontSize: 10,
							fontStyle: "italic",
							color: COLORS.textTitle,
							lineHeight: "12px",
						}}
					>
						{BRAND.deviseLines.map((line) => (
							<div key={line}>{line}</div>
						))}
					</td>
				</tr>
			</tbody>
		</table>
	);
}
