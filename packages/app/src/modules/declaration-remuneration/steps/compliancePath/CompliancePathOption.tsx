import type { ReactNode } from "react";

import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";

type Props = {
	id: string;
	name: string;
	value: string;
	checked: boolean;
	onChange: (value: string) => void;
	title: string;
	children: ReactNode;
	deadline: string;
	learnMoreHref?: string;
	learnMoreLabel?: string;
	disabled?: boolean;
};

export function CompliancePathOption({
	id,
	name,
	value,
	checked,
	onChange,
	title,
	children,
	deadline,
	learnMoreHref,
	learnMoreLabel,
	disabled = false,
}: Props) {
	return (
		<div className="fr-border fr-p-2w fr-border-radius--s">
			<div className="fr-radio-group">
				<input
					checked={checked}
					disabled={disabled}
					id={id}
					name={name}
					onChange={() => onChange(value)}
					type="radio"
					value={value}
				/>
				<label className="fr-label fr-text--bold fr-h6 fr-mb-0" htmlFor={id}>
					{title}
				</label>
			</div>
			<div className="fr-mt-2w fr-pl-4w">
				{children}
				<p className="fr-text--sm fr-mb-1w fr-mt-2w">
					<span
						aria-hidden="true"
						className="fr-icon-calendar-line fr-icon--sm fr-mr-1w"
					/>
					Échéance au {deadline}
				</p>
				{learnMoreHref && (
					<a
						className="fr-link fr-text--sm"
						href={learnMoreHref}
						rel="noopener noreferrer"
						target="_blank"
					>
						{learnMoreLabel ?? "En savoir plus"}
						<NewTabNotice />
					</a>
				)}
			</div>
		</div>
	);
}
