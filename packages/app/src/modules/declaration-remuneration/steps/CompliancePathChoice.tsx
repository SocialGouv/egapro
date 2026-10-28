"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { TrackedLink } from "~/modules/analytics";
import { useIsImpersonating } from "~/modules/auth";
import { compliancePathFormSchema } from "~/modules/declaration-remuneration/schemas";
import { DraftLoadingState } from "~/modules/declaration-remuneration/shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { useDraftAutoSave } from "~/modules/declaration-remuneration/shared/draft/useDraftAutoSave";
import { useDraftHydration } from "~/modules/declaration-remuneration/shared/draft/useDraftHydration";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import type { CompliancePathReadOnlyReason } from "~/modules/domain";
import {
	type CampaignDeadlines,
	type CompliancePathValue,
	type ComplianceRound,
	compliancePathsForGapJustification,
	formatCivilLongDate,
	type GapJustification,
	gapJustificationFromPath,
	selectPathChoiceDeadline,
} from "~/modules/domain";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { getCompliancePathHref } from "~/modules/navigation";
import { scrollToTop } from "~/modules/shared/scrollToTop";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import common from "../shared/common.module.scss";
import { consumeDeclarationTransmissionSuccess } from "../shared/declarationSuccessFlash";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import { SavedIndicator } from "../shared/SavedIndicator";
import styles from "./CompliancePathChoice.module.scss";
import {
	CompliancePathOptions,
	GAP_JUSTIFICATION_TITLES,
	GapJustificationOptions,
} from "./compliancePath/CompliancePathOptions";
import { CompliancePathReadOnlyAlert } from "./compliancePath/CompliancePathReadOnlyAlert";
import { DeclarationSuccessBanner } from "./compliancePath/DeclarationSuccessBanner";

type Props = {
	campaignDeadlines: CampaignDeadlines;
	currentYear: number;
	declarationModifiable: boolean;
	declarationSiren: string;
	declarationYear: number;
	cseOpinionRequired: boolean;
	email: string;
	initialPath?: CompliancePathValue;
	isSecondRound?: boolean;
	pdfDownloadHref?: string;
	readOnlyReason?: CompliancePathReadOnlyReason;
};

type Screen = "justification" | "path";

const COMPLIANCE_TITLE = (
	<>
		Parcours de mise en conformité pour l&apos;indicateur par
		catégorie&nbsp;d&apos;emplois
	</>
);

