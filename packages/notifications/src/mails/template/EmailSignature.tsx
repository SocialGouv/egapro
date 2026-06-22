import { BRAND, COLORS, FONT, SPACING } from "./tokens.js";

type EmailSignatureProps = {
	signerName?: string;
};

export function EmailSignature({
	signerName = BRAND.signerName,
}: EmailSignatureProps) {
	return (
		<>
			<p
				style={{
					margin: 0,
					marginTop: SPACING.lg,
					marginBottom: SPACING.xs,
					fontFamily: FONT.family,
					fontSize: FONT.size.body,
					lineHeight: FONT.lineHeight.body,
					color: COLORS.textDefault,
				}}
			>
				Cordialement,
			</p>
			<p
				style={{
					margin: 0,
					fontFamily: FONT.family,
					fontSize: FONT.size.body,
					fontWeight: FONT.weight.bold,
					lineHeight: FONT.lineHeight.body,
					color: COLORS.textTitle,
				}}
			>
				{signerName}
			</p>
		</>
	);
}
