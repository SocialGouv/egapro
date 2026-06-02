import type { ReactNode } from "react";
import { EmailFrameRow } from "./EmailFrameRow.js";
import { COLORS } from "./tokens.js";

type EmailBodyProps = {
	children: ReactNode;
};

export function EmailBody({ children }: EmailBodyProps) {
	return (
		<EmailFrameRow gradient background={COLORS.bgWhite}>
			<tr>
				<td style={{ padding: "20px 10px" }}>
					{children}
				</td>
			</tr>
		</EmailFrameRow>
	);
}
