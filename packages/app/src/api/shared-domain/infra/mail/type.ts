import type { Attachment } from "nodemailer/lib/mailer";

export type MailTemplate = {
  // TODO do not use specific "nodemailer" type
  attachments?: Attachment[];
  html: string;
  subject: string;
  text: string;
};
