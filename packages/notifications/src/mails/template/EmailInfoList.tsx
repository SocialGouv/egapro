import { BORDER, COLORS, FONT, SPACING } from "./tokens.js";

export type InfoRow = {
	label: string;
	value: string | number;
};

type EmailInfoListProps = {
	rows: InfoRow[];
};

export function EmailInfoList({ rows }: EmailInfoListProps) {
	return (
		<table
			role="presentation"
			cellSpacing={0}
			cellPadding={0}
			border={0}
			width="100%"
			style={{
				borderCollapse: "collapse",
				marginBottom: SPACING.lg,
				backgroundColor: COLORS.bgAltBlueFrance,
				border: BORDER.thin,
			}}
		>
			<tbody>
				{rows.map((row, idx) => {
					const isLast = idx === rows.length - 1;
					const cellStyle = {
						padding: `${SPACING.sm}px ${SPACING.md}px`,
						borderBottom: isLast ? "none" : BORDER.thin,
						fontFamily: FONT.family,
						fontSize: FONT.size.sm,
						lineHeight: FONT.lineHeight.sm,
						verticalAlign: "top" as const,
					};
					return (
						<tr key={row.label}>
							<td
								style={{
									...cellStyle,
									width: "40%",
									color: COLORS.textMention,
								}}
							>
								{row.label}
							</td>
							<td
								style={{
									...cellStyle,
									color: COLORS.textTitle,
									fontWeight: FONT.weight.bold,
								}}
							>
								{row.value}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}
