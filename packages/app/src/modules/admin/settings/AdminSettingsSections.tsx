"use client";

import { useState } from "react";

import { FIRST_DECLARATION_YEAR, getCurrentYear } from "~/modules/domain";
import { api } from "~/trpc/react";

import { CommonCalendarForm } from "./CommonCalendarForm";
import { LockTimeoutForm } from "./LockTimeoutForm";
import { RemunerationDeadlinesForm } from "./RemunerationDeadlinesForm";
import { RepresentationCampaignForm } from "./RepresentationCampaignForm";

type Props = {
	initialYear: number;
	configuredYears: number[];
	lockTimeoutMinutes: number;
};

export function AdminSettingsSections({
	initialYear,
	configuredYears,
	lockTimeoutMinutes,
}: Props) {
	const [year, setYear] = useState<number>(initialYear);

	const overviewQuery = api.adminSettings.getOverview.useQuery(undefined, {
		initialData: { configuredYears },
	});
	const yearOptions = buildYearOptions(overviewQuery.data.configuredYears);

	return (
		<>
			<div className="fr-select-group fr-mt-4w">
				<label className="fr-label" htmlFor="campaign-year-selector">
					Année de campagne
					<span className="fr-hint-text">
						Les blocs annuels ci-dessous — calendrier commun, échéances
						Rémunération, campagne Représentation — portent sur l'année
						sélectionnée.
					</span>
				</label>
				<select
					className="fr-select"
					id="campaign-year-selector"
					onChange={(e) => setYear(Number(e.target.value))}
					value={year}
				>
					{yearOptions.map((option) => (
						<option key={option.year} value={option.year}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<section aria-labelledby="common-settings-heading" className="fr-mt-6w">
				<h2 className="fr-h3" id="common-settings-heading">
					Paramètres communs
				</h2>
				<section aria-labelledby="common-calendar-heading">
					<h3 className="fr-h5" id="common-calendar-heading">
						Calendrier de la campagne {year}
					</h3>
					<CommonCalendarForm key={year} year={year} />
				</section>
			</section>

			<section
				aria-labelledby="remuneration-settings-heading"
				className="fr-mt-6w"
			>
				<h2 className="fr-h3" id="remuneration-settings-heading">
					Démarche Rémunération
				</h2>
				<section aria-labelledby="remuneration-deadlines-heading">
					<h3 className="fr-h5" id="remuneration-deadlines-heading">
						Échéances de la campagne {year}
					</h3>
					<RemunerationDeadlinesForm key={year} year={year} />
				</section>
				<section aria-labelledby="lock-timeout-heading" className="fr-mt-4w">
					<h3 className="fr-h5" id="lock-timeout-heading">
						Verrou de déclaration
					</h3>
					<LockTimeoutForm initialTimeoutMinutes={lockTimeoutMinutes} />
				</section>
			</section>

			<section
				aria-labelledby="representation-settings-heading"
				className="fr-mt-6w"
			>
				<h2 className="fr-h3" id="representation-settings-heading">
					Démarche Représentation équilibrée
				</h2>
				<section aria-labelledby="representation-campaign-heading">
					<h3 className="fr-h5" id="representation-campaign-heading">
						Campagne {year}
					</h3>
					<RepresentationCampaignForm key={year} year={year} />
				</section>
			</section>
		</>
	);
}

function buildYearOptions(
	configuredYears: readonly number[],
): Array<{ year: number; label: string }> {
	const max = getCurrentYear() + 10;
	const configured = new Set(configuredYears);
	const years: Array<{ year: number; label: string }> = [];
	for (let y = FIRST_DECLARATION_YEAR; y <= max; y++) {
		years.push({
			year: y,
			label: configured.has(y) ? String(y) : `${y} (non configurée)`,
		});
	}
	return years;
}
