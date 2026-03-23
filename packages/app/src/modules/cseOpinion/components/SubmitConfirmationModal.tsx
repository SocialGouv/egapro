"use client";

import { getCseYear } from "~/modules/domain";
import { SubmitModal } from "~/modules/shared";

type Props = {
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
	onSubmit: () => void;
};

export function SubmitConfirmationModal({
	modalRef,
	onClose,
	onSubmit,
}: Props) {
	return (
		<SubmitModal
			certifyInputId="cse-submit-certify"
			certifyLabel="Je certifie que les avis transmis sont conformes."
			description={
				<>
					Vous allez transmettre aux services du ministère chargé du Travail
					l&apos;avis ou les avis de votre CSE relatifs à l&apos;ensemble de
					votre démarche {getCseYear()}.
				</>
			}
			modalId="cse-submit-modal"
			modalRef={modalRef}
			onClose={onClose}
			onSubmit={onSubmit}
		/>
	);
}
