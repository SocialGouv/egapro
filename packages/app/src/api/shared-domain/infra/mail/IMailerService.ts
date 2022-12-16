import type { Any, SimpleObject } from "@common/utils/types";
import type { SendMailOptions } from "nodemailer";

import type { MailTemplate } from "./type";

export type Templates = SimpleObject<(...args: Any[]) => MailTemplate>;

export interface IMailerService<TTemplate extends Templates> {
  init(): Promise<void>;
  sendMail<T extends keyof TTemplate>(
    tpl: T,
    // TODO do not use specific "nodemailer" type
    options: SendMailOptions,
    ...args: Parameters<TTemplate[T]>
  ): Promise<[accepted: string[], rejected: string[]]>;
}
