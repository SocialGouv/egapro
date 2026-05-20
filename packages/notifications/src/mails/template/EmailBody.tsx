import { Section } from "@react-email/components";
import type { ReactNode } from "react";
import { COLORS, LAYOUT, SPACING } from "./tokens.js";

type EmailBodyProps = {
	children: ReactNode;
};

export function EmailBody({ children }: EmailBodyProps) {
	return (
		<Section
			style={{
				padding: `${LAYOUT.innerPaddingY}px ${LAYOUT.innerPaddingX}px`,
				backgroundColor: COLORS.bgWhite,
			}}
		>
			<table
				role="presentation"
				cellSpacing={0}
				cellPadding={0}
				border={0}
				width="100%"
				style={{ borderCollapse: "collapse" }}
			>
				<tbody>
					<tr>
						<td style={{ padding: 0, paddingBottom: SPACING.md }}>
							{children}
						</td>
					</tr>
				</tbody>
			</table>
		</Section>
	);
}
