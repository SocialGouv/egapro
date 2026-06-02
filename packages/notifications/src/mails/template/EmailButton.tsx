import { BUTTON, COLORS, FONT } from "./tokens.js";

type ButtonVariant = "primary" | "secondary" | "tertiary";

type EmailButtonProps = {
	href: string;
	label: string;
	variant?: ButtonVariant;
};

// DSFR button: a nested table with border-collapse:initial + a fixed 32px cell.
// This is the Outlook-safe construct from the official template.
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
			align="left"
			cellPadding={0}
			cellSpacing={0}
			border={0}
			style={{
				borderCollapse: "initial",
				border: `solid 1px ${v.border}`,
				backgroundColor: v.bg,
			}}
		>
			<tbody>
				<tr>
					<td
						align="center"
						style={{
							fontSize: FONT.size.sm,
							lineHeight: FONT.lineHeight.sm,
							fontFamily: FONT.family,
							height: BUTTON.height,
							padding: `0 ${BUTTON.paddingX}px`,
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
