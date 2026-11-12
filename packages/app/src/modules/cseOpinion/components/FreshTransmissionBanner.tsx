import { useEffect, useRef, useState } from "react";

import {
	consumeDeclarationTransmissionSuccess,
	consumeJointEvaluationTransmissionSuccess,
	consumeSecondDeclarationTransmissionSuccess,
} from "~/modules/declaration-remuneration/shared/declarationSuccessFlash";
import { DeclarationSuccessBanner } from "~/modules/declaration-remuneration/steps/compliancePath/DeclarationSuccessBanner";
import { API_DECLARATION_PDF } from "~/modules/routes";
import type { SubmissionBannerState } from "../submissionBanner";
import { SubmissionBanner } from "./SubmissionBanner";

export type FreshTransmission = "compliance_path" | "declaration" | null;

export function useFreshTransmission(
	banner: SubmissionBannerState,
): FreshTransmission {
	const consumed = useRef(false);
	const [fresh, setFresh] = useState({
		declaration: false,
		jointEvaluation: false,
		secondDeclaration: false,
	});

	useEffect(() => {
		if (consumed.current) return;
		consumed.current = true;
		setFresh({
			declaration: consumeDeclarationTransmissionSuccess(),
			jointEvaluation: consumeJointEvaluationTransmissionSuccess(),
			secondDeclaration: consumeSecondDeclarationTransmissionSuccess(),
		});
	}, []);

	const freshForVariant =
		banner?.variant === "joint_evaluation"
			? fresh.jointEvaluation
			: banner?.variant === "second_declaration"
				? fresh.secondDeclaration
				: false;
	if (banner && freshForVariant) {
		return "compliance_path";
	}
	return fresh.declaration ? "declaration" : null;
}

export function getFreshTransmissionTitle(
	freshTransmission: FreshTransmission,
	year: number,
) {
	if (freshTransmission === "compliance_path") {
		return "Parcours de mise en conformité pour l'indicateur par catégorie d'emplois";
	}
	if (freshTransmission === "declaration") {
		return `Déclaration des indicateurs de rémunération ${year}`;
	}
	return null;
}

type Props = {
	banner: SubmissionBannerState;
	cseDeadline: Date;
	declarationModifiable: boolean;
	email: string;
	freshTransmission: FreshTransmission;
	year: number;
};

export function FreshTransmissionBanner({
	banner,
	cseDeadline,
	declarationModifiable,
	email,
	freshTransmission,
	year,
}: Props) {
	if (freshTransmission === "compliance_path" && banner) {
		return (
			<SubmissionBanner
				deadline={cseDeadline}
				depositModifiable={banner.depositModifiable}
				email={email}
				variant={banner.variant}
				year={year}
			/>
		);
	}
	if (freshTransmission === "declaration") {
		return (
			<DeclarationSuccessBanner
				declarationModifiable={declarationModifiable}
				email={email}
				pdfDownloadHref={`${API_DECLARATION_PDF}?year=${year}`}
				year={year}
			/>
		);
	}
	return null;
}
