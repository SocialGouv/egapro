"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Controller } from "react-hook-form";
import { useIsImpersonating } from "~/modules/auth";
import { saveCompliancePathSchema } from "~/modules/declaration-remuneration/schemas";
import { DraftLoadingState } from "~/modules/declaration-remuneration/shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { useDraftAutoSave } from "~/modules/declaration-remuneration/shared/draft/useDraftAutoSave";
import { useDraftHydration } from "~/modules/declaration-remuneration/shared/draft/useDraftHydration";
import type { CampaignDeadlines } from "~/modules/domain";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import common from "../shared/common.module.scss";
import { FormActions } from "../shared/FormActions";
import { SavedIndicator } from "../shared/SavedIndicator";
import {
	FirstRoundOptions,
	getCompliancePathHref,
	SecondRoundOptions,
} from "./compliancePath/CompliancePathOptions";
import type { CompliancePathValue } from "./compliancePath/constants";
import { DeclarationSuccessBanner } from "./compliancePath/DeclarationSuccessBanner";

type Props = {
	campaignDeadlines: CampaignDeadlines;
	currentYear: number;
	declarationSiren: string;
	declarationYear: number;
	email: string;
	initialPath?: CompliancePathValue;
	isSecondRound?: boolean;
	pdfDownloadHref?: string;
};

export function CompliancePathChoice({
	campaignDeadlines,
	currentYear,
	declarationSiren,
	declarationYear,
	email,
	initialPath,
	isSecondRound = false,
	pdfDownloadHref,
}: Props) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();

	const dbValues = useMemo(() => ({ path: initialPath }), [initialPath]);

	const {
		draft,
		setField,
		clearDraft,
		hasDraft,
		isLoadingDraft,
		isSaving,
		isPendingSave,
	} = useDeclarationDraft({
		siren: declarationSiren,
		year: declarationYear,
		step: "compliance",
		kind: "compliance",
		dbValues,
	});

	const form = useZodForm(saveCompliancePathSchema, {
		defaultValues: { path: initialPath },
	});

	const draftHydrated = useDraftHydration(isLoadingDraft, draft, (d) => {
		if (d.path !== undefined) {
			form.setValue("path", d.path as CompliancePathValue);
		}
	});

	useDraftAutoSave(form, draftHydrated, (values) =>
		setField(values as { path: CompliancePathValue | undefined }),
	);

	const selectedPath = form.watch("path");
	const hasInitialData = !!initialPath;
	const hasData = hasInitialData || hasDraft;

	const mutation = api.declaration.saveCompliancePath.useMutation({
		onSuccess: (_, { path }) => {
			clearDraft();
			if (path === "corrective_action") {
				router.push("/declaration-remuneration/parcours-conformite/etape/1");
			} else if (path === "joint_evaluation") {
				router.push(
					"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
				);
			} else {
				router.push("/avis-cse");
			}
		},
	});

	if (!draftHydrated) return <DraftLoadingState />;

	const onSubmit = form.handleSubmit((data) => {
		if (!data.path) return;
		mutation.mutate({ path: data.path });
	});

	return (
		<form className={common.flexColumnGap2} onSubmit={onSubmit}>
			<div className={common.flexBetween}>
				<h1 className="fr-h4 fr-mb-0">
					Déclaration des indicateurs de rémunération {currentYear}
				</h1>
				<SavedIndicator
					hasData={hasData}
					isPendingSave={isPendingSave}
					isSaving={isSaving}
				/>
			</div>

			<DeclarationSuccessBanner
				email={email}
				isSecondDeclaration={isSecondRound}
				modificationDeadline={
					isSecondRound
						? campaignDeadlines.decl2ModificationDeadline
						: campaignDeadlines.decl1ModificationDeadline
				}
				pdfDownloadHref={pdfDownloadHref}
				year={currentYear}
			/>

			<h2 className="fr-h4 fr-mb-0">
				Parcours de mise en conformité pour l&apos;indicateur par catégorie de
				salariés
			</h2>

			<p className="fr-mb-0">
				Des écarts ≥ 5 % ont été constatés,{" "}
				<span className="fr-text--medium">
					vous devez engager l&apos;un des parcours suivants.
				</span>
			</p>

			<div className={common.flexColumnGap1}>
				<h3 className="fr-h6 fr-mb-0">
					La justification est possible par des critères objectifs et non
					sexistes
				</h3>
				<p className="fr-mb-0">
					<a
						className="fr-link"
						href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
						rel="noopener noreferrer"
						target="_blank"
					>
						Qu&apos;entend-on par critères objectifs et non sexistes ?
						<NewTabNotice />
					</a>
				</p>
			</div>

			<Controller
				control={form.control}
				name="path"
				render={({ field }) => (
					<fieldset
						aria-labelledby="compliance-path-legend"
						className="fr-fieldset"
					>
						<legend className="fr-sr-only" id="compliance-path-legend">
							Choix du parcours de mise en conformité
						</legend>

						{isSecondRound ? (
							<SecondRoundOptions
								disabled={isImpersonating}
								jointEvaluationDeadline={
									campaignDeadlines.decl2JointEvaluationDeadline
								}
								justificationDeadline={
									campaignDeadlines.decl2JustificationDeadline
								}
								selectedPath={field.value}
								setSelectedPath={field.onChange}
							/>
						) : (
							<FirstRoundOptions
								correctiveActionDeadline={
									campaignDeadlines.decl2ModificationDeadline
								}
								disabled={isImpersonating}
								jointEvaluationDeadline={
									campaignDeadlines.decl1JointEvaluationDeadline
								}
								justificationDeadline={
									campaignDeadlines.decl1JustificationDeadline
								}
								selectedPath={field.value}
								setSelectedPath={field.onChange}
							/>
						)}
					</fieldset>
				)}
			/>

			<FormActions
				isSubmitting={mutation.isPending}
				mimoquageNextHref={
					initialPath ? getCompliancePathHref(initialPath) : undefined
				}
				nextDisabled={!selectedPath}
				nextLabel="Suivant"
				previousHref="/declaration-remuneration/etape/6"
			/>
		</form>
	);
}