export function CompliancePathChoice({
	campaignDeadlines,
	cseOpinionRequired,
	currentYear,
	declarationModifiable,
	declarationSiren,
	declarationYear,
	email,
	initialPath,
	isSecondRound = false,
	pdfDownloadHref,
	readOnlyReason,
}: Props) {
	const router = useRouter();
	const consumedTransmissionSuccess = useRef(false);
	const [showTransmissionSuccess, setShowTransmissionSuccess] = useState(false);
	const [screen, setScreen] = useState<Screen>("justification");
	const titleRef = useRef<HTMLHeadingElement>(null);
	const isTitleFocusPending = useRef(false);
	const isImpersonating = useIsImpersonating();
	const { isReadOnly: isLockReadOnly } = useLockContext();
	const isReadOnly = isLockReadOnly || readOnlyReason !== undefined;
	const round: ComplianceRound = isSecondRound ? 2 : 1;
	const initialJustification = gapJustificationFromPath(initialPath);

	const dbValues = useMemo(
		() => ({ gapJustification: initialJustification, path: initialPath }),
		[initialJustification, initialPath],
	);

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

	const form = useZodForm(compliancePathFormSchema, {
		defaultValues: {
			gapJustification: initialJustification,
			path: initialPath,
		},
	});

	const draftHydrated = useDraftHydration(isLoadingDraft, draft, (d) => {
		if (d.gapJustification !== undefined) {
			form.setValue("gapJustification", d.gapJustification as GapJustification);
		}
		if (d.path !== undefined) {
			form.setValue("path", d.path as CompliancePathValue);
		}
	});

	useDraftAutoSave(form, draftHydrated && !isReadOnly, (values) =>
		setField({ gapJustification: values.gapJustification, path: values.path }),
	);

	const selectedJustification = form.watch("gapJustification");
	const selectedPath = form.watch("path");
	const hasInitialData = !!initialPath;
	const hasData = hasInitialData || hasDraft;

	// RouteScrollReset is silent on first render, so a reload still needs this: the browser restores scroll on the short placeholder before the form grows.
	useEffect(() => {
		if (draftHydrated) {
			scrollToTop();
		}
	}, [draftHydrated]);

	useEffect(() => {
		if (consumedTransmissionSuccess.current) return;
		consumedTransmissionSuccess.current = true;
		setShowTransmissionSuccess(consumeDeclarationTransmissionSuccess());
	}, []);

	useEffect(() => {
		if (!isTitleFocusPending.current) return;
		isTitleFocusPending.current = false;
		scrollToTop();
		titleRef.current?.focus();
	});

	const mutation = api.declaration.saveCompliancePath.useMutation({
		onSuccess: (_, { path }) => {
			clearDraft();
			router.push(getCompliancePathHref(path, cseOpinionRequired));
		},
	});

	if (!draftHydrated) return <DraftLoadingState />;

	const showScreen = (next: Screen) => {
		isTitleFocusPending.current = true;
		setScreen(next);
	};

	const savedPathHref = initialPath
		? getCompliancePathHref(initialPath, cseOpinionRequired)
		: undefined;
	const offeredPaths = compliancePathsForGapJustification(
		selectedJustification ?? initialJustification ?? "none",
		round,
	);
	const readOnlyGoesThroughPathScreen =
		screen === "justification" &&
		initialPath !== undefined &&
		compliancePathsForGapJustification(initialJustification ?? "none", round)
			.length > 1;
	const disabled = isImpersonating || isReadOnly;

	const onSubmit = form.handleSubmit((data) => {
		if (isReadOnly) return;
		const paths = compliancePathsForGapJustification(
			data.gapJustification,
			round,
		);
		if (screen === "justification" && paths.length > 1) {
			showScreen("path");
			return;
		}
		const path = paths.length === 1 ? paths[0] : data.path;
		if (!path || !paths.includes(path)) return;
		mutation.mutate({ path });
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
					<h1 className="fr-h4 fr-mb-0" ref={titleRef} tabIndex={-1}>
						{screen === "justification" && !isSecondRound ? (
							<>Déclaration des indicateurs de rémunération {currentYear}</>
						) : (
							COMPLIANCE_TITLE
						)}
					</h1>
					<SavedIndicator
						hasData={hasData}
						isPendingSave={isPendingSave}
						isSaving={isSaving}
					/>
				</div>

				{screen === "justification" && showTransmissionSuccess && (
					<DeclarationSuccessBanner
						declarationModifiable={declarationModifiable}
						email={email}
						isSecondDeclaration={isSecondRound}
						pdfDownloadHref={pdfDownloadHref}
						year={currentYear}
					/>
				)}

				{readOnlyReason ? (
					<CompliancePathReadOnlyAlert reason={readOnlyReason} />
				) : null}

				{screen === "justification" ? (
					<>
						{!isSecondRound && (
							<h2 className="fr-h4 fr-mb-0">{COMPLIANCE_TITLE}</h2>
						)}

						<div className={common.flexColumnGap1}>
							<p className={`fr-mb-0 ${styles.instructions}`}>
								{isSecondRound
									? "Des écarts ≥ 5 % ont de nouveau été constatés, indiquez si ces écarts peuvent être justifiés par des critères objectifs et non fondés sur le sexe."
									: "Des écarts ≥ 5 % ont été constatés, indiquez si ces écarts peuvent être justifiés par des critères objectifs et non fondés sur le sexe."}
							</p>

							<div className="fr-highlight fr-mb-0">
								<p className="fr-mb-1w">
									Date limite pour choisir l&apos;un des parcours ci-dessous.
								</p>
								<p className="fr-text--xl fr-text--bold fr-mb-0">
									{formatCivilLongDate(
										selectPathChoiceDeadline(campaignDeadlines, isSecondRound),
									)}
								</p>
							</div>
						</div>

						<div className={common.dataSection}>
							<p className="fr-mb-0">
								<TrackedLink
									className="fr-link"
									href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
									rel="noopener noreferrer"
									target="_blank"
									trackingId="objective_criteria"
								>
									Qu&apos;entend-on par critères objectifs et non fondés sur le
									sexe ?
									<NewTabNotice />
								</TrackedLink>
							</p>

							<Controller
								control={form.control}
								name="gapJustification"
								render={({ field }) => (
									<fieldset
										aria-labelledby="gap-justification-legend"
										className={`fr-fieldset ${styles.pathFieldset}`}
									>
										<legend
											className="fr-sr-only"
											id="gap-justification-legend"
										>
											Justification des écarts de rémunération ≥ 5 %
										</legend>
										<GapJustificationOptions
											cseOpinionRequired={cseOpinionRequired}
											disabled={disabled}
											jointEvaluationDeadline={
												campaignDeadlines.decl2JointEvaluationDeadline
											}
											onSelect={field.onChange}
											round={round}
											selected={field.value}
										/>
									</fieldset>
								)}
							/>
						</div>
					</>
				) : (
					<div className={common.dataSection}>
						{selectedJustification && (
							<h2 className="fr-h4 fr-mb-0">
								{GAP_JUSTIFICATION_TITLES[selectedJustification]}
							</h2>
						)}

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
									<CompliancePathOptions
										correctiveActionDeadline={
											campaignDeadlines.decl2ModificationDeadline
										}
										cseOpinionRequired={cseOpinionRequired}
										disabled={disabled}
										jointEvaluationDeadline={
											campaignDeadlines.decl1JointEvaluationDeadline
										}
										onSelect={field.onChange}
										paths={offeredPaths}
										selectedPath={field.value}
									/>
								</fieldset>
							)}
						/>
					</div>
				)}

				<FormErrors mutationError={mutation.error?.message} />

				{screen === "justification" ? (
					<FormActions
						className="fr-mt-0"
						isSubmitting={mutation.isPending}
						mimoquageNextHref={
							readOnlyGoesThroughPathScreen ? undefined : savedPathHref
						}
						nextDisabled={!selectedJustification || isReadOnly}
						nextHref={
							isReadOnly && !readOnlyGoesThroughPathScreen
								? savedPathHref
								: undefined
						}
						nextLabel="Suivant"
						onNext={
							isReadOnly && readOnlyGoesThroughPathScreen
								? () => showScreen("path")
								: undefined
						}
					/>
				) : (
					<FormActions
						className="fr-mt-0"
						isSubmitting={mutation.isPending}
						mimoquageNextHref={savedPathHref}
						nextDisabled={
							!selectedPath ||
							!offeredPaths.includes(selectedPath) ||
							isReadOnly
						}
						nextHref={isReadOnly ? savedPathHref : undefined}
						nextLabel="Suivant"
						onPrevious={() => showScreen("justification")}
					/>
				)}
			</fieldset>
		</form>
	);
}
