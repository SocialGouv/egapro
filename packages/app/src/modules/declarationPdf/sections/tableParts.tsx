import { Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { styles } from "../recapPdfStyles";

type Align = "left" | "right";

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
				<Text style={[textStyle, { textAlign: align }]}>{text}</Text>
			) : null}
			{hint !== undefined ? (
				<Text style={styles.headerHint}>{hint}</Text>
			) : null}
			{children}
		</View>
	);
}
