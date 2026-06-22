import type { CSSProperties, ReactNode } from "react";
import { COLORS, LAYOUT } from "./tokens.js";

type FrameEdge = "top" | "bottom" | "none";

type EmailFrameRowProps = {
	edge?: FrameEdge;
	gradient?: boolean;
	bordered?: boolean;
	background?: string;
	children: ReactNode;
};

// One DSFR module = full-width → 620 (gradient) → 600 (side-bordered) → 496
// (inner content) nested tables. `children` are the <tr> rows of the 496 table.
const MSO: CSSProperties = { borderCollapse: "collapse" };

export function EmailFrameRow({
	edge = "none",
	gradient = false,
	bordered = true,
	background = COLORS.bgWhite,
	children,
}: EmailFrameRowProps) {
	const side = `1px solid ${COLORS.frameBorder}`;
	const borderStyle: CSSProperties = bordered
		? {
				borderLeft: side,
				borderRight: side,
				...(edge === "top" ? { borderTop: side } : {}),
				...(edge === "bottom" ? { borderBottom: side } : {}),
			}
		: {};
	return (
		<table
			role="presentation"
			width="100%"
			cellSpacing={0}
			cellPadding={0}
			border={0}
			style={{ minWidth: "100%", width: "100%", ...MSO }}
		>
			<tbody>
				<tr>
					<td align="center">
						<table
							role="presentation"
							width={LAYOUT.frameOuterWidth}
							cellSpacing={0}
							cellPadding={0}
							border={0}
							align="center"
							style={{
								minWidth: LAYOUT.frameOuterWidth,
								margin: "0 auto",
								...MSO,
								...(gradient ? { background: LAYOUT.frameGradient } : {}),
							}}
						>
							<tbody>
								<tr>
									<td align="center">
										<table
											role="presentation"
											width={LAYOUT.frameWidth}
											cellSpacing={0}
											cellPadding={0}
											border={0}
											align="center"
											style={{
												minWidth: LAYOUT.frameWidth,
												width: LAYOUT.frameWidth,
												margin: "0 auto",
												backgroundColor: background,
												...MSO,
												...borderStyle,
											}}
										>
											<tbody>
												<tr>
													<td align="center">
														<table
															role="presentation"
															width={LAYOUT.frameInnerWidth}
															cellSpacing={0}
															cellPadding={0}
															border={0}
															align="center"
															style={{
																width: LAYOUT.frameInnerWidth,
																margin: "0 auto",
																backgroundColor: background,
																...MSO,
															}}
														>
															<tbody>{children}</tbody>
														</table>
													</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
	);
}
