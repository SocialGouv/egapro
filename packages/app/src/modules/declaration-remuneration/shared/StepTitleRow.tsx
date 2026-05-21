import type { ReactNode } from "react";

import { DevFillButton } from "./DevFillButton";
import { SavedIndicator } from "./SavedIndicator";

type StepTitleRowProps = {
	title: ReactNode;
	onDevFill: () => void;
	saved: boolean;
	isSaving?: boolean;
	isPendingSave?: boolean;
};

export function StepTitleRow({
	title,
	onDevFill,
	saved,
	isSaving = false,
	isPendingSave = false,
}: StepTitleRowProps) {
	return (
		<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
			<div className="fr-col">{title}</div>
			<div className="fr-col-auto">
				<DevFillButton onFill={onDevFill} />
			</div>
			{(saved || isSaving || isPendingSave) && (
				<div className="fr-col-auto">
					<SavedIndicator isPendingSave={isPendingSave} isSaving={isSaving} />
				</div>
			)}
		</div>
	);
}
