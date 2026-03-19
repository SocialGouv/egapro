import type { ReactNode } from "react";

import { DevFillButton } from "./DevFillButton";
import { SavedIndicator } from "./SavedIndicator";

type StepTitleRowProps = {
	title: ReactNode;
	onDevFill: () => void;
	saved: boolean;
};

export function StepTitleRow({ title, onDevFill, saved }: StepTitleRowProps) {
	return (
		<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
			<div className="fr-col">{title}</div>
			<div className="fr-col-auto">
				<DevFillButton onFill={onDevFill} />
			</div>
			{saved && (
				<div className="fr-col-auto">
					<SavedIndicator />
				</div>
			)}
		</div>
	);
}
