import { getImageUrl } from "../shared/urls.js";
import { BRAND, COLORS, FONT } from "./tokens.js";

// Official État bloc-marque: tricolore Marianne emblem on top, the ministry name
// (uppercase) and the "Liberté Égalité Fraternité" devise stacked beneath, with
// the operating direction to the right. The emblem is a raster PNG — Gmail and
// Outlook strip <img src="*.svg">, so a rasterized logo is required here.
const EMBLEM = getImageUrl("republique-francaise@2x.png");

const EMBLEM_WIDTH = 72;

export function MarianneLogoBlock() {
	return (
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
					<td align="left" style={{ verticalAlign: "top" }}>
						<table
							role="presentation"
							cellSpacing={0}
							cellPadding={0}
							border={0}
							style={{ borderCollapse: "collapse" }}
						>
							<tbody>
								<tr>
									<td style={{ paddingBottom: 4 }}>
										<img
											src={EMBLEM}
											alt={BRAND.marianneAlt}
											width={EMBLEM_WIDTH}
											style={{
												display: "block",
												width: `${EMBLEM_WIDTH}px`,
												height: "auto",
												border: 0,
											}}
										/>
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
											paddingTop: 4,
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
					</td>
					<td
						align="right"
						style={{
							verticalAlign: "top",
							fontFamily: FONT.family,
							fontSize: FONT.size.sm,
							fontWeight: FONT.weight.bold,
							color: COLORS.textTitle,
							lineHeight: FONT.lineHeight.sm,
						}}
					>
						{BRAND.directionLines.map((line) => (
							<div key={line}>{line}</div>
						))}
					</td>
				</tr>
			</tbody>
		</table>
	);
}
