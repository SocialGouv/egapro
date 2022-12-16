import type { IMailerService } from "@api/shared-domain/infra/mail/IMailerService";

import type * as templates from "./templates";

export type IGlobalMailerService = IMailerService<typeof templates>;
