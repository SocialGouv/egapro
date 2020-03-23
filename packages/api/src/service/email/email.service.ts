import { createTransport, SentMessageInfo } from "nodemailer";
import { configuration } from "../../configuration";
import { logger } from "../../util";

export interface EmailAddress {
  email: string;
  name: string;
}

export interface Email {
  to: EmailAddress[];
  bcc: EmailAddress[];
  cci: EmailAddress[];
  subject: string;
  bodyText: string;
  html?: string;
}

const transporter = createTransport({
  host: configuration.mailHost,
  port: configuration.mailPort,
  secure: configuration.mailUseTLS, // true for 465, false for other ports
  // tslint:disable-next-line: object-literal-sort-keys
  auth: {
    user: configuration.mailUsername,
    // tslint:disable-next-line: object-literal-sort-keys
    pass: configuration.mailPassword,
  },
});

export interface EmailService {
  sendEmail: (email: Email) => Promise<SentMessageInfo>;
}

// https://github.com/nodemailer/nodemailer/blob/master/examples/sendmail.js
export const emailService: EmailService = {
  sendEmail: (email: Email) => {
    logger.info(`[EmailService.sendEmail] subject ${email.subject}`);
    const message = {
      from: configuration.mailFrom,
      to: email.to.map((r: EmailAddress) => `${r.name} <${r.email}>`).join(","),
      // tslint:disable-next-line: object-literal-sort-keys
      bcc: email.bcc
        .map((r: EmailAddress) => `${r.name} <${r.email}>`)
        .join(","),
      subject: email.subject,
      text: email.bodyText,
      html: email.html,
    };
    return transporter.sendMail(message);
  },
};
