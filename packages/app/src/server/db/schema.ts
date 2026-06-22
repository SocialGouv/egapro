import { relations, sql } from "drizzle-orm";
import {
	index,
	pgEnum,
	pgTableCreator,
	primaryKey,
	unique,
	uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Multi-project schema: all tables are prefixed with `app_`.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `app_${name}`);

export const declarationStatusEnum = pgEnum("declaration_status", [
	"draft",
	"awaiting_compliance_path_choice",
	"corrective_actions_chosen",
	"joint_evaluation_chosen",
	"awaiting_revision_choice",
	"revised_joint_evaluation_chosen",
	"awaiting_cse_opinion",
	"demarche_completed",
]);

export const compliancePathEnum = pgEnum("compliance_path", [
	"justify",
	"corrective_action",
	"joint_evaluation",
]);

export const declarationEventTypeEnum = pgEnum("declaration_event_type", [
	"submit",
	"path_choice",
	"second_declaration_submit",
	"joint_evaluation_submit",
	"cse_opinion_submit",
	"cancel",
	"demarche_complete",
	"step_change",
]);

export const users = createTable("user", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	firstName: d.varchar({ length: 255 }),
	lastName: d.varchar({ length: 255 }),
	email: d.varchar({ length: 255 }).notNull(),
	emailVerified: d
		.timestamp({
			mode: "date",
			withTimezone: true,
		})
		.$defaultFn(() => /* @__PURE__ */ new Date()),
	phone: d.varchar({ length: 20 }),
	isAdmin: d.boolean().notNull().default(false),
}));

export const declarations = createTable(
	"declaration",
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
		firstDeclarationPathChoice: compliancePathEnum(
			"first_declaration_path_choice",
		),
		secondDeclarationPathChoice: compliancePathEnum(
			"second_declaration_path_choice",
		),
		// ── Indicator A — Global remuneration gap (mean) ──
		indicatorAAnnualWomen: d.numeric(),
		indicatorAAnnualMen: d.numeric(),
		indicatorAHourlyWomen: d.numeric(),
		indicatorAHourlyMen: d.numeric(),
		// ── Indicator B — Variable remuneration gap (mean) ──
		indicatorBAnnualWomen: d.numeric(),
		indicatorBAnnualMen: d.numeric(),
		indicatorBHourlyWomen: d.numeric(),
		indicatorBHourlyMen: d.numeric(),
		// ── Indicator C — Global remuneration gap (median) ──
		indicatorCAnnualWomen: d.numeric(),
		indicatorCAnnualMen: d.numeric(),
		indicatorCHourlyWomen: d.numeric(),
		indicatorCHourlyMen: d.numeric(),
		// ── Indicator D — Variable remuneration gap (median) ──
		indicatorDAnnualWomen: d.numeric(),
		indicatorDAnnualMen: d.numeric(),
		indicatorDHourlyWomen: d.numeric(),
		indicatorDHourlyMen: d.numeric(),
		// ── Indicator E — Variable pay beneficiary count ──
		indicatorEWomen: d.numeric(),
		indicatorEMen: d.numeric(),
		// ── Indicator F — Quartile distribution (annual) ──
		indicatorFAnnualThreshold1: d.numeric(),
		indicatorFAnnualThreshold2: d.numeric(),
		indicatorFAnnualThreshold3: d.numeric(),
		indicatorFAnnualWomen1: d.integer(),
		indicatorFAnnualWomen2: d.integer(),
		indicatorFAnnualWomen3: d.integer(),
		indicatorFAnnualWomen4: d.integer(),
		indicatorFAnnualMen1: d.integer(),
		indicatorFAnnualMen2: d.integer(),
		indicatorFAnnualMen3: d.integer(),
		indicatorFAnnualMen4: d.integer(),
		// ── Indicator F — Quartile distribution (hourly) ──
		indicatorFHourlyThreshold1: d.numeric(),
		indicatorFHourlyThreshold2: d.numeric(),
		indicatorFHourlyThreshold3: d.numeric(),
		indicatorFHourlyWomen1: d.integer(),
		indicatorFHourlyWomen2: d.integer(),
		indicatorFHourlyWomen3: d.integer(),
		indicatorFHourlyWomen4: d.integer(),
		indicatorFHourlyMen1: d.integer(),
		indicatorFHourlyMen2: d.integer(),
		indicatorFHourlyMen3: d.integer(),
		indicatorFHourlyMen4: d.integer(),
		// ── Calculated percentages — Indicator A/B (gaps) ──
		globalAnnualMeanGap: d.numeric({ precision: 9, scale: 4 }),
		globalHourlyMeanGap: d.numeric({ precision: 9, scale: 4 }),
		variableAnnualMeanGap: d.numeric({ precision: 9, scale: 4 }),
		variableHourlyMeanGap: d.numeric({ precision: 9, scale: 4 }),
		globalAnnualMedianGap: d.numeric({ precision: 9, scale: 4 }),
		globalHourlyMedianGap: d.numeric({ precision: 9, scale: 4 }),
		variableAnnualMedianGap: d.numeric({ precision: 9, scale: 4 }),
		variableHourlyMedianGap: d.numeric({ precision: 9, scale: 4 }),
		// ── Calculated percentages — Indicator E (proportions) ──
		variableProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		variableProportionMen: d.numeric({ precision: 9, scale: 4 }),
		// ── Calculated percentages — Indicator F annual (proportions) ──
		annualQuartile1ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile2ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile3ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile4ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile1ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile2ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile3ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		annualQuartile4ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		// ── Calculated percentages — Indicator F hourly (proportions) ──
		hourlyQuartile1ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile2ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile3ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile4ProportionWomen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile1ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile2ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile3ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		hourlyQuartile4ProportionMen: d.numeric({ precision: 9, scale: 4 }),
		currentStep: d.integer().default(0),
		status: declarationStatusEnum("status").notNull().default("draft"),
		secondDeclarationStep: d.integer(),
		secondDeclReferencePeriodStart: d.varchar({ length: 10 }),
		secondDeclReferencePeriodEnd: d.varchar({ length: 10 }),
		cseRequired: d.boolean().notNull().default(false),
		rulesVersion: d.varchar("rules_version").notNull().default("2027.1"),
		cancelledAt: d.timestamp({ withTimezone: false, mode: "date" }),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		draft: d.jsonb(),
		draftUpdatedAt: d.timestamp({ withTimezone: true }),
	}),
	(t) => [
		uniqueIndex("declarations_siren_year_active_unique")
			.on(t.siren, t.year)
			.where(sql`cancelled_at IS NULL`),
		index("declaration_declarant_idx").on(t.declarantId),
	],
);

