"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { Controller } from "react-hook-form";

import { getCurrentYear } from "~/modules/domain";
import { getDsfrModal } from "~/modules/shared";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import styles from "./CompanyEditModal.module.scss";
import { formatSiren } from "./formatSiren";
import { updateHasCseSchema } from "./schemas";

export const MODAL_ID = "company-edit-modal";
const MODAL_TITLE_ID = "company-edit-modal-title";
const CURRENT_YEAR = getCurrentYear();

type Props = {
	company: {
		siren: string;
		name: string;
		address: string | null;
		nafCode: string | null;
		workforce: number | null;
		hasCse: boolean | null;
	};
};

export function CompanyEditModal({ company: initialCompany }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const router = useRouter();

	const form = useZodForm(updateHasCseSchema, {
		defaultValues: {
			siren: initialCompany.siren,
			hasCse: initialCompany.hasCse ?? undefined,
		},
	});

	const hasCse = form.watch("hasCse");

	const closeModal = useCallback(() => {
		const dialog = dialogRef.current;
		if (dialog) getDsfrModal(dialog)?.conceal();
	}, []);

	const updateHasCseMutation = api.company.updateHasCse.useMutation({
		onSuccess: () => {
			closeModal();
			router.refresh();
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		if (data.hasCse === undefined) return;
		updateHasCseMutation.mutate({ siren: data.siren, hasCse: data.hasCse });
	});

	return (
		<dialog
			aria-labelledby={MODAL_TITLE_ID}
			className="fr-modal"
			id={MODAL_ID}
			ref={dialogRef}
		>
			<div className="fr-container fr-container--fluid fr-container-md">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
						<div className="fr-modal__body">
							<div className="fr-modal__header">
								<button
									aria-controls={MODAL_ID}
									className="fr-btn--close fr-btn"
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className="fr-modal__content">
								<h2 className="fr-modal__title" id={MODAL_TITLE_ID}>
									Modifier les informations
								</h2>
								<p className="fr-mb-3w">
									Vérifier les données affichées et compléter l'information
									manquante si nécessaire.
								</p>

								<form id="company-edit-form" onSubmit={onSubmit}>
									<CompanyReadonlySection company={initialCompany} />
									<Controller
										control={form.control}
										name="hasCse"
										render={({ field }) => (
											<CseRadioGroup
												hasCse={field.value ?? null}
												setHasCse={field.onChange}
											/>
										)}
									/>
								</form>
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											className="fr-btn"
											disabled={
												hasCse === undefined || updateHasCseMutation.isPending
											}
											form="company-edit-form"
											type="submit"
										>
											Enregistrer
										</button>
									</li>
									<li>
										<button
											aria-controls={MODAL_ID}
											className="fr-btn fr-btn--secondary"
											type="button"
										>
											Annuler
										</button>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}

type CompanyReadonlySectionProps = {
	company: {
		siren: string;
		name: string;
		address: string | null;
		nafCode: string | null;
		workforce: number | null;
	};
};

function CompanyReadonlySection({ company }: CompanyReadonlySectionProps) {
	return (
		<>
			<div className={`fr-mb-3w ${styles.section}`}>
				<InfoRow label="Raison sociale :" value={company.name} />
				<InfoRow label="SIREN :" value={formatSiren(company.siren)} />
				<InfoRow label="Adresse :" value={company.address} />
				<InfoRow label="Code NAF :" value={company.nafCode} />
				<p className={`fr-text--xs fr-mb-0 ${styles.sourceText}`}>
					Source : INSEE. Pour toute correction ou mise à jour, contactez
					l'INSEE.
				</p>
			</div>

			<div className={`fr-mb-3w ${styles.section}`}>
				<InfoRow
					label={`Effectif annuel moyen en ${CURRENT_YEAR} :`}
					value={company.workforce?.toLocaleString("fr-FR")}
				/>
				<p className={`fr-text--xs fr-mb-0 ${styles.sourceText}`}>
					Source : déclarations sociales nominatives.
				</p>
			</div>
		</>
	);
}

type InfoRowProps = {
	label: string;
	value: string | number | null | undefined;
};

function InfoRow({ label, value }: InfoRowProps) {
	return (
		<p className={`fr-mb-0 ${styles.infoRow}`}>
			<span>{label}</span>
			<strong>{value ?? "—"}</strong>
		</p>
	);
}

type CseRadioGroupProps = {
	hasCse: boolean | null;
	setHasCse: (value: boolean) => void;
};

function CseRadioGroup({ hasCse, setHasCse }: CseRadioGroupProps) {
	return (
		<fieldset className="fr-fieldset">
			<legend className="fr-fieldset__legend--regular fr-fieldset__legend">
				Existence d'un CSE (obligatoire)
			</legend>
			<div className="fr-fieldset__element fr-fieldset__element--inline">
				<div className="fr-radio-group fr-radio-rich">
					<input
						checked={hasCse === true}
						id="cse-radio-yes"
						name="cse"
						onChange={() => setHasCse(true)}
						required
						type="radio"
						value="true"
					/>
					<label className="fr-label" htmlFor="cse-radio-yes">
						Oui
					</label>
				</div>
			</div>
			<div className="fr-fieldset__element fr-fieldset__element--inline">
				<div className="fr-radio-group fr-radio-rich">
					<input
						checked={hasCse === false}
						id="cse-radio-no"
						name="cse"
						onChange={() => setHasCse(false)}
						type="radio"
						value="false"
					/>
					<label className="fr-label" htmlFor="cse-radio-no">
						Non
					</label>
				</div>
			</div>
			<div aria-live="polite" className="fr-messages-group"></div>
			<p className={`fr-text--xs fr-mb-0 ${styles.sourceText}`}>
				Source : information relative aux élections professionnelles transmise à
				l'administration.
			</p>
		</fieldset>
	);
}
