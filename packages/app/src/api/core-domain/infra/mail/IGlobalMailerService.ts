import type { IMailerService } from "@api/shared-domain/infra/mail/IMailerService";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- used in doc
import * as templates from "./templates";

/**
 * Generic interface for the global mailer service. Implement it with a dedicated mailer lib like nodemailer.
 *
 * "Global" means that it will send every time of emails generally speaking.
 *
 * It relies on {@link templates}.
 */
export type IGlobalMailerService = IMailerService<typeof templates>;
