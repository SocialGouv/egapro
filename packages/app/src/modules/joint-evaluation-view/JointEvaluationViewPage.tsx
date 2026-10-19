import { and, desc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
	getCurrentYear,
	getDeclarationReferencePeriod,
} from "~/modules/domain";
import { auth } from "~/server/auth";
import { resolveAuthorizedSiren } from "~/server/auth/companyAccess";
import { db } from "~/server/db";
import {
	declarationStatusHistory,
	declarations,
	users,
} from "~/server/db/schema";
import { api } from "~/trpc/server";
import { JointEvaluationView } from "./JointEvaluationView";

export async function JointEvaluationViewPage() {
	const session = await auth();
	if (!session?.user) notFound();

	const siren = await resolveAuthorizedSiren(db, session);
	if (!siren) notFound();

	const [declaration] = await db
		.select()
		.from(declarations)
		.where(
			and(
				eq(declarations.siren, siren),
				eq(declarations.year, getCurrentYear()),
				isNull(declarations.cancelledAt),
			),
		)
		.limit(1);
	if (!declaration) notFound();

	const [submission] = await db
		.select({
			createdAt: declarationStatusHistory.createdAt,
			round: declarationStatusHistory.round,
		})
		.from(declarationStatusHistory)
		.where(
			and(
				eq(declarationStatusHistory.declarationId, declaration.id),
				eq(declarationStatusHistory.eventType, "joint_evaluation_submit"),
			),
		)
		.orderBy(desc(declarationStatusHistory.createdAt))
		.limit(1);
	if (!submission) notFound();

	const [company, file, declarantRows] = await Promise.all([
		api.company.get({ siren }),
		api.jointEvaluation.getFile(),
		db
			.select({
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				phone: users.phone,
			})
			.from(users)
			.where(eq(users.id, declaration.declarantId))
			.limit(1),
	]);
	// A later round can replace the single report row before it is transmitted.
	// In that interval the previous submit event still exists, but belongs to
	// the former file. Never present the new upload as a transmitted report.
	if (!file || file.uploadedAt > submission.createdAt) notFound();

	const declarant = declarantRows[0];
	return (
		<JointEvaluationView
			company={company}
			declarant={declarant ?? null}
			file={file}
			referencePeriod={getDeclarationReferencePeriod(
				declaration.year,
				submission.round === 2,
				declaration.secondDeclReferencePeriodStart,
				declaration.secondDeclReferencePeriodEnd,
			)}
			submittedAt={submission.createdAt}
			year={declaration.year}
		/>
	);
}
