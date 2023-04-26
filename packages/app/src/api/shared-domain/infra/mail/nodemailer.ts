import { config } from "@common/config";
import { type SendMailOptions } from "nodemailer";
import { createTransport } from "nodemailer";
import SMTPConnection from "nodemailer/lib/smtp-connection";

const mailerConfig: SMTPConnection.Options = {
  host: config.api.mailer.host,
  port: config.api.mailer.smtp.port,
  secure: config.api.mailer.smtp.ssl,
  auth: {
    user: config.api.mailer.smtp.login,
    pass: config.api.mailer.smtp.password,
  },
};
export const mailer = createTransport(mailerConfig);

export const verifyMailerConnection = async (): Promise<void> => {
  const connection = new SMTPConnection(mailerConfig);
  await new Promise<void>((resolve, reject) => {
    connection.connect(err => {
      connection.removeAllListeners();
      connection.close();
      if (err) reject(err);
      else resolve();
    });

    connection.once("error", err => {
      connection.removeAllListeners();
      connection.close();
      reject(err);
    });
  });
};

export const defaultSendMailConfig: SendMailOptions = {
  from: config.api.mailer.from,
};
