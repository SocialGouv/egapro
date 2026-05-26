"use client";

import { useCallback, useEffect } from "react";
import type { CountyCode, RegionCode } from "~/modules/domain";
import { useDsfrModal, useZodForm } from "~/modules/shared";

import { ReferentFormFields } from "./ReferentFormFields";
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

	const doSubmit = useCallback(
		(data: ReferentFormValues) => {
			onSubmit(
				mode === "edit" && referent ? { ...data, id: referent.id } : data,
			);
			onClose();
			reset();
		},
		[mode, referent, onSubmit, onClose, reset],
	);

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
								<h2 className="fr-modal__title" id={`${modalId}-title`}>
									{mode === "create"
										? "Ajouter un référent"
										: "Modifier le référent"}
								</h2>
								<form
									autoComplete="off"
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
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											className="fr-btn fr-btn--primary"
											disabled={!isValid}
											form={`${modalId}-form`}
											type="submit"
										>
											Sauvegarder
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
							</div>
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}
