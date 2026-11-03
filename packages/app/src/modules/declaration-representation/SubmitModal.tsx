"use client";

import { SubmitModal as SharedSubmitModal } from "~/modules/shared";

const MODAL_ID = "representation-submit-modal";

type Props = {
	campaignYear: number;
	isPending: boolean;
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
	onSubmit: () => void;
};

export function SubmitModal({
	campaignYear,
	isPending,
	modalRef,
	onClose,
	onSubmit,
}: Props) {
	return (
		<SharedSubmitModal
			certifyInputId="representation-submit-certify"
			certifyLabel="Je certifie que les données saisies sont exactes et conformes aux informations disponibles dans les systèmes de paie et de gestion des ressources humaines de l'entreprise."
			description={`Vous allez transmettre la déclaration des indicateurs de représentation ${campaignYear} aux services du ministère chargé du travail.`}
			isPending={isPending}
			modalId={MODAL_ID}
			modalRef={modalRef}
			onClose={onClose}
			onSubmit={onSubmit}
		/>
	);
}
