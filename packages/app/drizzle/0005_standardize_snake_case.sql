-- Standardize all column names to snake_case.
-- Drizzle now uses casing: "snake_case" to auto-convert camelCase properties to snake_case columns.

-- app_user
ALTER TABLE "app_user" RENAME COLUMN "emailVerified" TO "email_verified";--> statement-breakpoint

-- app_account
ALTER TABLE "app_account" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "app_account" RENAME COLUMN "providerAccountId" TO "provider_account_id";--> statement-breakpoint

-- app_session
ALTER TABLE "app_session" RENAME COLUMN "sessionToken" TO "session_token";--> statement-breakpoint
ALTER TABLE "app_session" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint

-- app_declaration
ALTER TABLE "app_declaration" RENAME COLUMN "declarantId" TO "declarant_id";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME COLUMN "totalWomen" TO "total_women";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME COLUMN "totalMen" TO "total_men";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME COLUMN "remunerationScore" TO "remuneration_score";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME COLUMN "variableRemunerationScore" TO "variable_remuneration_score";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME COLUMN "quartileScore" TO "quartile_score";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME COLUMN "categoryScore" TO "category_score";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME COLUMN "currentStep" TO "current_step";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint

-- app_declaration_category
ALTER TABLE "app_declaration_category" RENAME COLUMN "categoryName" TO "category_name";--> statement-breakpoint
ALTER TABLE "app_declaration_category" RENAME COLUMN "womenCount" TO "women_count";--> statement-breakpoint
ALTER TABLE "app_declaration_category" RENAME COLUMN "menCount" TO "men_count";--> statement-breakpoint

-- app_company
ALTER TABLE "app_company" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "app_company" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint

-- app_user_company
ALTER TABLE "app_user_company" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "app_user_company" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint

-- Rename foreign key constraints to match new column names
ALTER TABLE "app_account" RENAME CONSTRAINT "app_account_userId_app_user_id_fk" TO "app_account_user_id_app_user_id_fk";--> statement-breakpoint
ALTER TABLE "app_session" RENAME CONSTRAINT "app_session_userId_app_user_id_fk" TO "app_session_user_id_app_user_id_fk";--> statement-breakpoint
ALTER TABLE "app_declaration" RENAME CONSTRAINT "app_declaration_declarantId_app_user_id_fk" TO "app_declaration_declarant_id_app_user_id_fk";--> statement-breakpoint
ALTER TABLE "app_user_company" RENAME CONSTRAINT "app_user_company_userId_app_user_id_fk" TO "app_user_company_user_id_app_user_id_fk";--> statement-breakpoint

-- Rename composite primary key constraints
ALTER TABLE "app_account" RENAME CONSTRAINT "app_account_provider_providerAccountId_pk" TO "app_account_provider_provider_account_id_pk";--> statement-breakpoint
ALTER TABLE "app_user_company" RENAME CONSTRAINT "app_user_company_userId_siren_pk" TO "app_user_company_user_id_siren_pk";
