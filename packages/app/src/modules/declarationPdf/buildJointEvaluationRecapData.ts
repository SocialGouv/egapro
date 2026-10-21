import "server-only";

import { and, eq } from "drizzle-orm";

import {
	type CompanyLocationRow,
	companyLocationRow,
	formatLongDate,
	formatShortDate,
	formatSiren,
	formatWorkforceForUser,
	getDeclarationReferencePeriod,
	getObligationWorkforce,
	getReferenceYearFor,
	isCseRequired,
	parseGipWorkforce,
} from "~/modules/domain";
import { formatFileMeta } from "~/modules/shared/uploadConfig";
import {
	activeDeclarationFilter,
	findTransmittedJointEvaluation,
} from "~/server/api/routers/declarationHelpers";
import { db } from "~/server/db";
import {
	companies,
	declarations,
	files,
	gipMdsData,
	users,
} from "~/server/db/schema";
import { getFileSize } from "~/server/services/s3";

import { formatCsePresence } from "./formatCsePresence";
import { formatNaf } from "./formatNaf";

const JOINT_EVALUATION_FILE_FORMAT = "PDF";

export class JointEvaluationNotTransmittedError extends Error {
	constructor() {
		super("Évaluation conjointe non transmise");
		this.name = "JointEvaluationNotTransmittedError";
	}
}

export type JointEvaluationRecapData = {
	year: number;
	transmittedAt: string;
	referencePeriod: string;
	declarant: { name: string; email: string; phone: string };
	company: {
		name: string;
		siren: string;
		location: CompanyLocationRow | null;
		naf: string;
		workforceLabel: string;
		workforceDisplay: string;
		cseDisplay: string | null;
	};
	file: { id: string; name: string; detail: string };
};

export async function buildJointEvaluationRecapData(
	siren: string,
	year: number,
): Promise<JointEvaluationRecapData> {
	const [declaration] = await db
		.select()
		.from(declarations)
		.where(activeDeclarationFilter(siren, year))
		.limit(1);
	if (!declaration) throw new JointEvaluationNotTransmittedError();

	const transmitted = await findTransmittedJointEvaluation(db, declaration.id);
	if (!transmitted) throw new JointEvaluationNotTransmittedError();
	const { submission, file } = transmitted;

	const [[company], [gip], [declarant], [stored]] = await Promise.all([
		db.select().from(companies).where(eq(companies.siren, siren)).limit(1),
		db
			.select({ workforceEma: gipMdsData.workforceEma })
			.from(gipMdsData)
			.where(and(eq(gipMdsData.siren, siren), eq(gipMdsData.year, year)))
			.limit(1),
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
		db
			.select({ filePath: files.filePath })
			.from(files)
			.where(eq(files.id, file.id))
			.limit(1),
	]);

	const fileSize = stored ? await getFileSize(stored.filePath) : null;
	const workforce = parseGipWorkforce(gip?.workforceEma);

	return {
		year,
		transmittedAt: formatShortDate(submission.createdAt),
		referencePeriod: getDeclarationReferencePeriod(
			year,
			submission.round === 2,
			declaration.secondDeclReferencePeriodStart,
			declaration.secondDeclReferencePeriodEnd,
		),
		declarant: {
			name: [declarant?.firstName, declarant?.lastName]
				.filter(Boolean)
				.join(" "),
			email: declarant?.email ?? "",
			phone: declarant?.phone ?? "",
		},
		company: {
			name: company?.name ?? `Entreprise ${siren}`,
			siren: formatSiren(siren),
			location: companyLocationRow({
				countryCode: company?.countryCode ?? null,
				countryLabel: company?.countryLabel ?? null,
				departmentLabel: company?.departmentLabel ?? null,
				domesticAddress: company?.address ?? "",
			}),
			naf: formatNaf(company?.nafCode ?? null, company?.nafLabel ?? null),
			workforceLabel: `Effectif annuel moyen en ${getReferenceYearFor(year)}`,
			workforceDisplay: formatWorkforceForUser(workforce),
			cseDisplay: isCseRequired(getObligationWorkforce(workforce))
				? formatCsePresence(company?.hasCse ?? null)
				: null,
		},
		file: {
			id: file.id,
			name: file.fileName,
			detail: `${formatFileMeta(JOINT_EVALUATION_FILE_FORMAT, fileSize)} · déposé le ${formatLongDate(file.uploadedAt)}`,
		},
	};
}
