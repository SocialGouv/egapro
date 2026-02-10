import {
  boolean,
  char,
  customType,
  inet,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// --- Custom postgres types ---------------------------------------------------

/** PostgreSQL tsvector type (used for full-text search). */
export const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// --- Public schema -----------------------------------------------------------

export const ownership = pgTable(
  "ownership",
  {
    siren: text("siren").notNull(),
    email: text("email").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.siren, t.email] }),
  }),
);

export const ownershipRequest = pgTable("ownership_request", {
  id: uuid("id")
    .default(sql`uuid_generate_v4()`)
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  modified_at: timestamp("modified_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  siren: text("siren"),
  email: text("email"),
  asker_email: text("asker_email").notNull(),
  status: text("status").notNull(),
  error_detail: jsonb("error_detail"),
});

export const declaration = pgTable(
  "declaration",
  {
    siren: text("siren").notNull(),
    year: integer("year").notNull(),
    modified_at: timestamp("modified_at", { withTimezone: true }),
    declared_at: timestamp("declared_at", { withTimezone: true }),
    declarant: text("declarant"),
    data: jsonb("data"),
    draft: jsonb("draft"),
    legacy: jsonb("legacy"),
    ft: tsvector("ft"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.siren, t.year] }),
  }),
);

export const representationEquilibree = pgTable(
  "representation_equilibree",
  {
    siren: text("siren").notNull(),
    year: integer("year").notNull(),
    modified_at: timestamp("modified_at", { withTimezone: true }),
    declared_at: timestamp("declared_at", { withTimezone: true }),
    data: jsonb("data"),
    ft: tsvector("ft"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.siren, t.year] }),
  }),
);

export const simulation = pgTable("simulation", {
  id: uuid("id").notNull(),
  modified_at: timestamp("modified_at", { withTimezone: true }),
  data: jsonb("data"),
});

export const search = pgTable(
  "search",
  {
    siren: text("siren").notNull(),
    year: integer("year").notNull(),
    declared_at: timestamp("declared_at", { withTimezone: true }),
    ft: tsvector("ft"),
    region: varchar("region", { length: 2 }),
    departement: varchar("departement", { length: 3 }),
    section_naf: char("section_naf", { length: 1 }),
    note: integer("note"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.siren, t.year] }),
  }),
);

export const searchRepresentationEquilibree = pgTable(
  "search_representation_equilibree",
  {
    siren: text("siren").notNull(),
    year: integer("year").notNull(),
    declared_at: timestamp("declared_at", { withTimezone: true }),
    ft: tsvector("ft"),
    region: varchar("region", { length: 2 }),
    departement: varchar("departement", { length: 3 }),
    section_naf: char("section_naf", { length: 1 }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.siren, t.year] }),
  }),
);

export const archive = pgTable("archive", {
  siren: text("siren").notNull(),
  year: integer("year").notNull(),
  at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
  by: text("by"),
  ip: inet("ip"),
  data: jsonb("data"),
});

export const referent = pgTable("referent", {
  id: uuid("id")
    .default(sql`uuid_generate_v4()`)
    .notNull(),
  name: text("name").notNull(),
  principal: boolean("principal").notNull(),
  region: text("region").notNull(),
  county: text("county"),
  type: text("type").notNull(),
  value: text("value").notNull(),
  substitute_email: text("substitute_email"),
  substitute_name: text("substitute_name"),
});

// --- audit schema ------------------------------------------------------------

export const audit = pgSchema("audit");

export const auditQueryLog = audit.table("query_log", {
  username: text("username"),
  operation: text("operation").notNull(),
  table_name: text("table_name").notNull(),
  query: text("query").notNull(),
  params: jsonb("params").notNull(),
  result_count: integer("result_count"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
