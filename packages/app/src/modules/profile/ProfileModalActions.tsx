const SAVING_LABEL = "Enregistrement en cours…";

const BUTTONS_GROUP_CLASS =
	"fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg";

type EditActionsProps = {
	canReview: boolean;
	modalId: string;
};

export function EditActions({ canReview, modalId }: EditActionsProps) {
	return (
		<ul className={BUTTONS_GROUP_CLASS}>
			<li>
				<button
					aria-disabled={!canReview || undefined}
					className="fr-btn"
					form="profile-form"
					type="submit"
				>
					Vérifier mes modifications
				</button>
			</li>
			<li>
				<CancelButton className="fr-btn fr-btn--secondary" modalId={modalId} />
			</li>
		</ul>
	);
}

type ReviewActionsProps = {
	canConfirm: boolean;
	isSaving: boolean;
	modalId: string;
	onBack: () => void;
	onConfirm: () => void;
};

export function ReviewActions({
	canConfirm,
	isSaving,
	modalId,
	onBack,
	onConfirm,
}: ReviewActionsProps) {
	const confirmLabel = isSaving ? SAVING_LABEL : "Confirmer et enregistrer";

	return (
		<ul className={BUTTONS_GROUP_CLASS}>
			{canConfirm && (
				<li>
					<button
						aria-disabled={isSaving || undefined}
						className="fr-btn"
						onClick={onConfirm}
						type="button"
					>
						{confirmLabel}
					</button>
				</li>
			)}
			<li>
				<button
					aria-disabled={isSaving || undefined}
					className="fr-btn fr-btn--secondary"
					onClick={onBack}
					type="button"
				>
					Revenir aux champs
				</button>
			</li>
			<li>
				<CancelButton className="fr-btn fr-btn--tertiary" modalId={modalId} />
			</li>
		</ul>
	);
}

type CancelButtonProps = {
	className: string;
	modalId: string;
};

function CancelButton({ className, modalId }: CancelButtonProps) {
	return (
		<button aria-controls={modalId} className={className} type="button">
			Annuler
		</button>
	);
}
