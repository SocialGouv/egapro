"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Controller } from "react-hook-form";
import { TrackedLink } from "~/modules/analytics";
import { useIsImpersonating } from "~/modules/auth";
import { saveCompliancePathSchema } from "~/modules/declaration-remuneration/schemas";
import { DraftLoadingState } from "~/modules/declaration-remuneration/shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { useDraftAutoSave } from "~/modules/declaration-remuneration/shared/draft/useDraftAutoSave";
import { useDraftHydration } from "~/modules/declaration-remuneration/shared/draft/useDraftHydration";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import {
	type CampaignDeadlines,
	formatLongDate,
	getPathChoiceRound1Deadline,
} from "~/modules/domain";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { scrollToTop } from "~/modules/shared/scrollToTop";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import common from "../shared/common.module.scss";
import { getPostComplianceDestination } from "../shared/complianceNavigation";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import { SavedIndicator } from "../shared/SavedIndicator";
import styles from "./CompliancePathChoice.module.scss";
import {
	FirstRoundOptions,
	getCompliancePathHref,
	SecondRoundOptions,
} from "./compliancePath/CompliancePathOptions";
import { CompliancePathReadOnlyAlert } from "./compliancePath/CompliancePathReadOnlyAlert";
import type {
	CompliancePathReadOnlyReason,
	CompliancePathValue,
} from "./compliancePath/constants";
import { DeclarationSuccessBanner } from "./compliancePath/DeclarationSuccessBanner";

type Props = {
	campaignDeadlines: CampaignDeadlines;
	currentYear: number;
	declarationSiren: string;
	declarationYear: number;
	cseOpinionRequired: boolean;
	email: string;
	initialPath?: CompliancePathValue;
	isSecondRound?: boolean;
	pdfDownloadHref?: string;
	readOnlyReason?: CompliancePathReadOnlyReason;
};

export function CompliancePathChoice({
	campaignDeadlines,
	cseOpinionRequired,
	currentYear,
	declarationSiren,
	declarationYear,
	email,
	initialPath,
	isSecondRound = false,
	pdfDownloadHref,
	readOnlyReason,
}: Props) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const { isReadOnly: isLockReadOnly } = useLockContext();
	const isReadOnly = isLockReadOnly || readOnlyReason !== undefined;

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

	useDraftAutoSave(form, draftHydrated && !isReadOnly, (values) =>
		setField(values as { path: CompliancePathValue | undefined }),
	);

	const selectedPath = form.watch("path");
	const hasInitialData = !!initialPath;
	const hasData = hasInitialData || hasDraft;

	// RouteScrollReset is silent on first render, so a reload still needs this: the browser restores scroll on the short placeholder before the form grows.
	useEffect(() => {
		if (draftHydrated) {
			scrollToTop();
		}
	}, [draftHydrated]);

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
				// "justify": when an opinion is due it remains to be deposited on
				// /avis-cse; otherwise the FSM already completed the démarche.
				router.push(getPostComplianceDestination(cseOpinionRequired));
			}
		},
	});

	if (!draftHydrated) return <DraftLoadingState />;

	const modificationDeadline = isSecondRound
		? campaignDeadlines.decl2ModificationDeadline
		: campaignDeadlines.decl1ModificationDeadline;
	const pathChoiceDeadline = isSecondRound
		? campaignDeadlines.pathChoiceDeadline
		: getPathChoiceRound1Deadline(currentYear);
	const gapNoticeText = isSecondRound
		? "Des écarts ≥ 5 % ont de nouveau été détectés, vous devez engager l'un des parcours suivants."
		: "Des écarts ≥ 5 % ont été constatés, vous devez engager l'un des parcours suivants.";

	const onSubmit = form.handleSubmit((data) => {
		if (isReadOnly || !data.path) return;
		mutation.mutate({ path: data.path });
	});

	return (
		<form autoComplete="off" onSubmit={onSubmit}>
			{/* Read-only mode is enforced per control (disabled radios and submit
			    button): a fieldset-level `disabled` would hide the content from
			    some assistive technologies (#3803). */}
			{/* The rhythm class sits on the fieldset: it is the form's only child, so
			    a gap on the form would never apply. */}
			<fieldset className={`${common.readOnlyFieldset} ${styles.screen}`}>
				<legend className="fr-sr-only">Choix du parcours de conformité</legend>
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
					modificationDeadline={modificationDeadline}
					pdfDownloadHref={pdfDownloadHref}
					year={currentYear}
				/>

				{readOnlyReason ? (
					<CompliancePathReadOnlyAlert reason={readOnlyReason} />
				) : null}

				<h2 className="fr-h4 fr-mb-0">
					Parcours de mise en conformité pour l&apos;indicateur par catégorie
					de&nbsp;salariés
				</h2>

				<div className={common.flexColumnGap1}>
					<p className={`fr-mb-0 ${styles.instructions}`}>{gapNoticeText}</p>

					<div className="fr-highlight fr-mb-0">
						<p className="fr-mb-1w">
							Date limite pour choisir un parcours de mise en conformité
						</p>
						<p className="fr-text--xl fr-text--bold fr-mb-0">
							{formatLongDate(pathChoiceDeadline)}
						</p>
					</div>
				</div>

				<div className={common.dataSection}>
					<div className={common.flexColumnGapHalf}>
						<h3 className="fr-h6 fr-mb-0">
							La justification est possible par des critères objectifs et non
							sexistes
						</h3>
						<p className="fr-mb-0">
							<TrackedLink
								className="fr-link"
								href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
								rel="noopener noreferrer"
								target="_blank"
								trackingId="objective_criteria"
							>
								Qu&apos;entend-on par critères objectifs et non sexistes ?
								<NewTabNotice />
							</TrackedLink>
						</p>
					</div>

					<Controller
						control={form.control}
						name="path"
						render={({ field }) => (
							<fieldset
								aria-labelledby="compliance-path-legend"
								className={`fr-fieldset ${styles.pathFieldset}`}
							>
								<legend className="fr-sr-only" id="compliance-path-legend">
									Choix du parcours de mise en conformité
								</legend>

								{isSecondRound ? (
									<SecondRoundOptions
										cseOpinionRequired={cseOpinionRequired}
										disabled={isImpersonating || isReadOnly}
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
										cseOpinionRequired={cseOpinionRequired}
										disabled={isImpersonating || isReadOnly}
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
				</div>

				<FormErrors mutationError={mutation.error?.message} />

				<FormActions
					isSubmitting={mutation.isPending}
					mimoquageNextHref={
						initialPath
							? getCompliancePathHref(initialPath, cseOpinionRequired)
							: undefined
					}
					nextDisabled={!selectedPath || isReadOnly}
					nextHref={
						isReadOnly && initialPath
							? getCompliancePathHref(initialPath, cseOpinionRequired)
							: undefined
					}
					nextLabel="Suivant"
					previousHref="/declaration-remuneration/etape/6"
				/>
			</fieldset>
		</form>
	);
}
