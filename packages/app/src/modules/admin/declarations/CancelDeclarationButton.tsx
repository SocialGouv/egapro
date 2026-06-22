"use client";

import { useState } from "react";

import { getCurrentYear } from "~/modules/domain";
import { useDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";

import {
	CANCEL_DECLARATION_BUTTON_LABEL,
	CANCEL_DECLARATION_CONFIRM_LABEL,
	CANCEL_DECLARATION_MODAL_BODY,
	CANCEL_DECLARATION_MODAL_TITLE,
} from "./shared/constants";

const MODAL_ID = "cancel-declaration-modal";

type Props = {
	declarationId: string;
	year: number;
	cancelledAt: Date | null;
};

export function CancelDeclarationButton({
	declarationId,
	year,
	cancelledAt,
}: Props) {
	if (cancelledAt !== null || year !== getCurrentYear()) {
		return null;
	}

	return <CancelDeclarationButtonInner declarationId={declarationId} />;
}

function CancelDeclarationButtonInner({
	declarationId,
}: {
	declarationId: string;
}) {
	const [error, setError] = useState<string | null>(null);
	const { modalRef, open, close } = useDsfrModal();
	const utils = api.useUtils();

	const mutation = api.adminDeclarations.cancel.useMutation({
		onSuccess: async () => {
			close();
			await utils.adminDeclarations.getById.invalidate({ id: declarationId });
			await utils.adminDeclarations.search.invalidate();
		},
		onError: (err) => {
			setError(err.message);
		},
	});

	const handleConfirm = () => {
		setError(null);
		mutation.mutate({ id: declarationId });
	};

	const handleClose = () => {
		setError(null);
		close();
	};

	return (
		<>
			<button className="fr-btn fr-btn--secondary" onClick={open} type="button">
				{CANCEL_DECLARATION_BUTTON_LABEL}
			</button>
			<dialog
				aria-labelledby={`${MODAL_ID}-title`}
				aria-modal="true"
				className="fr-modal"
				id={MODAL_ID}
				ref={modalRef}
			>
				<div className="fr-container fr-container--fluid fr-container-md">
					<div className="fr-grid-row fr-grid-row--center">
						<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
							<div className="fr-modal__body">
								<div className="fr-modal__header">
									<button
										aria-controls={MODAL_ID}
										className="fr-btn--close fr-btn"
										onClick={handleClose}
										title="Fermer"
										type="button"
									>
										Fermer
									</button>
								</div>
								<div className="fr-modal__content">
									<h2 className="fr-modal__title" id={`${MODAL_ID}-title`}>
										{CANCEL_DECLARATION_MODAL_TITLE}
									</h2>
									<p>{CANCEL_DECLARATION_MODAL_BODY}</p>
									{error && (
										<div
											aria-live="polite"
											className="fr-alert fr-alert--error fr-alert--sm fr-mt-2w"
											role="alert"
										>
											<p>{error}</p>
										</div>
									)}
								</div>
								<div className="fr-modal__footer">
									<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
										<li>
											<button
												className="fr-btn fr-btn--primary"
												disabled={mutation.isPending}
												onClick={handleConfirm}
												type="button"
											>
												{CANCEL_DECLARATION_CONFIRM_LABEL}
											</button>
										</li>
										<li>
											<button
												className="fr-btn fr-btn--secondary"
												onClick={handleClose}
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
		</>
	);
}
