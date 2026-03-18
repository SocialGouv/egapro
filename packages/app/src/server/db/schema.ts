import { relations } from "drizzle-orm";
import {
	index,
	pgEnum,
	pgTableCreator,
	primaryKey,
	unique,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

/**
 * Multi-project schema: all tables are prefixed with `app_`.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `app_${name}`);

export const users = createTable("user", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: d.varchar({ length: 255 }),
	firstName: d.varchar({ length: 255 }),
	lastName: d.varchar({ length: 255 }),
	email: d.varchar({ length: 255 }).notNull(),
	emailVerified: d
		.timestamp({
			mode: "date",
			withTimezone: true,
		})
		.$defaultFn(() => /* @__PURE__ */ new Date()),
	image: d.varchar({ length: 255 }),
	phone: d.varchar({ length: 20 }),
	siret: d.varchar({ length: 14 }),
}));

export const accounts = createTable(
	"account",
	(d) => ({
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
		provider: d.varchar({ length: 255 }).notNull(),
		providerAccountId: d.varchar({ length: 255 }).notNull(),
		// NextAuth DrizzleAdapter requires these exact snake_case property names
		refresh_token: d.text(),
		access_token: d.text(),
		expires_at: d.integer(),
		token_type: d.varchar({ length: 255 }),
		scope: d.varchar({ length: 255 }),
		id_token: d.text(),
		session_state: d.varchar({ length: 255 }),
	}),
	(t) => [
		primaryKey({ columns: [t.provider, t.providerAccountId] }),
		index("account_user_id_idx").on(t.userId),
	],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
	"session",
	(d) => ({
		sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
	"verification_token",
	(d) => ({
		identifier: d.varchar({ length: 255 }).notNull(),
		token: d.varchar({ length: 255 }).notNull(),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const declarations = createTable(
	"declaration",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		siren: d.varchar({ length: 9 }).notNull(),
		year: d.integer().notNull(),
		declarantId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		totalWomen: d.integer(),
		totalMen: d.integer(),
		remunerationScore: d.integer(),
		variableRemunerationScore: d.integer(),
		quartileScore: d.integer(),
		categoryScore: d.integer(),
		compliancePath: d.varchar({ length: 30 }),
		currentStep: d.integer().default(0),
		status: d.varchar({ length: 20 }).default("draft"),
		secondDeclarationStep: d.integer(),
		secondDeclarationStatus: d.varchar({ length: 20 }),
		secondDeclReferencePeriodStart: d.varchar({ length: 10 }),
		secondDeclReferencePeriodEnd: d.varchar({ length: 10 }),
		complianceCompletedAt: d.timestamp({ withTimezone: true }),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [
		unique("declaration_siren_year_idx").on(t.siren, t.year),
		index("declaration_declarant_idx").on(t.declarantId),
	],
);

export const declarationsRelations = relations(
	declarations,
	({ one, many }) => ({
		declarant: one(users, {
			fields: [declarations.declarantId],
			references: [users.id],
		}),
		company: one(companies, {
			fields: [declarations.siren],
			references: [companies.siren],
		}),
		categories: many(declarationCategories),
		jobCategories: many(jobCategories),
	}),
);

export const declarationCategories = createTable(
	"declaration_category",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		siren: d.varchar({ length: 9 }).notNull(),
		year: d.integer().notNull(),
		step: d.integer().notNull(),
		categoryName: d.varchar({ length: 255 }).notNull(),
		womenCount: d.integer(),
		menCount: d.integer(),
		womenValue: d.numeric(),
		menValue: d.numeric(),
		womenMedianValue: d.numeric(),
		menMedianValue: d.numeric(),
	}),
	(t) => [
		index("declaration_cat_siren_year_step_idx").on(t.siren, t.year, t.step),
	],
);

export const declarationCategoriesRelations = relations(
	declarationCategories,
	({ one }) => ({
		declaration: one(declarations, {
			fields: [declarationCategories.siren, declarationCategories.year],
			references: [declarations.siren, declarations.year],
		}),
	}),
);

// ── Employee category tables (indicator G) ─────────────────────────

export const declarationTypeEnum = pgEnum("declaration_type", [
	"initial",
	"correction",
]);

export const jobCategories = createTable(
	"job_category",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		declarationId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => declarations.id),
		categoryIndex: d.integer().notNull(),
		name: d.varchar({ length: 255 }).notNull(),
		detail: d.varchar({ length: 500 }),
		source: d.varchar({ length: 50 }).notNull(),
	}),
	(t) => [
		unique("job_category_declaration_index_idx").on(
			t.declarationId,
			t.categoryIndex,
		),
	],
);

