import { relations } from "drizzle-orm";
import { index, pgTableCreator, primaryKey, unique } from "drizzle-orm/pg-core";
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
		createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
		updatedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
	}),
	(t) => [
		primaryKey({ columns: [t.siren, t.year] }),
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
		categories: many(declarationCategories),
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
}));

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
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
