import { services } from "@common/config";

import type { IGlobalMailerService } from "./IGlobalMailerService";
import { NodemailerGlobalMailerService } from "./impl/NodemailerGlobalMailerService";
import * as templates from "./templates";

export let globalMailerService: IGlobalMailerService;

if (services.mailer === "nodemailer") {
  globalMailerService = new NodemailerGlobalMailerService(templates);
}