export const jobCategoriesRelations = relations(
	jobCategories,
	({ one, many }) => ({
		declaration: one(declarations, {
			fields: [jobCategories.declarationId],
			references: [declarations.id],
		}),
		employeeCategories: many(employeeCategories),
	}),
);

export const employeeCategories = createTable(
	"employee_category",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		jobCategoryId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => jobCategories.id),
		declarationType: declarationTypeEnum().notNull(),
		womenCount: d.integer(),
		menCount: d.integer(),
		annualBaseWomen: d.numeric(),
		annualBaseMen: d.numeric(),
		annualVariableWomen: d.numeric(),
		annualVariableMen: d.numeric(),
		hourlyBaseWomen: d.numeric(),
		hourlyBaseMen: d.numeric(),
		hourlyVariableWomen: d.numeric(),
		hourlyVariableMen: d.numeric(),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [
		unique("employee_category_job_type_idx").on(
			t.jobCategoryId,
			t.declarationType,
		),
	],
);

export const employeeCategoriesRelations = relations(
	employeeCategories,
	({ one }) => ({
		jobCategory: one(jobCategories, {
			fields: [employeeCategories.jobCategoryId],
			references: [jobCategories.id],
		}),
	}),
);

// ── GIP MDS imported data ───────────────────────────────────────────

