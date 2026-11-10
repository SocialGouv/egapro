"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useIsImpersonating, useReadOnlyGuard } from "~/modules/auth";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { FieldErrorAlert } from "~/modules/declaration-remuneration/shared/formError/FieldErrorAlert";
import type { FieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import { findFieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { SavedIndicator } from "~/modules/declaration-remuneration/shared/SavedIndicator";
import { cseOpinionStepHref } from "~/modules/routes";
import { consumeSubmissionBannerFlash } from "~/modules/shared/submissionBannerFlash";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionCard } from "./components/OpinionCard";
import { SubmissionBanner } from "./components/SubmissionBanner";
import { DECLARATION_HEADINGS, getOpinionTitle } from "./contentTypeColumns";
import {
	getMissingOpinionFieldErrors,
	type OpinionCardValues,
	opinionDateId,
	opinionFieldId,
} from "./opinionFieldErrors";
import {
	buildOpinionsFormValues,
	hydrateOpinionsForm,
	type JustificationRequirements,
	normalizeSubmittedOpinions,
} from "./opinionsFormValues";
import styles from "./Step1Opinions.module.scss";
import { saveOpinionsSchema } from "./schemas";
import formStyles from "./shared/formActions.module.scss";
import layoutStyles from "./shared/stepLayout.module.scss";
import type { SubmissionBannerState } from "./submissionBanner";
import type {
	ContentType,
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
const REQUIRED_NOTE_ID = "cse-opinions-required-note";

const OPINIONS_ALERT_ID = "cse-opinions-errors";

const UNIDENTIFIED_FIELD_ERROR: FieldError = {
	fieldId: OPINIONS_ALERT_ID,
	category: "invalid",
	message:
		"Certaines informations saisies sont invalides. Vérifiez les avis et les dates renseignés.",
};

function opinionCardId(
	declarationNumber: DeclarationNumber,
	type: ContentType,
) {
	return `${CARD_ID_PREFIXES[declarationNumber]}-${type}`;
}

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

	// `banner` alone can't drive visibility: it stays non-null long after the submit that should show it once.
	const consumedBannerFlash = useRef(false);
	const [bannerFlashConsumed, setBannerFlashConsumed] = useState(false);
	useEffect(() => {
		if (consumedBannerFlash.current) return;
		consumedBannerFlash.current = true;
		setBannerFlashConsumed(consumeSubmissionBannerFlash());
	}, []);
	const visibleBanner = bannerFlashConsumed ? banner : null;

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

	const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
	const [validationAttempt, setValidationAttempt] = useState(0);

	const reportMissingFields = () => {
		const formValues = form.getValues();
		const cards = declarationNumbers.flatMap((declarationNumber) => {
			const declaration = formValues[DECLARATION_KEYS[declarationNumber]];
			const accuracy: OpinionCardValues = {
				cardId: opinionCardId(declarationNumber, "accuracy"),
				declarationNumber,
				type: "accuracy",
				opinion: declaration?.accuracyOpinion,
				date: declaration?.accuracyDate,
			};
			const gap: OpinionCardValues = {
				cardId: opinionCardId(declarationNumber, "gap"),
				declarationNumber,
				type: "gap",
				opinion: declaration?.gapOpinion,
				date: declaration?.gapDate,
			};
			return justificationRequired[declarationNumber]
				? [accuracy, gap]
				: [accuracy];
		});
		const missing = getMissingOpinionFieldErrors(cards, hasSecondDeclaration);
		setValidationAttempt((attempt) => attempt + 1);
		setFieldErrors(missing);
		return missing;
	};

	const clearFieldError = (fieldId: string) =>
		setFieldErrors((previous) =>
			previous.filter((error) => error.fieldId !== fieldId),
		);

	const onSubmit = form.handleSubmit(
		(data) => {
			if (reportMissingFields().length > 0) return;
			mutation.mutate(normalizeSubmittedOpinions(data, requirements));
		},
		() => {
			if (reportMissingFields().length > 0) return;
			setFieldErrors([UNIDENTIFIED_FIELD_ERROR]);
		},
	);

	const values = form.watch();

	if (isLoadingDraft) {
		return <p>Chargement...</p>;
	}

	const DeclarationHeading = visibleBanner ? "h3" : "h2";

	const renderCard = (
		declarationNumber: DeclarationNumber,
		type: "accuracy" | "gap",
	) => {
		const key = DECLARATION_KEYS[declarationNumber];
		const declaration = values[key];
		const isAccuracy = type === "accuracy";
		const cardId = opinionCardId(declarationNumber, type);
		return (
			<OpinionCard
				date={
					(isAccuracy ? declaration?.accuracyDate : declaration?.gapDate) ?? ""
				}
				dateError={findFieldError(fieldErrors, opinionDateId(cardId))}
				errorAlertId={OPINIONS_ALERT_ID}
				id={cardId}
				key={type}
				onDateChange={(value) => {
					form.setValue(
						isAccuracy ? `${key}.accuracyDate` : `${key}.gapDate`,
						value,
					);
					clearFieldError(opinionDateId(cardId));
					triggerDraftSave();
				}}
				onOpinionChange={(value) => {
					form.setValue(
						isAccuracy ? `${key}.accuracyOpinion` : `${key}.gapOpinion`,
						value,
					);
					clearFieldError(opinionFieldId(cardId));
					triggerDraftSave();
				}}
				opinion={
					(isAccuracy
						? declaration?.accuracyOpinion
						: declaration?.gapOpinion) ?? null
				}
				opinionError={findFieldError(fieldErrors, opinionFieldId(cardId))}
				readOnly={isReadOnly}
				requiredNoteId={REQUIRED_NOTE_ID}
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
						{visibleBanner
							? "Parcours de mise en conformité pour l'indicateur par catégorie d'emplois"
							: PAGE_TITLE}
					</h1>
					<SavedIndicator
						hasData={hasDraft || initialData !== undefined}
						isPendingSave={isPendingSave}
						isSaving={isSaving}
					/>
				</div>

				{visibleBanner && (
					<>
						<SubmissionBanner
							deadline={cseDeadline}
							depositModifiable={visibleBanner.depositModifiable}
							email={email ?? "adresse@exemple.fr"}
							variant={visibleBanner.variant}
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
					<p className="fr-mb-0 fr-text-title--grey" id={REQUIRED_NOTE_ID}>
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

				<div className={layoutStyles.alerts}>
					<FieldErrorAlert
						errors={fieldErrors}
						id={OPINIONS_ALERT_ID}
						validationAttempt={validationAttempt}
					/>
					{mutation.error && (
						<div className="fr-alert fr-alert--error" role="alert">
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
