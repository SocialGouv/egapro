"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { useIsImpersonating, useReadOnlyGuard } from "~/modules/auth";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { SavedIndicator } from "~/modules/declaration-remuneration/shared/SavedIndicator";
import { cseOpinionStepHref } from "~/modules/routes";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionCard } from "./components/OpinionCard";
import { SubmissionBanner } from "./components/SubmissionBanner";
import { DECLARATION_HEADINGS, getOpinionTitle } from "./contentTypeColumns";
import {
	buildOpinionsFormValues,
	hydrateOpinionsForm,
	isJustificationOpinionIncomplete,
	type JustificationRequirements,
	normalizeSubmittedOpinions,
} from "./opinionsFormValues";
import styles from "./Step1Opinions.module.scss";
import { saveOpinionsSchema } from "./schemas";
import formStyles from "./shared/formActions.module.scss";
import layoutStyles from "./shared/stepLayout.module.scss";
import type { SubmissionBannerState } from "./submissionBanner";
import type {
	CseOpinionStep1Data,
	DeclarationNumber,
	OpinionType,
} from "./types";

type DeclarationOpinionDraftValue = {
	accuracyOpinion?: OpinionType;
	accuracyDate?: string;
	gapOpinion?: OpinionType | null;
	gapDate?: string | null;
};

type OpinionsDraftValues = {
	firstDeclaration: DeclarationOpinionDraftValue;
	secondDeclaration?: DeclarationOpinionDraftValue;
};

type DeclarationKey = "firstDeclaration" | "secondDeclaration";

const DECLARATION_KEYS: Record<DeclarationNumber, DeclarationKey> = {
	1: "firstDeclaration",
	2: "secondDeclaration",
};

const CARD_ID_PREFIXES: Record<DeclarationNumber, string> = {
	1: "first-decl",
	2: "second-decl",
};

const PAGE_TITLE = "Transmission du ou des avis du CSE";

type Props = {
	banner?: SubmissionBannerState;
	cseDeadline: Date;
	email?: string;
	firstDeclJustificationRequired: boolean;
	hasSecondDeclaration: boolean;
	initialData?: CseOpinionStep1Data;
	secondDeclJustificationRequired: boolean;
	siren: string;
	year: number;
};

