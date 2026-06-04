import { EmailFrameRow } from "./EmailFrameRow.js";
import { MarianneLogoBlock } from "./MarianneLogoBlock.js";

export function EmailHeader() {
	return (
		<EmailFrameRow edge="top">
			<tr>
				<td style={{ padding: "12px 0 20px" }}>
					<MarianneLogoBlock />
				</td>
			</tr>
		</EmailFrameRow>
	);
}
