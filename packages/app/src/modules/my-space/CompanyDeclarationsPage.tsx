import { getCurrentYear } from "~/modules/domain";

import { ArchivesSection } from "./ArchivesSection";
import { CompanyEditModal } from "./CompanyEditModal";
import { CompanyInfoBanner } from "./CompanyInfoBanner";
import {
	DeclarationProcessPanel,
	type PanelVariant,
} from "./DeclarationProcessPanel";
import { DeclarationsSection } from "./DeclarationsSection";
import { MissingInfoModal } from "./MissingInfoModal";
import type { CompanyDetail, DeclarationItem } from "./types";
import { WelcomeBanner } from "./WelcomeBanner";

type Props = {
	company: CompanyDetail;
	declarations: DeclarationItem[];
	hasNoSanction: boolean;
	userPhone: string | null;
};

function getLastActionDate(declarations: DeclarationItem[]): string | null {
	const remunerationDeclarations = declarations.filter(
		(d) => d.type === "remuneration" && d.updatedAt,
	);
	if (remunerationDeclarations.length === 0) return null;

	const mostRecent = remunerationDeclarations.reduce((latest, d) =>
		d.updatedAt && (!latest.updatedAt || d.updatedAt > latest.updatedAt)
			? d
			: latest,
	);

	if (!mostRecent.updatedAt) return null;

	return new Intl.DateTimeFormat("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(mostRecent.updatedAt);
}

/**
 * Determine the panel variant from the current year's remuneration declaration.
 *
 * - "start": not submitted yet
 * - "compliance": submitted with gaps, compliance path being chosen or second declaration in progress
 * - "evaluation": second declaration submitted, evaluation conjointe in progress
 * - "cse": compliance completed, CSE deposit step
 * - "closed": everything done (complianceCompletedAt is set and status is done)
 */
function computePanelVariant(
	declaration: DeclarationItem | undefined,
): PanelVariant {
	if (
		!declaration ||
		declaration.status === "to_complete" ||
		declaration.status === "in_progress"
	) {
		return "start";
	}

	// Declaration submitted (status === "done")
	const {
		compliancePath,
		secondDeclarationStatus,
		complianceCompletedAt,
		hasCseOpinion,
		hasJointEvaluationFile,
	} = declaration;

	// No compliance path → no gaps or not yet chosen
	if (!compliancePath) {
		return "start";
	}

	// Compliance completed → CSE deposit step or fully closed
	if (complianceCompletedAt) {
		return hasCseOpinion ? "closed" : "cse";
	}

	// Corrective action path
	if (compliancePath === "corrective_action") {
		if (secondDeclarationStatus === "submitted") {
			// Second declaration done, now must choose next path (evaluation or justify)
			return "evaluation";
		}
		// Second declaration not yet submitted
		return "compliance";
	}

	// Joint evaluation path
	if (compliancePath === "joint_evaluation") {
		// File uploaded → evaluation done, move to CSE
		if (hasJointEvaluationFile) {
			return "cse";
		}
		return "evaluation";
	}

	// Justify path → goes to CSE
	if (compliancePath === "justify") {
		return "cse";
	}

	return "start";
}

/**
 * Determine the CTA href based on the panel variant and compliance state.
 */
function computeCtaHref(
	declaration: DeclarationItem | undefined,
	siren: string,
): string {
	if (!declaration || declaration.status !== "done") {
		return `/declaration-remuneration?siren=${siren}`;
	}

	const {
		compliancePath,
		secondDeclarationStatus,
		complianceCompletedAt,
		hasCseOpinion,
		hasJointEvaluationFile,
	} = declaration;

	if (!compliancePath) {
		// Declaration submitted, no compliance path → go to compliance choice
		return `/declaration-remuneration/parcours-conformite?siren=${siren}`;
	}

	// Compliance completed → CSE deposit or done
	if (complianceCompletedAt) {
		if (hasCseOpinion) {
			return `/declaration-remuneration?siren=${siren}`;
		}
		return `/avis-cse?siren=${siren}`;
	}

	if (compliancePath === "corrective_action") {
		if (secondDeclarationStatus === "submitted") {
			// Second declaration done → back to compliance choice (second round)
			return `/declaration-remuneration/parcours-conformite?siren=${siren}`;
		}
		return `/declaration-remuneration/parcours-conformite/etape/1?siren=${siren}`;
	}

	if (compliancePath === "joint_evaluation") {
		if (hasJointEvaluationFile) {
			// File uploaded → go to CSE
			return `/avis-cse?siren=${siren}`;
		}
		return `/declaration-remuneration/parcours-conformite/evaluation-conjointe?siren=${siren}`;
	}

	if (compliancePath === "justify") {
		return `/avis-cse?siren=${siren}`;
	}

	return `/declaration-remuneration?siren=${siren}`;
}

export function CompanyDeclarationsPage({
	company,
	declarations,
	hasNoSanction,
	userPhone,
}: Props) {
	const currentYear = getCurrentYear();
	const lastActionDate = getLastActionDate(declarations);
	const currentDeclaration = declarations.find(
		(d) => d.type === "remuneration" && d.year === currentYear,
	);
	const panelVariant = computePanelVariant(currentDeclaration);
	const ctaHref = computeCtaHref(currentDeclaration, company.siren);

	return (
		<main id="content">
			<WelcomeBanner />
			<CompanyInfoBanner company={company} />
			<DeclarationsSection
				declarations={declarations}
				hasCse={company.hasCse}
				hasNoSanction={hasNoSanction}
				siren={company.siren}
				userPhone={userPhone}
			/>
			<ArchivesSection />
			<CompanyEditModal company={company} />
			{(!userPhone || company.hasCse === null) && (
				<MissingInfoModal
					hasCse={company.hasCse}
					siren={company.siren}
					userPhone={userPhone}
				/>
			)}
			<DeclarationProcessPanel
				ctaHref={ctaHref}
				lastActionDate={lastActionDate}
				siren={company.siren}
				variant={panelVariant}
				year={currentYear}
			/>
		</main>
	);
}
