import { BUTTON, COLORS, FONT } from "./tokens.js";

type ButtonVariant = "primary" | "secondary" | "tertiary";

type EmailButtonProps = {
	href: string;
	label: string;
	variant?: ButtonVariant;
};

// DSFR button (Primaire / LG): a nested table with border-collapse:initial +
// a padding-based cell. This is the Outlook-safe construct from the template.
const VARIANTS: Record<
	ButtonVariant,
	{ border: string; bg: string; text: string }
> = {
	primary: {
		border: COLORS.blueFrance,
		bg: COLORS.blueFrance,
		text: COLORS.bgWhite,
	},
	secondary: {
		border: COLORS.blueFrance,
		bg: COLORS.bgWhite,
		text: COLORS.blueFrance,
	},
	tertiary: {
		border: COLORS.border,
		bg: COLORS.bgWhite,
		text: COLORS.blueFrance,
	},
};

export function EmailButton({
	href,
	label,
	variant = "primary",
}: EmailButtonProps) {
	const v = VARIANTS[variant];
	return (
		<table
			role="presentation"
			align="center"
			cellPadding={0}
			cellSpacing={0}
			border={0}
			style={{
				borderCollapse: "initial",
				border: `solid 1px ${v.border}`,
				backgroundColor: v.bg,
				marginLeft: "auto",
				marginRight: "auto",
			}}
		>
			<tbody>
				<tr>
					<td
						align="center"
						style={{
							fontSize: FONT.size.bodyMd,
							lineHeight: FONT.lineHeight.bodyMd,
							fontWeight: FONT.weight.medium,
							fontFamily: FONT.family,
							padding: `${BUTTON.paddingY}px ${BUTTON.paddingX}px`,
							backgroundColor: v.bg,
						}}
					>
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: v.text, textDecoration: "none" }}
						>
							<span>{label}</span>
						</a>
					</td>
				</tr>
			</tbody>
		</table>
	);
}