export const declarationStatusHistory = createTable(
	"declaration_status_history",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		declarationId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => declarations.id, { onDelete: "cascade" }),
		eventType: declarationEventTypeEnum("event_type").notNull(),
		value: d.varchar({ length: 50 }),
		round: d.integer(),
		actorUserId: d.varchar({ length: 255 }).references(() => users.id),
		createdAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
	}),
	(t) => [
		index("decl_status_history_declaration_idx").on(
			t.declarationId,
			t.createdAt.desc(),
		),
	],
);

export const declarationStatusHistoryRelations = relations(
	declarationStatusHistory,
	({ one }) => ({
		declaration: one(declarations, {
			fields: [declarationStatusHistory.declarationId],
			references: [declarations.id],
		}),
		actor: one(users, {
			fields: [declarationStatusHistory.actorUserId],
			references: [users.id],
		}),
	}),
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
		jobCategories: many(jobCategories),
		cseOpinions: many(cseOpinions),
		files: many(files),
		cseOpinionFiles: many(cseOpinionFiles),
		statusHistory: many(declarationStatusHistory),
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
		siren: d
			.varchar({ length: 9 })
			.notNull()
			.references(() => companies.siren),
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

export const gipMdsDataRelations = relations(gipMdsData, ({ one }) => ({
	company: one(companies, {
		fields: [gipMdsData.siren],
		references: [companies.siren],
	}),
}));

// ── Company tables ─────────────────────────────────────────────────

export const companies = createTable("company", (d) => ({
	siren: d.varchar({ length: 9 }).notNull().primaryKey(),
	name: d.varchar({ length: 255 }).notNull(),
	address: d.varchar({ length: 500 }),
	nafCode: d.varchar({ length: 10 }),
	nafLabel: d.varchar({ length: 255 }),
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
	gipMdsData: many(gipMdsData),
}));

export const usersRelations = relations(users, ({ many }) => ({
	userCompanies: many(userCompanies),
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
		declarationId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => declarations.id),
		declarationNumber: d.integer().notNull(),
		type: d.varchar({ length: 20 }).notNull(),
		gapConsulted: d.boolean(),
		opinion: d.varchar({ length: 20 }),
		opinionDate: d.varchar({ length: 10 }),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [
		unique("cse_opinion_decl_number_type_idx").on(
			t.declarationId,
			t.declarationNumber,
			t.type,
		),
		index("cse_opinion_declaration_idx").on(t.declarationId),
	],
);

export const cseOpinionsRelations = relations(cseOpinions, ({ one }) => ({
	declaration: one(declarations, {
		fields: [cseOpinions.declarationId],
		references: [declarations.id],
	}),
}));

// ── Files (CSE opinion + joint evaluation) ─────────────────────────

export const fileTypeEnum = pgEnum("file_type", [
	"cse_opinion",
	"joint_evaluation",
]);

export const files = createTable(
	"file",
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
		fileName: d.varchar({ length: 255 }).notNull(),
		filePath: d.varchar({ length: 500 }).notNull(),
		uploadedAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		type: fileTypeEnum().notNull(),
	}),
	(t) => [
		index("file_declaration_idx").on(t.declarationId),
		uniqueIndex("file_joint_eval_unique")
			.on(t.declarationId)
			.where(sql`"type" = 'joint_evaluation'`),
	],
);

