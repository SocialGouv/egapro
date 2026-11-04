import type { DeclarationFsmStatus } from "../types";
import { DECLARATION_PROCESS_STEP_LABELS } from "./declarationProcessStep";
import { isCancelled } from "./declarationStatus";
import type { DeclarationEventType } from "./declarationTrajectory";

export const DEMARCHE_LIFECYCLE_STATUSES = [
	"draft",
	"in_progress",
	"completed",
	"cancelled",
] as const;

export type DemarcheLifecycleStatus =
	(typeof DEMARCHE_LIFECYCLE_STATUSES)[number];

// `demarche_complete` is a system consequence and `cancel` an admin action: neither is something the company transmitted.
export const TRANSMISSION_EVENT_TYPES = [
	"submit",
	"path_choice",
	"second_declaration_submit",
	"joint_evaluation_submit",
	"cse_opinion_submit",
	"formal_notice_joint_evaluation_submit",
] as const satisfies ReadonlyArray<DeclarationEventType>;

export type TransmissionEventType = (typeof TRANSMISSION_EVENT_TYPES)[number];

const TRANSMISSION_EVENT_TYPE_SET: ReadonlySet<string> = new Set(
	TRANSMISSION_EVENT_TYPES,
);

export function isTransmissionEventType(
	eventType: string,
): eventType is TransmissionEventType {
	return TRANSMISSION_EVENT_TYPE_SET.has(eventType);
}

export function getDemarcheLifecycleStatus(declaration: {
	status: DeclarationFsmStatus;
	cancelledAt: Date | null;
}): DemarcheLifecycleStatus {
	if (isCancelled(declaration)) return "cancelled";

	switch (declaration.status) {
		case "draft":
			return "draft";
		case "demarche_completed":
			return "completed";
		case "awaiting_compliance_path_choice":
		case "corrective_actions_chosen":
		case "joint_evaluation_chosen":
		case "awaiting_revision_choice":
		case "revised_joint_evaluation_chosen":
		case "awaiting_cse_opinion":
			return "in_progress";
	}
}

export type DemarcheStatusDateSources = {
	openedAt: Date | null;
	lastTransmissionAt: Date | null;
	completedAt: Date | null;
	cancelledAt: Date | null;
};

export function getDemarcheStatusDate(
	status: DemarcheLifecycleStatus,
	sources: DemarcheStatusDateSources,
): Date | null {
	switch (status) {
		case "draft":
			return sources.openedAt;
		case "in_progress":
			return sources.lastTransmissionAt;
		case "completed":
			return sources.completedAt;
		case "cancelled":
			return sources.cancelledAt;
	}
}

export function getDemarcheNextStepLabel(
	status: DemarcheLifecycleStatus,
	fsmStatus: DeclarationFsmStatus,
): string | null {
	switch (status) {
		case "draft":
		case "in_progress":
			return DECLARATION_PROCESS_STEP_LABELS[fsmStatus];
		case "completed":
		case "cancelled":
			return null;
	}
}
