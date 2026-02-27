import { relations } from "drizzle-orm";
import {
	index,
	numeric,
	pgTableCreator,
	primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
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
	firstName: d.varchar("first_name", { length: 255 }),
	lastName: d.varchar("last_name", { length: 255 }),
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

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
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
		womenValue: numeric("women_value"),
		menValue: numeric("men_value"),
		womenMedianValue: numeric("women_median_value"),
		menMedianValue: numeric("men_median_value"),
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