export const gipMdsData = createTable(
	"gip_mds_data",
	(d) => ({
		siren: d.varchar({ length: 9 }).notNull(),
		year: d.integer().notNull(),
		// File-level metadata
		importedAt: d
			.timestamp({ withTimezone: true })
			.$defaultFn(() => new Date()),
		periodStart: d.date(),
		periodEnd: d.date(),
		// Workforce
		workforceEma: d.numeric({ precision: 9, scale: 2 }),
		menCountAnnualGlobal: d.numeric({ precision: 9, scale: 2 }),
		womenCountAnnualGlobal: d.numeric({ precision: 9, scale: 2 }),
		menCountHourlyGlobal: d.numeric({ precision: 9, scale: 2 }),
		womenCountHourlyGlobal: d.numeric({ precision: 9, scale: 2 }),
		menCountAnnualVariable: d.numeric({ precision: 9, scale: 2 }),
		womenCountAnnualVariable: d.numeric({ precision: 9, scale: 2 }),
		// Indicator A — Global mean remuneration gap
		globalAnnualMeanGap: d.numeric({ precision: 9, scale: 4 }),
		globalAnnualMeanWomen: d.numeric({ precision: 9, scale: 2 }),
		globalAnnualMeanMen: d.numeric({ precision: 9, scale: 2 }),
		globalHourlyMeanGap: d.numeric({ precision: 9, scale: 4 }),
		globalHourlyMeanWomen: d.numeric({ precision: 9, scale: 2 }),
		globalHourlyMeanMen: d.numeric({ precision: 9, scale: 2 }),
		// Indicator B — Variable mean remuneration gap
		variableAnnualMeanGap: d.numeric({ precision: 9, scale: 4 }),
		variableAnnualMeanWomen: d.numeric({ precision: 9, scale: 2 }),
		variableAnnualMeanMen: d.numeric({ precision: 9, scale: 2 }),
		variableHourlyMeanGap: d.numeric({ precision: 9, scale: 4 }),
		variableHourlyMeanWomen: d.numeric({ precision: 9, scale: 2 }),
		variableHourlyMeanMen: d.numeric({ precision: 9, scale: 2 }),
		// Indicator C — Global median remuneration gap
		globalAnnualMedianGap: d.numeric({ precision: 9, scale: 4 }),
		globalAnnualMedianWomen: d.numeric({ precision: 9, scale: 2 }),
		globalAnnualMedianMen: d.numeric({ precision: 9, scale: 2 }),
		globalHourlyMedianGap: d.numeric({ precision: 9, scale: 4 }),
		globalHourlyMedianWomen: d.numeric({ precision: 9, scale: 2 }),
		globalHourlyMedianMen: d.numeric({ precision: 9, scale: 2 }),
		// Indicator D — Variable median remuneration gap
		variableAnnualMedianGap: d.numeric({ precision: 9, scale: 4 }),
		variableAnnualMedianWomen: d.numeric({ precision: 9, scale: 2 }),
		variableAnnualMedianMen: d.numeric({ precision: 9, scale: 2 }),
		variableHourlyMedianGap: d.numeric({ precision: 9, scale: 4 }),
		variableHourlyMedianWomen: d.numeric({ precision: 9, scale: 2 }),
		variableHourlyMedianMen: d.numeric({ precision: 9, scale: 2 }),
		// Indicator E — Variable pay proportion
		variableProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		variableProportionMen: d.numeric({ precision: 9, scale: 4 }),
		// Indicator F — Quartile distribution (annual)
		annualQuartileThreshold1: d.numeric({ precision: 9, scale: 2 }),
		annualQuartileThreshold2: d.numeric({ precision: 9, scale: 2 }),
		annualQuartileThreshold3: d.numeric({ precision: 9, scale: 2 }),
		annualQuartileThreshold4: d.numeric({ precision: 9, scale: 2 }),
		annualQuartile1ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile2ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile3ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile4ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile1ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile2ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile3ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile4ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		// Indicator F — Quartile distribution (hourly)
		hourlyQuartileThreshold1: d.numeric({ precision: 9, scale: 2 }),
		hourlyQuartileThreshold2: d.numeric({ precision: 9, scale: 2 }),
		hourlyQuartileThreshold3: d.numeric({ precision: 9, scale: 2 }),
		hourlyQuartileThreshold4: d.numeric({ precision: 9, scale: 2 }),
		hourlyQuartile1ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile2ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile3ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile4ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile1ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile2ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile3ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile4ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		// Confidence index
		confidenceIndex: d.numeric({ precision: 9, scale: 4 }),
		confidenceExoticContracts: d.numeric({ precision: 9, scale: 4 }),
		confidenceUnitMeasure: d.numeric({ precision: 9, scale: 4 }),
		confidenceSuspensionRatio: d.numeric({ precision: 9, scale: 4 }),
		confidenceLongSuspensions: d.numeric({ precision: 9, scale: 4 }),
		confidenceNoEndSuspensions: d.numeric({ precision: 9, scale: 4 }),
		confidenceSickLeaveRatio: d.numeric({ precision: 9, scale: 4 }),
		confidenceLongSickLeave: d.numeric({ precision: 9, scale: 4 }),
		confidenceNoSickLeave: d.numeric({ precision: 9, scale: 4 }),
		confidenceQuota250: d.numeric({ precision: 9, scale: 4 }),
		confidenceQuota0: d.numeric({ precision: 9, scale: 4 }),
		confidenceMultiYear: d.numeric({ precision: 9, scale: 4 }),
		confidenceFpRatio: d.numeric({ precision: 9, scale: 4 }),
		confidenceExtremeRemuneration: d.numeric({ precision: 9, scale: 4 }),
		confidenceExtremeRate: d.numeric({ precision: 9, scale: 4 }),
	}),
	(t) => [
		primaryKey({ columns: [t.siren, t.year] }),
		index("gip_mds_data_siren_idx").on(t.siren),
	],
);

// ── Company tables ─────────────────────────────────────────────────

export const companies = createTable("company", (d) => ({
	siren: d.varchar({ length: 9 }).notNull().primaryKey(),
	name: d.varchar({ length: 255 }).notNull(),
	address: d.varchar({ length: 500 }),
	nafCode: d.varchar({ length: 10 }),
	workforce: d.integer(),
	hasCse: d.boolean(),
	createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
}));

export const userCompanies = createTable(
	"user_company",
	(d) => ({
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		siren: d
			.varchar({ length: 9 })
			.notNull()
			.references(() => companies.siren),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [
		primaryKey({ columns: [t.userId, t.siren] }),
		index("user_company_user_id_idx").on(t.userId),
	],
);

export const userCompaniesRelations = relations(userCompanies, ({ one }) => ({
	user: one(users, {
		fields: [userCompanies.userId],
		references: [users.id],
	}),
	company: one(companies, {
		fields: [userCompanies.siren],
		references: [companies.siren],
	}),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
	userCompanies: many(userCompanies),
	declarations: many(declarations),
	cseOpinions: many(cseOpinions),
	cseOpinionFiles: many(cseOpinionFiles),
	jointEvaluationFiles: many(jointEvaluationFiles),
}));

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	userCompanies: many(userCompanies),
	jointEvaluationFiles: many(jointEvaluationFiles),
}));

