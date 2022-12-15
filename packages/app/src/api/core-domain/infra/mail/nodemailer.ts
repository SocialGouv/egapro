import { config } from "@common/config";
import type { SendMailOptions } from "nodemailer";
import { createTransport } from "nodemailer";

export const mailer = createTransport({
  host: config.api.mailer.host,
  port: config.api.mailer.smtp.port,
  secure: config.api.mailer.smtp.ssl,
  auth: {
    user: config.api.mailer.smtp.login,
    pass: config.api.mailer.smtp.password,
  },
});

export const defaultSendMailConfig: SendMailOptions = {
  from: config.api.mailer.from,
};
