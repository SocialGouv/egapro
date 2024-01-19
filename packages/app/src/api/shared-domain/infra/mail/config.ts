import { config } from "@common/config";
import type SMTPConnection from "nodemailer/lib/smtp-connection";

export const mailerConfig: SMTPConnection.Options = {
  host: config.api.mailer.host,
  port: config.api.mailer.smtp.port,
  secure: config.api.mailer.smtp.ssl,
  tls: {
    ciphers:'SSLv3'
  },
  ...(config.api.mailer.smtp.login && config.api.mailer.smtp.password
    ? {
        auth: {
          user: config.api.mailer.smtp.login,
          pass: config.api.mailer.smtp.password,
        },
      }
    : {}),
};
