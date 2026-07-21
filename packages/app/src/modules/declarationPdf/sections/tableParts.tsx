import { Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { styles } from "../recapPdfStyles";

type Align = "left" | "right";

// Marianne (react-pdf) has no glyph for U+202F (the fr-FR thousands separator
// emitted by toLocaleString) — it renders as a stray slash. Swap for U+00A0.
export function normalizeSpaces(value: string): string {
	return value.replace(/\u202F/g, "\u00A0");
}

export function Table({ children }: { children: ReactNode }) {
	return (
		<View style={styles.table} wrap={false}>
			{children}
		</View>
	);
}

export function Row({ children }: { children: ReactNode }) {
	return <View style={styles.row}>{children}</View>;
}

type CellProps = {
	width?: number;
	flex?: number;
	header?: boolean;
	bold?: boolean;
	align?: Align;
	text?: string;
	hint?: string;
	children?: ReactNode;
};

export function Cell({
	width,
	flex,
	header,
	bold,
	align = "left",
	text,
	hint,
	children,
}: CellProps) {
	const sizing = width !== undefined ? { width } : { flex: flex ?? 1 };
	const textStyle = bold || header ? styles.cellTextBold : styles.cellText;
	const cellStyle = header
		? [styles.cell, styles.headerCell, sizing]
		: [styles.cell, sizing];
	return (
		<View style={cellStyle}>
			{text !== undefined ? (
				<Text style={[textStyle, { textAlign: align }]}>
					{normalizeSpaces(text)}
				</Text>
			) : null}
			{hint !== undefined ? (
				<Text style={styles.headerHint}>{normalizeSpaces(hint)}</Text>
			) : null}
			{children}
		</View>
	);
}
