"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { CountyCode, RegionCode } from "~/modules/domain";
import { useDsfrModal, useZodForm } from "~/modules/shared";

import { BUTTONS_GROUP_CLASS, ConfirmStepActions } from "./ConfirmStepActions";
import { ReferentFormFields } from "./ReferentFormFields";
import { ReferentReviewStep } from "./ReferentReviewStep";
import { listReferentChanges } from "./referentChanges";
import type { ReferentFormValues } from "./schemas";
import { referentFormSchema } from "./schemas";
import type { ReferentSearchRow } from "./types";

type Props = {
	mode: "create" | "edit";
	referent?: ReferentSearchRow | null;
	onSubmit: (data: ReferentFormValues & { id?: string }) => void;
};

const CREATE_MODAL_ID = "admin-create-referent-modal";
const EDIT_MODAL_ID = "admin-edit-referent-modal";

export function useReferentFormModal() {
	const create = useDsfrModal();
	const edit = useDsfrModal();
	return {
		createRef: create.modalRef,
		editRef: edit.modalRef,
		openCreate: create.open,
		closeCreate: create.close,
		openEdit: edit.open,
		closeEdit: edit.close,
	};
}

export function ReferentFormModal({
	mode,
	referent,
	onSubmit,
	modalRef,
	onClose,
}: Props & {
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
}) {
	const modalId = mode === "create" ? CREATE_MODAL_ID : EDIT_MODAL_ID;
	const reviewHeadingId = `${modalId}-review-title`;
	const titleRef = useRef<HTMLHeadingElement>(null);
	const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
	const [pendingEdit, setPendingEdit] = useState<ReferentFormValues | null>(
		null,
	);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors, isValid },
	} = useZodForm(referentFormSchema, {
		defaultValues: {
			region: "" as RegionCode,
			county: "",
			name: "",
			type: "email" as const,
			value: "",
			principal: false,
			substituteName: "",
			substituteEmail: "",
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (mode === "edit" && referent) {
			reset({
				region: referent.region as RegionCode,
				county: (referent.county as CountyCode) ?? "",
				name: referent.name,
				type: referent.type,
				value: referent.value,
				principal: referent.principal,
				substituteName: referent.substituteName ?? "",
				substituteEmail: referent.substituteEmail ?? "",
			});
		} else if (mode === "create") {
			reset({
				region: "" as RegionCode,
				county: "",
				name: "",
				type: "email",
				value: "",
				principal: false,
				substituteName: "",
				substituteEmail: "",
			});
		}
	}, [mode, referent, reset]);

	useEffect(() => {
		const modal = modalRef.current;
		if (!modal) return;
		const handleConceal = () => setPendingEdit(null);
		modal.addEventListener("dsfr.conceal", handleConceal);
		return () => modal.removeEventListener("dsfr.conceal", handleConceal);
	}, [modalRef]);

	const doSubmit = useCallback(
		(data: ReferentFormValues) => {
			if (mode === "edit") {
				flushSync(() => setPendingEdit(data));
				reviewHeadingRef.current?.focus();
				return;
			}
			onSubmit(data);
			onClose();
			reset();
		},
		[mode, onSubmit, onClose, reset],
	);

	const confirmEdit = useCallback(() => {
		if (!pendingEdit || !referent) return;
		onSubmit({ ...pendingEdit, id: referent.id });
		setPendingEdit(null);
		onClose();
		reset();
	}, [pendingEdit, referent, onSubmit, onClose, reset]);

	const backToFields = useCallback(() => {
		flushSync(() => setPendingEdit(null));
		titleRef.current?.focus();
	}, []);

	const isReviewing = mode === "edit" && pendingEdit !== null;
	const changes =
		isReviewing && referent ? listReferentChanges(referent, pendingEdit) : [];
	const submitLabel =
		mode === "edit" ? "Vérifier les modifications" : "Sauvegarder";

	return (
		<dialog
			aria-labelledby={`${modalId}-title`}
			aria-modal="true"
			className="fr-modal"
			id={modalId}
			ref={modalRef}
		>
			<div className="fr-container fr-container--fluid fr-container-md">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
						<div className="fr-modal__body">
							<div className="fr-modal__header">
								<button
									aria-controls={modalId}
									className="fr-btn--close fr-btn"
									onClick={onClose}
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className="fr-modal__content">
								<h2
									className="fr-modal__title"
									id={`${modalId}-title`}
									ref={titleRef}
									tabIndex={-1}
								>
									{mode === "create"
										? "Ajouter un référent"
										: "Modifier le référent"}
								</h2>
								<form
									autoComplete="off"
									hidden={isReviewing}
									id={`${modalId}-form`}
									onSubmit={handleSubmit(doSubmit)}
								>
									<ReferentFormFields
										errors={errors}
										modalId={modalId}
										register={register}
										watch={watch}
									/>
								</form>
								{isReviewing && (
									<ReferentReviewStep
										changes={changes}
										headingId={reviewHeadingId}
										headingRef={reviewHeadingRef}
									/>
								)}
							</div>
							<div className="fr-modal__footer">
								{isReviewing && (
									<ConfirmStepActions
										backLabel="Revenir aux champs"
										canConfirm={changes.length > 0}
										confirmLabel="Confirmer et enregistrer"
										onBack={backToFields}
										onCancel={onClose}
										onConfirm={confirmEdit}
									/>
								)}
								{!isReviewing && (
									<ul className={BUTTONS_GROUP_CLASS}>
										<li>
											<button
												className="fr-btn fr-btn--primary"
												disabled={!isValid}
												form={`${modalId}-form`}
												type="submit"
											>
												{submitLabel}
											</button>
										</li>
										<li>
											<button
												className="fr-btn fr-btn--secondary"
												onClick={onClose}
												type="button"
											>
												Annuler
											</button>
										</li>
									</ul>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}
