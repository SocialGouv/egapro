export const BUTTONS_GROUP_CLASS =
	"fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg";

type Props = {
	backLabel: string;
	canConfirm?: boolean;
	confirmLabel: string;
	isPending?: boolean;
	onBack: () => void;
	onCancel: () => void;
	onConfirm: () => void;
};

export function ConfirmStepActions({
	backLabel,
	canConfirm = true,
	confirmLabel,
	isPending = false,
	onBack,
	onCancel,
	onConfirm,
}: Props) {
	return (
		<ul className={BUTTONS_GROUP_CLASS}>
			{canConfirm && (
				<li>
					<button
						aria-disabled={isPending || undefined}
						className="fr-btn fr-btn--primary"
						onClick={onConfirm}
						type="button"
					>
						{confirmLabel}
					</button>
				</li>
			)}
			<li>
				<button
					aria-disabled={isPending || undefined}
					className="fr-btn fr-btn--secondary"
					onClick={onBack}
					type="button"
				>
					{backLabel}
				</button>
			</li>
			<li>
				<button
					className="fr-btn fr-btn--tertiary"
					onClick={onCancel}
					type="button"
				>
					Annuler
				</button>
			</li>
		</ul>
	);
}