export function Step1Opinions({
	banner = null,
	cseDeadline,
	email,
	firstDeclJustificationRequired,
	hasSecondDeclaration,
	initialData,
	secondDeclJustificationRequired,
	siren,
	year,
}: Props) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const readOnlyGuard = useReadOnlyGuard();
	const { isReadOnly } = useLockContext();

	const requirements = useMemo<JustificationRequirements>(
		() => ({ firstDeclJustificationRequired, secondDeclJustificationRequired }),
		[firstDeclJustificationRequired, secondDeclJustificationRequired],
	);
	const justificationRequired: Record<DeclarationNumber, boolean> = {
		1: firstDeclJustificationRequired,
		2: secondDeclJustificationRequired,
	};

	const initialFormValues = useMemo(
		() =>
			buildOpinionsFormValues(initialData, hasSecondDeclaration, requirements),
		[hasSecondDeclaration, initialData, requirements],
	);

	const { draft, setField, hasDraft, isLoadingDraft, isSaving, isPendingSave } =
		useDeclarationDraft<OpinionsDraftValues>({
			siren,
			year,
			step: "opinions",
			kind: "cse",
			dbValues: initialFormValues,
		});

	const form = useZodForm(saveOpinionsSchema, {
		defaultValues: initialFormValues,
	});

	useEffect(() => {
		if (isLoadingDraft) return;
		hydrateOpinionsForm(
			form.setValue,
			draft,
			hasSecondDeclaration,
			requirements,
		);
	}, [isLoadingDraft, draft, form, hasSecondDeclaration, requirements]);

	const triggerDraftSave = useCallback(() => {
		if (isReadOnly) return;
		const values = normalizeSubmittedOpinions(form.getValues(), requirements);
		setField({
			firstDeclaration: values.firstDeclaration,
			secondDeclaration: values.secondDeclaration,
		});
	}, [form, isReadOnly, requirements, setField]);

	const mutation = api.cseOpinion.saveOpinions.useMutation({
		onSuccess: () => router.push(cseOpinionStepHref(2)),
	});

	const declarationNumbers: DeclarationNumber[] = hasSecondDeclaration
		? [1, 2]
		: [1];

	const onSubmit = form.handleSubmit((data) => {
		const submittedData = normalizeSubmittedOpinions(data, requirements);
		const incomplete = declarationNumbers.find((declarationNumber) =>
			isJustificationOpinionIncomplete(
				submittedData[DECLARATION_KEYS[declarationNumber]],
				justificationRequired[declarationNumber],
			),
		);
		if (incomplete) {
			form.setError(`${DECLARATION_KEYS[incomplete]}.gapOpinion`, {
				message: "Veuillez remplir tous les champs obligatoires.",
			});
			return;
		}

		mutation.mutate(submittedData);
	});

	const values = form.watch();

	if (isLoadingDraft) {
		return <p>Chargement...</p>;
	}

	const DeclarationHeading = banner ? "h3" : "h2";

	const renderCard = (
		declarationNumber: DeclarationNumber,
		type: "accuracy" | "gap",
	) => {
		const key = DECLARATION_KEYS[declarationNumber];
		const declaration = values[key];
		const isAccuracy = type === "accuracy";
		return (
			<OpinionCard
				date={
					(isAccuracy ? declaration?.accuracyDate : declaration?.gapDate) ?? ""
				}
				id={`${CARD_ID_PREFIXES[declarationNumber]}-${type}`}
				key={type}
				onDateChange={(value) => {
					form.setValue(
						isAccuracy ? `${key}.accuracyDate` : `${key}.gapDate`,
						value,
					);
					triggerDraftSave();
				}}
				onOpinionChange={(value) => {
					form.setValue(
						isAccuracy ? `${key}.accuracyOpinion` : `${key}.gapOpinion`,
						value,
					);
					triggerDraftSave();
				}}
				opinion={
					(isAccuracy
						? declaration?.accuracyOpinion
						: declaration?.gapOpinion) ?? null
				}
				readOnly={isReadOnly}
				title={getOpinionTitle(declarationNumber, type)}
			/>
		);
	};

	return (
		<form autoComplete="off" noValidate onSubmit={onSubmit}>
			<fieldset className={`${styles.readOnlyFieldset} ${layoutStyles.screen}`}>
				<legend className="fr-sr-only">Avis du CSE</legend>
				<div className={layoutStyles.titleRow}>
					<h1 className="fr-h4 fr-mb-0">
						{banner
							? "Parcours de mise en conformité pour l'indicateur par catégorie d'emplois"
							: PAGE_TITLE}
					</h1>
					<SavedIndicator
						hasData={hasDraft || initialData !== undefined}
						isPendingSave={isPendingSave}
						isSaving={isSaving}
					/>
				</div>

				{banner && (
					<>
						<SubmissionBanner
							deadline={cseDeadline}
							depositModifiable={banner.depositModifiable}
							email={email ?? "adresse@exemple.fr"}
							variant={banner.variant}
							year={year}
						/>
						<h2 className="fr-h6 fr-mb-0">{PAGE_TITLE}</h2>
					</>
				)}

				<CseStepIndicator currentStep={1} />

				<div className={styles.intro}>
					<p className={`fr-text--md fr-mb-0 ${styles.introText}`}>
						Renseignez les informations relatives à l'avis ou aux avis émis par
						votre CSE.
					</p>
					<p className="fr-mb-0 fr-text-title--grey">
						Tous les champs sont obligatoires.
					</p>
				</div>

				{declarationNumbers.map((declarationNumber) => (
					<section className={styles.declaration} key={declarationNumber}>
						{hasSecondDeclaration && (
							<DeclarationHeading className="fr-h6 fr-mb-0">
								{DECLARATION_HEADINGS[declarationNumber]}
							</DeclarationHeading>
						)}
						{renderCard(declarationNumber, "accuracy")}
						{justificationRequired[declarationNumber] &&
							renderCard(declarationNumber, "gap")}
					</section>
				))}

				<div aria-live="polite" className={layoutStyles.alerts}>
					{(form.formState.errors.firstDeclaration ||
						form.formState.errors.secondDeclaration) && (
						<div className="fr-alert fr-alert--error">
							<p>Veuillez remplir tous les champs obligatoires.</p>
						</div>
					)}
					{mutation.error && (
						<div className="fr-alert fr-alert--error">
							<p>{mutation.error.message}</p>
						</div>
					)}
				</div>

				<div className={formStyles.actions}>
					<span />
					{isImpersonating && initialData ? (
						<Link
							className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
							href={cseOpinionStepHref(2)}
						>
							Suivant
						</Link>
					) : (
						<span>
							<button
								{...readOnlyGuard.buttonProps}
								className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
								disabled={mutation.isPending || isReadOnly}
								type="submit"
							>
								{mutation.isPending ? "Enregistrement…" : "Suivant"}
							</button>
							{readOnlyGuard.tooltip}
						</span>
					)}
				</div>
			</fieldset>
		</form>
	);
}