// ── CSE Opinion tables ──────────────────────────────────────────────

export const cseOpinions = createTable(
	"cse_opinion",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		siren: d
			.varchar({ length: 9 })
			.notNull()
			.references(() => companies.siren),
		year: d.integer().notNull(),
		declarationNumber: d.integer().notNull(),
		type: d.varchar({ length: 20 }).notNull(),
		gapConsulted: d.boolean(),
		opinion: d.varchar({ length: 20 }),
		opinionDate: d.varchar({ length: 10 }),
		declarantId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [
		unique("cse_opinion_siren_year_decl_type_idx").on(
			t.siren,
			t.year,
			t.declarationNumber,
			t.type,
		),
		index("cse_opinion_siren_year_idx").on(t.siren, t.year),
	],
);

export const cseOpinionsRelations = relations(cseOpinions, ({ one, many }) => ({
	company: one(companies, {
		fields: [cseOpinions.siren],
		references: [companies.siren],
	}),
	declarant: one(users, {
		fields: [cseOpinions.declarantId],
		references: [users.id],
	}),
	fileLinks: many(cseOpinionFileLinks),
}));

export const cseOpinionFiles = createTable(
	"cse_opinion_file",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		siren: d
			.varchar({ length: 9 })
			.notNull()
			.references(() => companies.siren),
		year: d.integer().notNull(),
		fileName: d.varchar({ length: 255 }).notNull(),
		filePath: d.varchar({ length: 500 }).notNull(),
		declarantId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		uploadedAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [index("cse_opinion_file_siren_year_idx").on(t.siren, t.year)],
);

export const cseOpinionFilesRelations = relations(
	cseOpinionFiles,
	({ one, many }) => ({
		company: one(companies, {
			fields: [cseOpinionFiles.siren],
			references: [companies.siren],
		}),
		declarant: one(users, {
			fields: [cseOpinionFiles.declarantId],
			references: [users.id],
		}),
		opinionLinks: many(cseOpinionFileLinks),
	}),
);

export const cseOpinionFileLinks = createTable(
	"cse_opinion_file_link",
	(d) => ({
		fileId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => cseOpinionFiles.id),
		opinionId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => cseOpinions.id),
	}),
	(t) => [primaryKey({ columns: [t.fileId, t.opinionId] })],
);

export const cseOpinionFileLinksRelations = relations(
	cseOpinionFileLinks,
	({ one }) => ({
		file: one(cseOpinionFiles, {
			fields: [cseOpinionFileLinks.fileId],
			references: [cseOpinionFiles.id],
		}),
		opinion: one(cseOpinions, {
			fields: [cseOpinionFileLinks.opinionId],
			references: [cseOpinions.id],
		}),
	}),
);

export const jointEvaluationFiles = createTable(
	"joint_evaluation_file",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		siren: d
			.varchar({ length: 9 })
			.notNull()
			.references(() => companies.siren),
		year: d.integer().notNull(),
		fileName: d.varchar({ length: 255 }).notNull(),
		filePath: d.varchar({ length: 500 }).notNull(),
		declarantId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		uploadedAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [index("joint_eval_file_siren_year_idx").on(t.siren, t.year)],
);

export const jointEvaluationFilesRelations = relations(
	jointEvaluationFiles,
	({ one }) => ({
		company: one(companies, {
			fields: [jointEvaluationFiles.siren],
			references: [companies.siren],
		}),
		declarant: one(users, {
			fields: [jointEvaluationFiles.declarantId],
			references: [users.id],
		}),
	}),
);

// ── Export tables ───────────────────────────────────────────────────

export const exports = createTable(
	"export",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		year: d.integer().notNull(),
		version: d.varchar({ length: 10 }).notNull().default("v1"),
		fileName: d.varchar({ length: 255 }).notNull(),
		s3Key: d.varchar({ length: 500 }).notNull(),
		rowCount: d.integer().notNull(),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [unique("export_year_version_idx").on(t.year, t.version)],
);
