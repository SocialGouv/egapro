"use client";

import { SubmitModal } from "~/modules/shared";

type Props = {
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
	onSubmit: () => void;
};

export function JointEvaluationSubmitModal({
	modalRef,
	onClose,
	onSubmit,
}: Props) {
	return (
		<SubmitModal
			certifyInputId="joint-evaluation-certify"
			certifyLabel="Je certifie que le rapport transmis est conforme."
			description="Vous allez transmettre aux services du ministère chargé du Travail le rapport de l'évaluation conjointe des rémunérations."
			modalId="joint-evaluation-submit-modal"
			modalRef={modalRef}
			onClose={onClose}
			onSubmit={onSubmit}
		/>
	);
}
