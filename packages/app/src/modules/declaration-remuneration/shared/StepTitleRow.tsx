import type { ReactNode } from "react";

import { DevFillButton } from "./DevFillButton";
import { SavedIndicator } from "./SavedIndicator";

type StepTitleRowProps = {
	title: ReactNode;
	onDevFill: () => void;
	hasData: boolean;
	isSaving?: boolean;
	isPendingSave?: boolean;
};

export function StepTitleRow({
	title,
	onDevFill,
	hasData,
	isSaving = false,
	isPendingSave = false,
}: StepTitleRowProps) {
	return (
		<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
			<div className="fr-col">{title}</div>
			<div className="fr-col-auto">
				<DevFillButton onFill={onDevFill} />
			</div>
			<div className="fr-col-auto">
				<SavedIndicator
					hasData={hasData}
					isPendingSave={isPendingSave}
					isSaving={isSaving}
				/>
			</div>
		</div>
	);
}
