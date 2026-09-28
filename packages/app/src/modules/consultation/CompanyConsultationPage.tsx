import { notFound } from "next/navigation";
import { env } from "~/env.js";
import { GAP_ALERT_THRESHOLD, getReferencePeriod } from "~/modules/domain";
import {
	getPublicDeclarationsBySiren,
	getPublicRepresentationsBySiren,
	NON_DIFFUSIBLE_LABEL,
} from "~/modules/public-api";
import { JsonLd } from "~/modules/shared/JsonLd";
import { CompanyHeader } from "./CompanyHeader";
import { MAX_HISTORY_YEARS } from "./constants";
import { RemunerationTab } from "./RemunerationTab";
import { RepresentationTab } from "./RepresentationTab";
import { backToSearchHref } from "./searchParams";
import { companyPageStructuredData } from "./structuredData";
import { YearSelector } from "./YearSelector";

type Props = { siren: string; selectedYear?: number; from?: string };

const TABS = [
	{ id: "remuneration", label: "Rémunération" },
	{ id: "representation", label: "Représentation" },
] as const;

export async function CompanyConsultationPage({
	siren,
	selectedYear,
	from,
}: Props) {
	const [declarations, representations] = await Promise.all([
		getPublicDeclarationsBySiren(siren, MAX_HISTORY_YEARS),
		getPublicRepresentationsBySiren(siren, MAX_HISTORY_YEARS),
	]);

	// A company may have published only one of the two declarations for a given
	// year, so the year list is the union — picking it from either alone would
	// hide a year the other tab can show.
	const years = [
		...new Set([
			...declarations.map((item) => item.year),
			...representations.map((item) => item.year),
		]),
	].sort((left, right) => right - left);
	if (years.length === 0) notFound();

	const year =
		selectedYear !== undefined && years.includes(selectedYear)
			? selectedYear
			: (years[0] as number);
	const declaration = declarations.find((item) => item.year === year) ?? null;
	const representation =
		representations.find((item) => item.year === year) ?? null;
	const identity = declaration ?? representation;
	if (!identity) notFound();

	// City and country live on the declaration only; a company does not move, so
	// the latest one answers for a year that published a representation alone.
	const located = declarations[0] ?? null;
	const location = {
		city: located?.city ?? null,
		countryCode: located?.countryCode ?? null,
		countryLabel: located?.countryLabel ?? null,
		departmentLabel: identity.departmentLabel,
		region: identity.region,
	};

	const referencePeriod =
		representation?.referencePeriodStart && representation.referencePeriodEnd
			? `${formatIsoDate(representation.referencePeriodStart)} - ${formatIsoDate(representation.referencePeriodEnd)}`
			: getReferencePeriod(year);

	return (
		<main id="content" tabIndex={-1}>
			<JsonLd
				data={companyPageStructuredData(
					{
						...location,
						name: identity.name,
						nafLabel: identity.nafLabel,
						siren,
						workforceEma: declaration?.workforceEma ?? null,
						year,
					},
					new URL(env.NEXTAUTH_URL).origin,
					identity.name === NON_DIFFUSIBLE_LABEL,
				)}
			/>
			<CompanyHeader
				address={identity.address}
				backHref={backToSearchHref(from)}
				countryCode={location.countryCode}
				countryLabel={location.countryLabel}
				departmentLabel={location.departmentLabel}
				nafCode={identity.nafCode}
				nafLabel={identity.nafLabel}
				name={identity.name}
				region={location.region}
				siren={siren}
				workforceEma={declaration?.workforceEma ?? null}
				year={year}
			/>
			<div className="fr-container fr-py-4w">
				<div className="fr-tabs">
					{/* DSFR keys its tab runtime off `.fr-tabs__list`, not off a list
					    element, so the strip is a plain container: `role="tablist"` on a
					    `<ul>` overrides the list semantics it would otherwise announce. */}
					<div
						aria-label="Type d’indicateurs"
						className="fr-tabs__list"
						role="tablist"
					>
						{TABS.map((tab, index) => (
							<button
								aria-controls={`${tab.id}-panel`}
								aria-selected={index === 0}
								className="fr-tabs__tab"
								id={tab.id}
								key={tab.id}
								role="tab"
								tabIndex={index === 0 ? 0 : -1}
								type="button"
							>
								{tab.label}
							</button>
						))}
					</div>
					<div
						aria-labelledby="remuneration"
						className="fr-tabs__panel fr-tabs__panel--selected"
						id="remuneration-panel"
						role="tabpanel"
					>
						<YearSelector
							from={from}
							id="remuneration"
							referencePeriod={referencePeriod}
							selectedYear={year}
							siren={siren}
							years={years}
						/>
						{declaration ? (
							<RemunerationTab
								declaration={declaration}
								threshold={`Seuil réglementaire : ${GAP_ALERT_THRESHOLD} %`}
							/>
						) : (
							<div className="fr-alert fr-alert--info fr-mt-3w">
								<h3 className="fr-alert__title">
									Aucune déclaration de rémunération pour {year}
								</h3>
								<p>
									Cette entreprise n’a pas publié d’indicateurs de rémunération
									pour cette année.
								</p>
							</div>
						)}
					</div>
					<div
						aria-labelledby="representation"
						className="fr-tabs__panel"
						id="representation-panel"
						role="tabpanel"
					>
						<YearSelector
							from={from}
							id="representation"
							referencePeriod={referencePeriod}
							selectedYear={year}
							siren={siren}
							years={years}
						/>
						<RepresentationTab representation={representation} year={year} />
					</div>
				</div>
			</div>
		</main>
	);
}

/** `YYYY-MM-DD` from the database to the `DD/MM/YYYY` the maquette shows. */
function formatIsoDate(value: string): string {
	const [year, month, day] = value.split("-");
	return day && month && year ? `${day}/${month}/${year}` : value;
}
