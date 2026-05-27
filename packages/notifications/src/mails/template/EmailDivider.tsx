import { Hr } from "@react-email/components";
import { COLORS, SPACING } from "./tokens.js";

export function EmailDivider() {
	return (
		<Hr
			style={{
				margin: `${SPACING.md}px 0`,
				borderColor: COLORS.border,
			}}
		/>
	);
}
