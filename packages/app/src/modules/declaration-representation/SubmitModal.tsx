"use client";

import { SubmitModal as SharedSubmitModal } from "~/modules/shared";
import type { RepresentationSubmitVariant } from "./shared/reviewSummary";

const MODAL_ID = "representation-submit-modal";

const VARIANT_MESSAGES: Record<RepresentationSubmitVariant, string> = {
	two_gaps:
		"Des écarts de représentation sont non conformes au seuil réglementaire actuel. Vous devez définir des mesures correctives par accord collectif ou par décision unilatérale de l'employeur, et les déposer sur TéléAccords.",
	one_gap:
		"Un écart de représentation est non conforme au seuil réglementaire. Vous devez définir des mesures correctives par accord collectif ou par décision unilatérale de l'employeur, et les déposer sur TéléAccords.",
	compliant:
		"Vos écarts de représentation sont conformes au seuil réglementaire actuel.",
	not_computable: "Vos écarts de représentation ne sont pas calculables.",
};

type Props = {
	campaignYear: number;
	isPending: boolean;
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
	onSubmit: () => void;
	variant: RepresentationSubmitVariant;
};

export function SubmitModal({
	campaignYear,
	isPending,
	modalRef,
	onClose,
	onSubmit,
	variant,
}: Props) {
	return (
		<SharedSubmitModal
			certifyInputId="representation-submit-certify"
			certifyLabel="Je certifie que les données saisies sont exactes et conformes aux informations disponibles dans les systèmes de paie et de gestion des ressources humaines de l'entreprise."
			description={
				<>
					Vous allez soumettre la déclaration des indicateurs de représentation{" "}
					{campaignYear} aux services du ministère chargé du travail.
					<br />
					<strong>{VARIANT_MESSAGES[variant]}</strong>
				</>
			}
			isPending={isPending}
			modalId={MODAL_ID}
			modalRef={modalRef}
			onClose={onClose}
			onSubmit={onSubmit}
			title="Soumettre"
		/>
	);
}
