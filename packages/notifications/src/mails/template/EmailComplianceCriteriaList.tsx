import { COMPLIANCE_CRITERIA_ITEMS } from "./mailCopy.js";
import { FONT, SPACING } from "./tokens.js";

// Shared bullet list of the two regulatory compliance criteria (used by the CSE
// opinion receipt and the joint-evaluation mails). Single source of truth for
// both the wording (mailCopy) and the list styling.
export function EmailComplianceCriteriaList() {
	return (
		<ul
			style={{
				margin: 0,
				marginBottom: SPACING.md,
				paddingTop: SPACING.sm,
				paddingLeft: SPACING.lg,
				fontFamily: FONT.family,
				fontSize: FONT.size.body,
				lineHeight: FONT.lineHeight.body,
			}}
		>
			{COMPLIANCE_CRITERIA_ITEMS.map((item) => (
				<li key={item} style={{ marginBottom: SPACING.xs }}>
					{item}
				</li>
			))}
		</ul>
	);
}