export const filesRelations = relations(files, ({ one, many }) => ({
	declaration: one(declarations, {
		fields: [files.declarationId],
		references: [declarations.id],
	}),
	cseOpinionFiles: many(cseOpinionFiles),
}));

// ── CSE opinion file associations ──────────────────────────────────

export const cseOpinionFiles = createTable(
	"cse_opinion_file",
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
		declarationNumber: d.integer().notNull(),
		type: d.varchar({ length: 20 }).notNull(),
		fileId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => files.id, { onDelete: "cascade" }),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [
		unique("cse_opinion_file_decl_number_type_idx").on(
			t.declarationId,
			t.declarationNumber,
			t.type,
		),
		index("cse_opinion_file_declaration_idx").on(t.declarationId),
	],
);

export const cseOpinionFilesRelations = relations(
	cseOpinionFiles,
	({ one }) => ({
		declaration: one(declarations, {
			fields: [cseOpinionFiles.declarationId],
			references: [declarations.id],
		}),
		file: one(files, {
			fields: [cseOpinionFiles.fileId],
			references: [files.id],
		}),
	}),
);

// ── Campaign deadlines (configurable per year) ────────────────────

export const campaignDeadlines = createTable("campaign_deadline", (d) => ({
	year: d.integer().notNull().primaryKey(),
	// Campaign milestones
	gipPublicationDate: d.date(),
	campaignStartDate: d.date(),
	// Declaration 1
	decl1ModificationDeadline: d.date().notNull(),
	decl1JustificationDeadline: d.date().notNull(),
	decl1JointEvaluationDeadline: d.date().notNull(),
	// Declaration 2
	decl2ModificationDeadline: d.date().notNull(),
	decl2JustificationDeadline: d.date().notNull(),
	decl2JointEvaluationDeadline: d.date().notNull(),
}));

// ── Global settings (singleton) ────────────────────────────────────

/**
 * Global platform settings. Single-row table (`id = 1`).
 *
 * Values here are free of retention constraints: they drive campaign
 * behaviour (active year) rather than recording user actions.
 */
export const globalSettings = createTable("global_setting", (d) => ({
	id: d.integer().notNull().primaryKey().default(1),
	activeCampaignYear: d.integer(),
	updatedAt: d
		.timestamp({ withTimezone: true })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedBy: d.varchar({ length: 255 }).references(() => users.id),
}));

// ── Admin impersonation audit log ───────────────────────────────────

/**
 * Audit trail of admin impersonation sessions.
 *
 * Each row records an admin "mimoquing" a company: `startedAt` is set at
 * session start, `stoppedAt` when the admin explicitly stops (or stays NULL
 * if the admin never stopped before logging out). Used both for audit/RGPD
 * and as the source for the "recently impersonated" quick-pick list in the
 * backoffice UI.
 */
export const adminImpersonationEvents = createTable(
	"admin_impersonation_event",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		adminUserId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		siren: d
			.varchar({ length: 9 })
			.notNull()
			.references(() => companies.siren),
		startedAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
		stoppedAt: d.timestamp({ withTimezone: true }),
	}),
	(t) => [
		index("admin_impersonation_event_admin_started_idx").on(
			t.adminUserId,
			t.startedAt,
		),
	],
);

// ── Referent tables ───────────────────────────────────────────────

export const referentTypeEnum = pgEnum("referent_type", ["email", "url"]);

export const referents = createTable(
	"referent",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		region: d.varchar({ length: 3 }).notNull(),
		county: d.varchar({ length: 3 }),
		name: d.varchar({ length: 255 }).notNull(),
		type: referentTypeEnum().notNull(),
		value: d.varchar({ length: 500 }).notNull(),
		principal: d.boolean().notNull().default(false),
		substituteName: d.varchar({ length: 255 }),
		substituteEmail: d.varchar({ length: 255 }),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [index("referent_region_idx").on(t.region)],
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
		// Keep in sync with EXPORT_VERSION in modules/export/shared/constants.ts
		version: d.varchar({ length: 10 }).notNull().default("v1"),
		fileName: d.varchar({ length: 255 }).notNull(),
		s3Key: d.varchar({ length: 500 }).notNull(),
		rowCount: d.integer().notNull(),
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [unique("export_year_version_idx").on(t.year, t.version)],
);
